import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiShield, 
  FiCheck, 
  FiX,
  FiAlertCircle,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import TwoFactorSetup from '../../components/ui/TwoFactorSetup';
import {
  is2FAEnabled,
  is2FARequired,
  get2FAStatusVariant,
  get2FAStatusText,
} from '../../utils/twoFactorAuth';
import toast from 'react-hot-toast';

const TwoFactorSettings = () => {
  const { user } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const handle2FASetupComplete = (data) => {
    // In production, save to backend
    if (import.meta.env.DEV) {
      console.log('2FA Setup complete:', data);
    }
    toast.success('Two-Factor Authentication enabled successfully!');
    setShowSetupModal(false);
    // Refresh user data
  };

  const handleDisable2FA = () => {
    // In production, call backend API
    toast.success('Two-Factor Authentication disabled');
    setShowDisableConfirm(false);
    // Refresh user data
  };

  const enabled = is2FAEnabled(user);
  const required = is2FARequired(user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Current Status */}
      <div className={`card border-l-4 ${
        enabled ? 'border-green-500 bg-gradient-to-r from-green-50 to-white' :
        required ? 'border-red-500 bg-gradient-to-r from-red-50 to-white' :
        'border-gray-300'
      }`}>
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${
                enabled ? 'bg-green-100' :
                required ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                {enabled ? (
                  <FiLock className="text-green-600" size={32} />
                ) : (
                  <FiUnlock className="text-gray-600" size={32} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    2FA Status: 
                  </h3>
                  <Badge variant={get2FAStatusVariant(user)} size="lg">
                    {get2FAStatusText(user)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {enabled 
                    ? 'Your account is protected with two-factor authentication'
                    : required
                    ? 'Two-factor authentication is required for your role'
                    : 'Consider enabling 2FA for additional security'
                  }
                </p>
              </div>
            </div>
            <div>
              {!enabled ? (
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FiShield size={18} />
                  Enable 2FA
                </button>
              ) : (
                <button
                  onClick={() => setShowDisableConfirm(true)}
                  disabled={required}
                  className="btn btn-outline flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <FiX size={18} />
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Required Notice */}
      {required && !enabled && (
        <div className="card border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Action Required</h4>
                <p className="text-sm text-red-800">
                  Two-factor authentication is required for {user?.role} users. 
                  Please enable 2FA to maintain account access and comply with security policies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">How Two-Factor Authentication Works</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Install App</h4>
              <p className="text-sm text-gray-600">
                Download Google Authenticator, Authy, or Microsoft Authenticator on your phone
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Scan Code</h4>
              <p className="text-sm text-gray-600">
                Use the app to scan the QR code we provide during setup
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Login Securely</h4>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code from your app each time you log in
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Why Enable 2FA?</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-medium text-gray-900">Enhanced Security</h4>
                <p className="text-sm text-gray-600">
                  Protects your account even if your password is compromised
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-medium text-gray-900">Prevent Unauthorized Access</h4>
                <p className="text-sm text-gray-600">
                  Requires physical access to your phone to log in
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-medium text-gray-900">Compliance Ready</h4>
                <p className="text-sm text-gray-600">
                  Meets SOC 2, HIPAA, and PCI-DSS security requirements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-medium text-gray-900">Industry Standard</h4>
                <p className="text-sm text-gray-600">
                  Compatible with all major authenticator apps
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Enable Two-Factor Authentication"
        size="lg"
      >
        <TwoFactorSetup
          user={user}
          onComplete={handle2FASetupComplete}
          onCancel={() => setShowSetupModal(false)}
        />
      </Modal>

      {/* Disable Confirmation Modal */}
      <Modal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Security Warning</p>
                <p>
                  Disabling two-factor authentication will make your account less secure.
                  Anyone with your password will be able to access your account.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700">
            Are you sure you want to disable two-factor authentication?
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDisableConfirm(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable2FA}
              className="btn btn-danger"
            >
              Yes, Disable 2FA
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TwoFactorSettings;

