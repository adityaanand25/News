import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle, Globe, Brain, Search } from 'lucide-react';

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
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');

  // Smooth progress animation
  useEffect(() => {
    if (progress !== displayProgress) {
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          const diff = progress - prev;
          if (Math.abs(diff) < 1) {
            clearInterval(interval);
            return progress;
          }
          return prev + diff * 0.3;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [progress, displayProgress]);

  // Update stage based on progress
  useEffect(() => {
    if (isAnalyzing && progress > 0) {
      console.log(`Progress update: ${progress}%`); // Debug log
      if (progress <= 30) {
        setCurrentStage('Fetching content...');
      } else if (progress <= 50) {
        setCurrentStage('Parsing article...');
      } else if (progress <= 75) {
        setCurrentStage('Analyzing content...');
      } else if (progress < 100) {
        setCurrentStage('Finalizing...');
      } else {
        setCurrentStage('Complete!');
      }
    }
  }, [progress, isAnalyzing]);

  const getStatusIcon = () => {
    if (isAnalyzing) {
      if (displayProgress <= 25) {
        return <Globe className="w-4 h-4 animate-pulse text-blue-600" />;
      } else if (displayProgress <= 75) {
        return <Search className="w-4 h-4 animate-spin text-blue-600" />;
      } else {
        return <Brain className="w-4 h-4 animate-pulse text-blue-600" />;
      }
    }
    if (isActive) {
      return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isAnalyzing) {
      return currentStage || 'Processing...';
    }
    if (isActive) {
      return 'Real-time mode active';
    }
    return 'Analysis complete';
  };

  const getStatusColor = () => {
    if (isAnalyzing) return 'border-blue-200 bg-blue-50 shadow-blue-100';
    if (isActive) return 'border-yellow-200 bg-yellow-50 shadow-yellow-100';
    return 'border-green-200 bg-green-50 shadow-green-100';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border-2 shadow-xl transition-all duration-500 backdrop-blur-sm ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <span className="text-sm font-semibold text-gray-900 block">
            {getStatusText()}
          </span>
          {isAnalyzing && (
            <span className="text-xs text-gray-600">
              Step {Math.ceil(displayProgress / 25)} of 4
            </span>
          )}
        </div>
      </div>
      
      {isAnalyzing && displayProgress > 0 && (
        <div className="w-56 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Progress</span>
            <span className="text-xs font-bold text-blue-600">{Math.round(displayProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          {currentStage && (
            <div className="text-xs text-gray-600 mt-1 truncate">
              {currentStage}
            </div>
          )}
        </div>
      )}

      {lastUpdate && !isAnalyzing && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {isActive && !isAnalyzing && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-100 rounded-lg">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-yellow-800">Monitoring for changes</span>
        </div>
      )}
    </div>
  );
};
