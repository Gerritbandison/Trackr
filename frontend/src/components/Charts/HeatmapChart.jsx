/**
 * Heatmap chart component for asset utilization or activity patterns
 */
const HeatmapChart = ({ data = [], title = 'Activity Heatmap' }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getColor = (value) => {
    if (value === 0) return '#f3f4f6';
    if (value < 3) return '#dbeafe';
    if (value < 6) return '#93c5fd';
    if (value < 10) return '#3b82f6';
    return '#1e40af';
  };

  // Mock data structure: { day: 0-6, hour: 0-23, value: 0-20 }
  const getValue = (day, hour) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    return item ? item.value : 0;
  };

  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
      
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Header */}
          <div className="flex gap-1 pl-12">
            {hours.map(hour => (
              <div key={hour} className="w-6 text-xs text-gray-600 text-center">
                {hour % 3 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-1">
              <div className="w-10 text-xs text-gray-600 text-right pr-2">{day}</div>
              {hours.map((hour) => {
                const value = getValue(dayIndex, hour);
                return (
                  <div
                    key={hour}
                    className="w-6 h-6 rounded hover:ring-2 ring-primary-500 cursor-pointer transition-all"
                    style={{ backgroundColor: getColor(value) }}
                    title={`${day} ${hour}:00 - ${value} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 3, 6, 10, 15].map(val => (
            <div
              key={val}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getColor(val) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatmapChart;

