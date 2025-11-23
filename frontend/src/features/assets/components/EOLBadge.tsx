import { getEOLStatus } from '../../../utils/endOfLife';
import Badge from '../../../components/ui/Badge';
import Tooltip from '../../../components/ui/Tooltip';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { ITAMAsset } from '../../../types/itam';

interface EOLBadgeProps {
  asset: ITAMAsset;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const EOLBadge = ({ asset, showIcon = true, showTooltip = true }: EOLBadgeProps) => {
  const eolStatus = getEOLStatus(asset);
  
  if (eolStatus.status === 'unknown') {
    return null;
  }
  
  const config: Record<string, { variant: 'danger' | 'warning' | 'info' | 'success'; icon: typeof FiAlertCircle; label: string }> = {
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

