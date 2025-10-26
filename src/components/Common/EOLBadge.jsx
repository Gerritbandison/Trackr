import { getEOLStatus } from '../../utils/endOfLife';
import Badge from './Badge';
import Tooltip from './Tooltip';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const EOLBadge = ({ asset, showIcon = true, showTooltip = true }) => {
  const eolStatus = getEOLStatus(asset);
  
  if (eolStatus.status === 'unknown') {
    return null;
  }
  
  const config = {
    past_eol: {
      variant: 'danger',
      icon: FiAlertCircle,
      label: 'Past EOL',
    },
    critical: {
      variant: 'danger',
      icon: FiAlertCircle,
      label: 'EOL Critical',
    },
    warning: {
      variant: 'warning',
      icon: FiAlertCircle,
      label: 'EOL Warning',
    },
    info: {
      variant: 'info',
      icon: FiInfo,
      label: 'EOL Info',
    },
    ok: {
      variant: 'success',
      icon: FiCheckCircle,
      label: 'Supported',
    },
  };
  
  const { variant, icon: Icon, label } = config[eolStatus.status] || config.ok;
  
  const badge = (
    <Badge variant={variant} size="sm" className="gap-1">
      {showIcon && <Icon size={12} />}
      <span>{label}</span>
    </Badge>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <Tooltip content={eolStatus.message}>
      {badge}
    </Tooltip>
  );
};

export default EOLBadge;

