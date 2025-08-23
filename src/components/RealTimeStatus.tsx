import React from 'react';
import { Zap, Loader2, CheckCircle } from 'lucide-react';

interface RealTimeStatusProps {
  isActive: boolean;
  isAnalyzing: boolean;
  progress?: number;
  lastUpdate?: Date;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  isActive,
  isAnalyzing,
  progress = 0,
  lastUpdate
}) => {
  const getStatusIcon = () => {
    if (isAnalyzing) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
    if (isActive) {
      return <Zap className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isAnalyzing) {
      return 'Analyzing...';
    }
    if (isActive) {
      return 'Real-time mode active';
    }
    return 'Analysis complete';
  };

  const getStatusColor = () => {
    if (isAnalyzing) return 'border-blue-200 bg-blue-50';
    if (isActive) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg border shadow-lg transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-900">
          {getStatusText()}
        </span>
      </div>
      
      {isAnalyzing && progress > 0 && (
        <div className="w-48">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {lastUpdate && !isAnalyzing && (
        <div className="text-xs text-gray-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {isActive && !isAnalyzing && (
        <div className="flex items-center gap-1 mt-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Monitoring changes</span>
        </div>
      )}
    </div>
  );
};
