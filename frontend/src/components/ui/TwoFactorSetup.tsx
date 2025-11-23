import { useState } from 'react';
import { FiShield, FiKey, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import Badge from './Badge';
import {
  generateBackupCodes,
  formatSecretKey,
  validateTOTPFormat,
  generate2FAQRCodeURL,
  downloadBackupCodes,
} from '../../utils/twoFactorAuth';
import toast from 'react-hot-toast';

interface User {
  email?: string;
  name?: string;
  [key: string]: any;
}

interface TwoFactorSetupProps {
  user: User;
  onComplete?: (data: { secretKey: string; backupCodes: string[] }) => void;
  onCancel?: () => void;
}

const TwoFactorSetup = ({ user, onComplete, onCancel }: TwoFactorSetupProps) => {
  const [step, setStep] = useState(1); // 1: QR, 2: Verify, 3: Backup Codes
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [secretKeyCopied, setSecretKeyCopied] = useState(false);
  
  // Simulated secret key (in production, this would come from backend)
  const [secretKey] = useState('JBSWY3DPEHPK3PXP'); // Example secret
  
  const qrCodeURL = generate2FAQRCodeURL(user?.email || 'user@example.com', secretKey);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setSecretKeyCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setSecretKeyCopied(false), 3000);
  };

  const handleVerify = () => {
    if (!validateTOTPFormat(verificationCode)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    // In production, verify with backend
    // For now, simulate verification
    const codes = generateBackupCodes(10);
    setBackupCodes(codes);
    setStep(3);
    toast.success('2FA verified successfully!');
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({ secretKey, backupCodes });
    }
  };

  const handleDownloadCodes = () => {
    downloadBackupCodes(backupCodes, user?.email || 'user');
  };

  return (
    <div className="space-y-6">
      {/* Step 1: QR Code Setup */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scan QR Code
            </h3>
            <p className="text-sm text-gray-600">
              Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <QRCodeSVG value={qrCodeURL} size={200} level="H" includeMargin={true} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter this code manually:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded font-mono text-sm">
                  {formatSecretKey(secretKey)}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="btn btn-outline btn-sm flex items-center gap-2"
                >
                  {secretKeyCopied ? (
                    <>
                      <FiCheck size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <FiCopy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <button onClick={onCancel} className="btn btn-outline">
                Cancel
              </button>
            )}
            <button onClick={() => setStep(2)} className="btn btn-primary">
              Next: Verify Code
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Verification */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verify Setup
            </h3>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              className="input text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(1)} className="btn btn-outline">
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
              className="btn btn-primary"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Setup Complete!
            </h3>
            <p className="text-sm text-gray-600">
              Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiShield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important Security Notice</p>
                <p>
                  These backup codes are only shown once. Make sure to save them securely. 
                  Each code can only be used once.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="px-3 py-2 bg-white rounded border border-gray-200 text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleDownloadCodes}
              className="btn btn-outline flex items-center gap-2"
            >
              <FiDownload size={16} />
              Download Codes
            </button>
            <button onClick={handleComplete} className="btn btn-primary">
              Complete Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;

