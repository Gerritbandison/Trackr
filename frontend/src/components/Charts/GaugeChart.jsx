/**
 * Gauge/Speedometer chart component
 */
const GaugeChart = ({ 
  value = 0, 
  max = 100, 
  title = '',
  size = 200,
  colors = { low: '#ef4444', medium: '#f59e0b', high: '#10b981' }
}) => {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  const getColor = () => {
    if (percentage < 40) return colors.low;
    if (percentage < 70) return colors.medium;
    return colors.high;
  };

  return (
    <div className="flex flex-col items-center">
      {title && <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>}
      
      <div className="relative" style={{ width: size, height: size / 2 }}>
        {/* Background arc */}
        <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
          <path
            d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * Math.PI * (size / 2 - 20)} ${Math.PI * (size / 2 - 20)}`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color: getColor() }}>
            {Math.round(percentage)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {value} / {max}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.low }} />
          <span className="text-gray-600">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.medium }} />
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.high }} />
          <span className="text-gray-600">High</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;

