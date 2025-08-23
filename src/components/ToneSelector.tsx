import React from 'react';
import { BookOpen, FileText, Baby, Loader2 } from 'lucide-react';

export type ToneType = 'neutral' | 'facts' | 'simple';

interface ToneSelectorProps {
  selectedTone: ToneType;
  onToneChange: (tone: ToneType) => void;
  isLoading?: boolean;
  isRealTimeMode?: boolean;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({ 
  selectedTone, 
  onToneChange, 
  isLoading = false,
  isRealTimeMode = false 
}) => {
  const tones = [
    {
      id: 'neutral' as const,
      icon: BookOpen,
      title: 'Neutral Summary',
      description: 'Balanced, objective analysis'
    },
    {
      id: 'facts' as const,
      icon: FileText,
      title: 'Facts Only',
      description: 'Key facts without interpretation'
    },
    {
      id: 'simple' as const,
      icon: Baby,
      title: 'Simple Language',
      description: 'Explained for easy understanding'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Summary Style</h2>
        {isRealTimeMode && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Real-time switching
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tones.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          const isProcessing = isLoading && isSelected;
          
          return (
            <button
              key={tone.id}
              onClick={() => onToneChange(tone.id)}
              disabled={isLoading}
              className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                )}
                <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {tone.title}
                </h3>
              </div>
              <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                {isProcessing ? 'Updating...' : tone.description}
              </p>
              {isRealTimeMode && isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};