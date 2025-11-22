import { FiAlertTriangle, FiCalendar, FiDollarSign, FiClock, FiInfo } from 'react-icons/fi';
import { getEOLStatus } from '../../utils/endOfLife';
import { format } from 'date-fns';
import Badge from './Badge';

const EOLCard = ({ asset }) => {
  const eolStatus = getEOLStatus(asset);
  
  if (eolStatus.status === 'unknown') {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <FiInfo className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-600">
            End-of-life date cannot be determined for this asset
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Purchase date is required for EOL calculation
          </p>
        </div>
      </div>
    );
  }
  
  // Determine card styling based on severity
  const getCardStyle = () => {
    switch (eolStatus.severity) {
      case 'critical':
        return 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white';
      case 'warning':
        return 'border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-white';
      case 'info':
        return 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white';
      default:
        return 'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white';
    }
  };
  
  const getSeverityIcon = () => {
    switch (eolStatus.severity) {
      case 'critical':
        return <FiAlertTriangle className="text-red-600" size={24} />;
      case 'warning':
        return <FiAlertTriangle className="text-amber-600" size={24} />;
      case 'info':
        return <FiInfo className="text-blue-600" size={24} />;
      default:
        return <FiInfo className="text-green-600" size={24} />;
    }
  };
  
  const getSeverityColor = () => {
    switch (eolStatus.severity) {
      case 'critical':
        return {
          text: 'text-red-900',
          bg: 'bg-red-100',
          border: 'border-red-200',
        };
      case 'warning':
        return {
          text: 'text-amber-900',
          bg: 'bg-amber-100',
          border: 'border-amber-200',
        };
      case 'info':
        return {
          text: 'text-blue-900',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
        };
      default:
        return {
          text: 'text-green-900',
          bg: 'bg-green-100',
          border: 'border-green-200',
        };
    }
  };
  
  const colors = getSeverityColor();
  
  return (
    <div className={`card ${getCardStyle()}`}>
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${colors.bg} rounded-lg`}>
            {getSeverityIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">End-of-Life Status</h3>
            <p className="text-sm text-gray-600">Asset lifecycle and replacement planning</p>
          </div>
        </div>
      </div>
      
      <div className="card-body space-y-6">
        {/* Alert Message */}
        {eolStatus.severity && (
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
            <p className={`${colors.text} font-semibold flex items-center gap-2`}>
              <FiAlertTriangle size={18} />
              {eolStatus.message}
            </p>
          </div>
        )}
        
        {/* EOL Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Age */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FiClock className="text-gray-600" size={18} />
              <span className="text-sm font-medium text-gray-700">Asset Age</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {eolStatus.yearsOld} {eolStatus.yearsOld === 1 ? 'year' : 'years'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Since {format(new Date(asset.purchaseDate), 'MMM yyyy')}
            </div>
          </div>
          
          {/* EOL Date */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <FiCalendar className="text-purple-600" size={18} />
              <span className="text-sm font-medium text-purple-900">EOL Date</span>
            </div>
            <div className="text-lg font-bold text-purple-700">
              {format(eolStatus.eolDate, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {eolStatus.isPastEOL ? 'Expired' : `In ${eolStatus.monthsUntilEOL} months`}
            </div>
          </div>
          
          {/* Time Remaining */}
          <div className={`bg-gradient-to-br ${eolStatus.isPastEOL ? 'from-red-50 to-white border-red-200' : 'from-blue-50 to-white border-blue-200'} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <FiClock className={eolStatus.isPastEOL ? 'text-red-600' : 'text-blue-600'} size={18} />
              <span className={`text-sm font-medium ${eolStatus.isPastEOL ? 'text-red-900' : 'text-blue-900'}`}>
                {eolStatus.isPastEOL ? 'Past Due By' : 'Time Remaining'}
              </span>
            </div>
            <div className={`text-2xl font-bold ${eolStatus.isPastEOL ? 'text-red-700' : 'text-blue-700'}`}>
              {Math.abs(eolStatus.monthsUntilEOL)} months
            </div>
            <div className={`text-xs ${eolStatus.isPastEOL ? 'text-red-600' : 'text-blue-600'} mt-1`}>
              {Math.abs(eolStatus.daysUntilEOL)} days
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        {eolStatus.severity && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <FiInfo className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-2">Recommendations</p>
                {eolStatus.isPastEOL && (
                  <ul className="space-y-1 list-disc list-inside">
                    <li>This asset is past its expected end-of-life date</li>
                    <li>Consider replacement to avoid security and support risks</li>
                    <li>Review warranty status and maintenance costs</li>
                    <li>Plan for data migration if replacement is scheduled</li>
                  </ul>
                )}
                {eolStatus.severity === 'critical' && !eolStatus.isPastEOL && (
                  <ul className="space-y-1 list-disc list-inside">
                    <li>EOL is approaching rapidly - begin replacement planning now</li>
                    <li>Research current market alternatives</li>
                    <li>Budget for replacement within the next quarter</li>
                    <li>Prepare for data backup and migration</li>
                  </ul>
                )}
                {eolStatus.severity === 'warning' && (
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Start evaluating replacement options</li>
                    <li>Include in next fiscal year budget</li>
                    <li>Monitor for performance degradation</li>
                  </ul>
                )}
                {eolStatus.severity === 'info' && (
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Asset is in good standing for now</li>
                    <li>Begin preliminary research for eventual replacement</li>
                    <li>Continue regular maintenance and monitoring</li>
                  </ul>
                )}
                {!eolStatus.severity && (
                  <p>
                    This asset has plenty of supported life remaining. Continue with regular maintenance
                    and monitoring.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EOLCard;

