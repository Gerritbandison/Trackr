import { FiX, FiAlertCircle, FiClock, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AlertModal = ({ isOpen, onClose, alerts }) => {
  if (!isOpen) return null;

  const { expiringLicenses = [], expiringWarranties = [], lowStock = [], eolAlerts = [] } = alerts || {};
  const totalAlerts = expiringLicenses.length + expiringWarranties.length + lowStock.length + eolAlerts.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-1/2 transform -translate-y-1/2 z-50 max-w-3xl mx-auto animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden m-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiAlertCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Attention Required</h2>
                  <p className="text-white/90 text-sm mt-1">
                    {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need your attention
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Expiring Licenses */}
            {expiringLicenses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiClock className="text-orange-600" />
                  Licenses Expiring Soon ({expiringLicenses.length})
                </h3>
                <div className="space-y-2">
                  {expiringLicenses.map((license) => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Link
                        key={license._id || license.id || `license-${expiringLicenses.indexOf(license)}`}
                        to={`/licenses/${license._id || license.id}`}
                        onClick={onClose}
                        className="block p-4 border border-orange-200 rounded-lg hover:shadow-md transition-all bg-orange-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{license.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {license.vendor} • {license.totalSeats} seats
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                              {daysUntilExpiry} days
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              Expires {new Date(license.expirationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expiring Warranties */}
            {expiringWarranties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiAlertCircle className="text-red-600" />
                  Warranties Expiring Soon ({expiringWarranties.length})
                </h3>
                <div className="space-y-2">
                  {expiringWarranties.map((asset) => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Link
                        key={asset._id || asset.id || `warranty-${expiringWarranties.indexOf(asset)}`}
                        to={`/assets/${asset._id || asset.id}`}
                        onClick={onClose}
                        className="block p-4 border border-red-200 rounded-lg hover:shadow-md transition-all bg-red-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {asset.category} • {asset.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              {daysUntilExpiry} days
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              Expires {new Date(asset.warrantyExpiry).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* End-of-Life Alerts */}
            {eolAlerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiAlertTriangle className="text-purple-600" />
                  Assets Approaching End-of-Life ({eolAlerts.length})
                </h3>
                <div className="space-y-2">
                  {eolAlerts.map((asset, index) => (
                    <Link
                      key={asset._id || asset.id || `eol-${index}`}
                      to={`/assets/${asset._id || asset.id}`}
                      onClick={onClose}
                      className="block p-4 border border-purple-200 rounded-lg hover:shadow-md transition-all bg-purple-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {asset.category} • {asset.manufacturer} {asset.model}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {asset.eolStatus.yearsOld} years old
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            asset.eolStatus.severity === 'critical' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {asset.eolStatus.isPastEOL ? 'Past EOL' : `${asset.eolStatus.monthsUntilEOL}mo`}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            {asset.eolStatus.message}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStock.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiPackage className="text-amber-600" />
                  Low Stock Alerts ({lowStock.length})
                </h3>
                <div className="space-y-2">
                  {lowStock.map((alert, index) => (
                    <div
                      key={alert.groupId || alert.id || `low-stock-${index}`}
                      className="p-4 border border-amber-200 rounded-lg bg-amber-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{alert.group}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Only {alert.availableCount} units available
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          alert.severity === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.severity?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalAlerts === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No alerts or issues requiring your attention.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <Link
                to="/reports"
                onClick={onClose}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View Full Reports →
              </Link>
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertModal;

