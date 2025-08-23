import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export type BiasLevel = 'low' | 'moderate' | 'high';

interface BiasIndicatorProps {
  level: BiasLevel;
  score: number;
  details: string[];
}

export const BiasIndicator: React.FC<BiasIndicatorProps> = ({ level, score, details }) => {
  const getIndicatorConfig = (level: BiasLevel) => {
    switch (level) {
      case 'low':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'Low Bias',
          description: 'Relatively neutral reporting'
        };
      case 'moderate':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: AlertCircle,
          label: 'Moderate Bias',
          description: 'Some partisan language detected'
        };
      case 'high':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          label: 'High Bias',
          description: 'Strong partisan language present'
        };
    }
  };

  const config = getIndicatorConfig(level);
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <div>
          <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
          <p className={`text-sm ${config.color} opacity-80`}>{config.description}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-2xl font-bold ${config.color}`}>
            {Math.round(score * 100)}%
          </span>
        </div>
      </div>
      
      {details.length > 0 && (
        <div>
          <h4 className={`text-sm font-medium ${config.color} mb-2`}>Analysis Details:</h4>
          <ul className="space-y-1">
            {details.map((detail, index) => (
              <li key={index} className={`text-sm ${config.color} opacity-90 flex items-start gap-2`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};