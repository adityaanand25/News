import React, { useState } from 'react';
import { ExternalLink, TestTube, Copy } from 'lucide-react';
import { BBC_TEST_URLS } from '../utils/bbcHelpers';

interface BBCTestPanelProps {
  onUrlSelect: (url: string) => void;
  isVisible: boolean;
}

export const BBCTestPanel: React.FC<BBCTestPanelProps> = ({ onUrlSelect, isVisible }) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleUseUrl = (url: string) => {
    onUrlSelect(url);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <TestTube className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-900">Test BBC News URLs</h4>
      </div>
      
      <p className="text-xs text-blue-700 mb-3">
        Click on any URL below to test the BBC News scraper functionality:
      </p>

      <div className="space-y-2">
        {BBC_TEST_URLS.map((url, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="text-xs text-gray-700 flex-1 truncate">
              {url}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleCopyUrl(url)}
                className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                title="Copy URL"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleUseUrl(url)}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      {copiedUrl && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ URL copied to clipboard!
        </div>
      )}

      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
        <strong>Note:</strong> These are example URLs for testing. The scraper will attempt to extract content 
        using BBC's HTML structure patterns.
      </div>
    </div>
  );
};
