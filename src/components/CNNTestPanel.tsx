import React from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { CNN_TEST_URLS } from '../utils/cnnHelpers';

interface CNNTestPanelProps {
  onUrlSelect: (url: string) => void;
  isVisible: boolean;
}

export const CNNTestPanel: React.FC<CNNTestPanelProps> = ({ onUrlSelect, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
        <h3 className="font-medium text-red-800 dark:text-red-300">CNN Test Articles</h3>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
        Try these sample CNN URLs to test the enhanced scraping:
      </p>
      <div className="space-y-2">
        {CNN_TEST_URLS.map((url, index) => (
          <button
            key={index}
            onClick={() => onUrlSelect(url)}
            className="w-full text-left p-2 text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-red-700 dark:text-red-300 truncate">
                {url.split('/').slice(-2).join('/').replace('/index.html', '')}
              </span>
              <ExternalLink className="w-3 h-3 text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-red-600 dark:text-red-400">
        <p>💡 These URLs demonstrate CNN's enhanced scraping capabilities with automatic content extraction and metadata parsing.</p>
      </div>
    </div>
  );
};
