import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Globe, Zap } from 'lucide-react';

interface URLPreviewProps {
  url: string;
  isVisible: boolean;
}

interface URLInfo {
  title?: string;
  domain: string;
  favicon?: string;
  isNewssite: boolean;
  isBBC: boolean;
}

export const URLPreview: React.FC<URLPreviewProps> = ({ url, isVisible }) => {
  const [urlInfo, setUrlInfo] = useState<URLInfo | null>(null);

  useEffect(() => {
    if (isVisible && url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Check if it's a known news site
        const newsSites = [
          'cnn.com', 'bbc.com', 'reuters.com', 'ap.org', 'npr.org',
          'nytimes.com', 'washingtonpost.com', 'theguardian.com',
          'forbes.com', 'bloomberg.com', 'wsj.com', 'usatoday.com',
          'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'foxnews.com'
        ];
        
        const isNewssite = newsSites.some(site => domain.includes(site));
        const isBBC = domain.includes('bbc.com') || domain.includes('bbc.co.uk');
        
        setUrlInfo({
          domain,
          isNewssite,
          isBBC,
          favicon: `https://www.google.com/s2/favicons?sz=32&domain=${domain}`
        });
      } catch {
        setUrlInfo(null);
      }
    }
  }, [url, isVisible]);

  if (!isVisible || !urlInfo) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-3">
        <img 
          src={urlInfo.favicon} 
          alt="" 
          className="w-6 h-6 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {urlInfo.domain}
            </span>
            {urlInfo.isBBC && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                BBC Enhanced
              </span>
            )}
            {urlInfo.isNewssite && !urlInfo.isBBC && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                News Site
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              External link
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {urlInfo.isBBC ? 'Enhanced BBC scraping' : 'Will fetch content'}
            </span>
          </div>
        </div>
      </div>
      
      {urlInfo.isBBC && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>BBC News Detected:</strong> Using specialized scraper for enhanced content extraction, 
          including headlines, metadata, tags, and author information.
        </div>
      )}
      
      {!urlInfo.isNewssite && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <strong>Note:</strong> This doesn't appear to be from a recognized news source. 
          Analysis results may vary.
        </div>
      )}
    </div>
  );
};
