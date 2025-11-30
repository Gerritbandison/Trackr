/**
 * Two-Factor Authentication (2FA) Utilities
 * TOTP-based authentication compatible with Google Authenticator, Authy, etc.
 */

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count = 10) {
  const codes = [];
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes similar characters
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
      if (j === 3) code += '-'; // Format: XXXX-XXXX
    }
    codes.push(code);
  }
  
  return codes;
}

/**
 * Format secret key for display (groups of 4)
 */
export function formatSecretKey(secret) {
  if (!secret) return '';
  
  // Remove any existing spaces
  const cleaned = secret.replace(/\s/g, '');
  
  // Group into chunks of 4
  const chunks = cleaned.match(/.{1,4}/g) || [];
  return chunks.join(' ');
}

/**
 * Validate TOTP code format
 */
export function validateTOTPFormat(code) {
  // TOTP codes are typically 6 digits
  const cleaned = code.replace(/\s/g, '');
  return /^\d{6}$/.test(cleaned);
}

/**
 * Validate backup code format
 */
export function validateBackupCodeFormat(code) {
  // Backup codes are XXXX-XXXX format
  const cleaned = code.replace(/\s/g, '');
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned);
}

/**
 * Generate QR code URL for authenticator apps
 */
export function generate2FAQRCodeURL(username, secret, issuer = 'Trackr ITAM') {
  // otpauth://totp/Issuer:Username?secret=SECRET&issuer=Issuer
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedUsername = encodeURIComponent(username);
  const encodedSecret = encodeURIComponent(secret);
  
  return `otpauth://totp/${encodedIssuer}:${encodedUsername}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
}

/**
 * Check if user has 2FA enabled
 */
export function is2FAEnabled(user) {
  return user?.twoFactorEnabled === true;
}

/**
 * Check if 2FA is required for user role
 */
export function is2FARequired(user) {
  // Require 2FA for admin and manager roles
  return user?.role === 'admin' || user?.role === 'manager';
}

/**
 * Calculate time remaining until TOTP expires
 */
export function getTOTPTimeRemaining() {
  const now = Math.floor(Date.now() / 1000);
  const period = 30; // TOTP period in seconds
  const remaining = period - (now % period);
  return remaining;
}

/**
 * Get 2FA status badge variant
 */
export function get2FAStatusVariant(user) {
  if (is2FAEnabled(user)) {
    return 'success';
  }
  if (is2FARequired(user)) {
    return 'danger';
  }
  return 'warning';
}

/**
 * Get 2FA status text
 */
export function get2FAStatusText(user) {
  if (is2FAEnabled(user)) {
    return 'Enabled';
  }
  if (is2FARequired(user)) {
    return 'Required';
  }
  return 'Disabled';
}

/**
 * Downloadable backup codes as text file
 */
export function downloadBackupCodes(codes, username) {
  const content = [
    `Trackr ITAM - Two-Factor Authentication Backup Codes`,
    `User: ${username}`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
    `IMPORTANT: Store these codes in a secure location.`,
    `Each code can only be used once.`,
    ``,
    `Backup Codes:`,
    ``,
    ...codes,
    ``,
    `If you lose access to your authenticator app, you can use one`,
    `of these codes to log in and disable 2FA.`,
  ].join('\n');
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `backup-codes-${username}-${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generateBackupCodes,
  formatSecretKey,
  validateTOTPFormat,
  validateBackupCodeFormat,
  generate2FAQRCodeURL,
  is2FAEnabled,
  is2FARequired,
  getTOTPTimeRemaining,
  get2FAStatusVariant,
  get2FAStatusText,
  downloadBackupCodes,
};

