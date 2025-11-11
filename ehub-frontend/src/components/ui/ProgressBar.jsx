import React from 'react';

const ProgressBar = ({
  progress,
  total,
  showPercentage = true,
  showText = true,
  color = 'primary',
  size = 'medium',
  className = ''
}) => {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  const colorClasses = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          {showPercentage && (
            <span>{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {showText && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{progress} completed</span>
          <span>{total} total</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;