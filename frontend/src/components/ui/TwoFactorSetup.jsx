import { useState } from 'react';
import { FiShield, FiKey, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';
import QRCodeGenerator from './QRCodeGenerator';
import Badge from './Badge';
import {
  generateBackupCodes,
  formatSecretKey,
  validateTOTPFormat,
  generate2FAQRCodeURL,
  downloadBackupCodes,
} from '../../utils/twoFactorAuth';
import toast from 'react-hot-toast';

const TwoFactorSetup = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: QR, 2: Verify, 3: Backup Codes
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
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
    toast.success('Backup codes downloaded');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Scan QR Code' },
          { num: 2, label: 'Verify' },
          { num: 3, label: 'Backup Codes' },
        ].map((s, index) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s.num
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s.num ? <FiCheck /> : s.num}
              </div>
              <span className={`text-sm font-medium ${
                step >= s.num ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-1 mx-4 rounded ${
                step > s.num ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Scan QR Code */}
      {step === 1 && (
        <div className="card">
          <div className="card-header bg-gradient-to-r from-primary-50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FiShield className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1: Scan QR Code</h3>
                <p className="text-sm text-gray-600">Use your authenticator app to scan this QR code</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <QRCodeGenerator value={qrCodeURL} size={200} includeText={false} />
              </div>

              <p className="text-sm text-gray-600 mt-4 text-center max-w-md">
                Scan this QR code with Google Authenticator, Authy, Microsoft Authenticator,
                or any TOTP-compatible app.
              </p>

              {/* Manual Entry */}
              <div className="mt-6 w-full bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Can't scan? Enter manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm">
                    {formatSecretKey(secretKey)}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="btn btn-sm btn-outline flex items-center gap-2"
                  >
                    {secretKeyCopied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                    {secretKeyCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="btn btn-primary mt-6 px-8"
              >
                I've Scanned the Code →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 2 && (
        <div className="card">
          <div className="card-header bg-gradient-to-r from-green-50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiKey className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 2: Verify Code</h3>
                <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="input text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code shown in your authenticator app
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-outline px-6"
                >
                  ← Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={!validateTOTPFormat(verificationCode)}
                  className="btn btn-primary px-8"
                >
                  Verify Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && (
        <div className="card">
          <div className="card-header bg-gradient-to-r from-amber-50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FiShield className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 3: Save Backup Codes</h3>
                <p className="text-sm text-gray-600">Store these codes in a secure location</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <FiShield className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Important: Save Your Backup Codes</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-800">
                    <li>Each code can only be used once</li>
                    <li>Use these if you lose access to your authenticator app</li>
                    <li>Store them in a password manager or secure location</li>
                    <li>Do not share these codes with anyone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center"
                >
                  <code className="font-mono text-sm font-semibold text-gray-900">
                    {code}
                  </code>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleDownloadCodes}
                className="btn btn-outline flex items-center gap-2 w-full max-w-xs"
              >
                <FiDownload size={18} />
                Download Codes
              </button>

              <button
                onClick={handleComplete}
                className="btn btn-primary px-8"
              >
                Complete Setup
              </button>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel Setup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;

