import React from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { NYT_TEST_URLS } from '../utils/nytHelpers';

interface NYTTestPanelProps {
  onUrlSelect: (url: string) => void;
  isVisible: boolean;
}

export const NYTTestPanel: React.FC<NYTTestPanelProps> = ({ onUrlSelect, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-medium text-blue-800 dark:text-blue-300">NY Times Test Articles</h3>
      </div>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
        Try these sample New York Times URLs to test the enhanced scraping:
      </p>
      <div className="space-y-2">
        {NYT_TEST_URLS.map((url, index) => {
          const articleTitle = url.split('/').pop()?.replace('.html', '').replace(/-/g, ' ') || `Article ${index + 1}`;
          
          return (
            <button
              key={index}
              onClick={() => onUrlSelect(url)}
              className="flex items-center gap-2 w-full p-2 text-left text-sm bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800/30 border border-blue-200 dark:border-blue-600 rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-blue-700 dark:text-blue-300 truncate">
                {articleTitle.charAt(0).toUpperCase() + articleTitle.slice(1)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
        <strong>Enhanced Features:</strong> Author extraction, section detection, content parsing, publication date
      </div>
    </div>
  );
};
