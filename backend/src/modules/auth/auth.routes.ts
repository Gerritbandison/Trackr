import { Router, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../users/user.model';
import { authenticate, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../../core/schemas/auth.schemas';
import logger from '../../core/utils/logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// ============================================
// Helper Functions
// ============================================

const generateToken = (userId: string, role: string, type: 'access' | 'refresh' = 'access'): string => {
    const expiresIn = type === 'refresh' ? REFRESH_TOKEN_EXPIRE : JWT_EXPIRE;
    return jwt.sign(
        { id: userId, role, type },
        JWT_SECRET,
        { expiresIn } as SignOptions
    );
};

const generateTokenPair = (userId: string, role: string) => ({
    accessToken: generateToken(userId, role, 'access'),
    refreshToken: generateToken(userId, role, 'refresh'),
    expiresIn: JWT_EXPIRE
});

// ============================================
// Public Routes
// ============================================

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, role, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            ApiResponse.badRequest(res, 'User with this email already exists');
            return;
        }

        // Create new user
        const user = new User({
            email,
            password,
            name,
            role: role || 'staff',
            department,
            authProvider: 'local'
        });

        await user.save();

        // Generate tokens
        const tokens = generateTokenPair(user._id.toString(), user.role);

        logger.info(`New user registered: ${email} (${role || 'staff'})`);

        ApiResponse.created(res, {
            ...tokens,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department
            }
        }, 'User registered successfully');
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // Use same error for both cases to prevent user enumeration
            ApiResponse.unauthorized(res, 'Invalid email or password');
            return;
        }

        // Check if account is active
        if (!user.isActive) {
            logger.warn(`Login attempt for deactivated account: ${email}`);
            ApiResponse.unauthorized(res, 'Account is deactivated. Please contact administrator.');
            return;
        }

        // Check if this is an Azure AD user trying to use local login
        if (user.authProvider === 'azure-ad') {
            ApiResponse.badRequest(res, 'This account uses Azure AD authentication. Please sign in with Microsoft.');
            return;
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.warn(`Failed login attempt for: ${email}`);
            ApiResponse.unauthorized(res, 'Invalid email or password');
            return;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokens = generateTokenPair(user._id.toString(), user.role);

        logger.info(`User logged in: ${email}`);

        ApiResponse.success(res, {
            ...tokens,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                twoFactorEnabled: user.twoFactorEnabled
            }
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user (client-side token removal, server logs it)
 * @access Private
 */
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user) {
            logger.info(`User logged out: ${req.user.email}`);
        }
        
        // In a production app, you might want to:
        // 1. Add the token to a blacklist (Redis)
        // 2. Clear refresh token from database
        // For now, we just acknowledge the logout

        ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
});

// ============================================
// Protected Routes
// ============================================

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            ApiResponse.unauthorized(res, 'Not authenticated');
            return;
        }

        // Get fresh user data with all fields
        const user = await User.findById(req.user._id)
            .select('-password -twoFactorSecret')
            .lean();

        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        ApiResponse.success(res, { user });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Private
 */
router.post('/refresh-token', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            ApiResponse.unauthorized(res, 'Not authenticated');
            return;
        }

        // Verify user still exists and is active
        const user = await User.findById(req.user._id);
        if (!user || !user.isActive) {
            ApiResponse.unauthorized(res, 'User not found or deactivated');
            return;
        }

        // Generate new token pair
        const tokens = generateTokenPair(user._id.toString(), user.role);

        ApiResponse.success(res, tokens, 'Token refreshed successfully');
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/v1/auth/update-password
 * @desc Update user password
 * @access Private
 */
router.put('/update-password', authenticate, validate(updatePasswordSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            ApiResponse.unauthorized(res, 'Not authenticated');
            return;
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        // Azure AD users cannot change password locally
        if (user.authProvider === 'azure-ad') {
            ApiResponse.badRequest(res, 'Azure AD users must change password through Microsoft');
            return;
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            ApiResponse.unauthorized(res, 'Current password is incorrect');
            return;
        }

        // Update password
        user.password = newPassword;
        await user.save();

        logger.info(`Password updated for user: ${user.email}`);

        // Generate new tokens (invalidate old sessions)
        const tokens = generateTokenPair(user._id.toString(), user.role);

        ApiResponse.success(res, tokens, 'Password updated successfully. Please use new tokens.');
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        
        // Always return success to prevent user enumeration
        if (!user) {
            ApiResponse.success(res, null, 'If an account with that email exists, a reset link has been sent.');
            return;
        }

        // Azure AD users cannot reset password locally
        if (user.authProvider === 'azure-ad') {
            ApiResponse.success(res, null, 'If an account with that email exists, a reset link has been sent.');
            return;
        }

        // TODO: Generate reset token and send email
        // const resetToken = crypto.randomBytes(32).toString('hex');
        // user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        // await user.save();
        // await sendResetEmail(email, resetToken);

        logger.info(`Password reset requested for: ${email}`);

        ApiResponse.success(res, null, 'If an account with that email exists, a reset link has been sent.');
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post('/reset-password', validate(resetPasswordSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;

        // TODO: Implement password reset with token
        // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        // const user = await User.findOne({
        //     resetPasswordToken: hashedToken,
        //     resetPasswordExpires: { $gt: Date.now() }
        // });

        // For now, return not implemented
        ApiResponse.badRequest(res, 'Password reset via email is not yet implemented. Please contact administrator.');
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/v1/auth/verify
 * @desc Verify if token is valid
 * @access Private
 */
router.get('/verify', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            ApiResponse.unauthorized(res, 'Invalid token');
            return;
        }

        ApiResponse.success(res, {
            valid: true,
            user: {
                id: req.user._id,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role
            }
        }, 'Token is valid');
    } catch (error) {
        next(error);
    }
});

export default router;
