import { Request, Response, NextFunction } from 'express';
import HistoryLog from '../../modules/history/history.model';

// Extend Request to include user info (mocked for now as we don't have full auth)
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export const auditMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Only intercept state-changing methods
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
    }

    // Capture the original send function to intercept the response
    const originalSend = res.json;

    // Mock Actor ID - in production this comes from req.user
    const actorId = req.user?.id || 'system-admin';

    // We need to capture the resource ID. 
    // For PUT/DELETE it's usually in params. For POST it might be in the response or not applicable yet.
    const resourceId = req.params.id;

    // Determine Resource Type from URL (simple heuristic)
    // e.g., /api/assets/123 -> Asset
    const resourceType = req.baseUrl.split('/').pop()?.replace(/s$/, '') || 'Resource'; // assets -> asset

    // For UPDATE (PUT), we might want to fetch the previous value *before* the operation.
    // However, doing that generically is complex without knowing the Service/Model.
    // For this simplified implementation, we will log the *intent* and the *payload*.

    // Intercept the response to ensure operation was successful before logging
    res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Operation successful, log it
            const action = req.method === 'POST' ? 'CREATE' : req.method === 'PUT' ? 'UPDATE' : 'DELETE';

            // For POST, the new ID is likely in the body
            const finalResourceId = resourceId || body?.data?._id || body?.data?.id || 'unknown';

            try {
                HistoryLog.create({
                    actorId,
                    action,
                    resourceType: resourceType.charAt(0).toUpperCase() + resourceType.slice(1), // Capitalize
                    resourceId: finalResourceId,
                    newValue: req.body, // Log the payload as new value
                    // previousValue: ... // fetching previous value requires pre-hook or specific service logic
                }).catch(err => console.error('Audit Log Error:', err));
            } catch (err) {
                console.error('Audit Log Error:', err);
            }
        }

        return originalSend.call(this, body);
    };

    next();
};
