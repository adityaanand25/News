import React, { useState, useEffect } from 'react';
import { Link, FileText, Loader2, Zap } from 'lucide-react';
import { URLPreview } from './URLPreview';
import { BBCTestPanel } from './BBCTestPanel';
import { NYTTestPanel } from './NYTTestPanel';
import { CNNTestPanel } from './CNNTestPanel';
import { validateBBCUrl } from '../utils/bbcHelpers';
import { validateNYTUrl } from '../utils/nytHelpers';
import { validateCNNUrl } from '../utils/cnnHelpers';

interface ArticleInputProps {
  onAnalyze: (content: string, source: 'url' | 'text') => void;
  onRealTimeAnalyze?: (text: string) => void;
  isLoading: boolean;
  isRealTimeMode?: boolean;
  analysisProgress?: number;
}

export const ArticleInput: React.FC<ArticleInputProps> = ({ 
  onAnalyze, 
  onRealTimeAnalyze,
  isLoading, 
  isRealTimeMode = false,
  analysisProgress = 0 
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [urlStatus, setUrlStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [isBBCUrl, setIsBBCUrl] = useState(false);
  const [isNYTUrl, setIsNYTUrl] = useState(false);
  const [isCNNUrl, setIsCNNUrl] = useState(false);
  const [showBBCTestPanel, setShowBBCTestPanel] = useState(false);
  const [showNYTTestPanel, setShowNYTTestPanel] = useState(false);
  const [showCNNTestPanel, setShowCNNTestPanel] = useState(false);

  const handleTestUrlSelect = (url: string) => {
    setUrlInput(url);
    setShowBBCTestPanel(false);
    setShowNYTTestPanel(false);
    setShowCNNTestPanel(false);
  };

  // Validate URL as user types
  useEffect(() => {
    if (activeTab === 'url' && urlInput.trim()) {
      setUrlStatus('validating');
      
      const timeoutId = setTimeout(() => {
        try {
          new URL(urlInput);
          const hostname = new URL(urlInput).hostname.toLowerCase();
          
          // Check if it's BBC
          const isBBC = validateBBCUrl(urlInput);
          
          // Check if it's NYT
          const isNYT = validateNYTUrl(urlInput);
          
          // Check if it's CNN
          const isCNN = validateCNNUrl(urlInput);
          
          setIsBBCUrl(isBBC);
          setIsNYTUrl(isNYT);
          setIsCNNUrl(isCNN);
          
          // Valid URL if it passes URL constructor and is from supported sources
          if (hostname.includes('bbc.') || hostname.includes('nytimes.') || hostname.includes('cnn.') || 
              hostname.includes('reuters.') || hostname.includes('theguardian.') || hostname.includes('washingtonpost.')) {
            setUrlStatus('valid');
          } else {
            setUrlStatus('valid'); // Accept all valid URLs for now
          }
        } catch {
          setUrlStatus('invalid');
          setIsBBCUrl(false);
          setIsNYTUrl(false);
          setIsCNNUrl(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setUrlStatus('idle');
      setIsBBCUrl(false);
      setIsNYTUrl(false);
      setIsCNNUrl(false);
    }
  }, [urlInput, activeTab]);

  // Real-time text analysis
  useEffect(() => {
    if (realTimeEnabled && activeTab === 'text' && textInput.length > 50 && onRealTimeAnalyze) {
      onRealTimeAnalyze(textInput);
    }
  }, [textInput, realTimeEnabled, activeTab, onRealTimeAnalyze]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = activeTab === 'url' ? urlInput : textInput;
    if (content.trim()) {
      onAnalyze(content, activeTab);
    }
  };

  const isValid = activeTab === 'url' ? (urlInput.trim() && urlStatus !== 'invalid') : textInput.trim();

  const getUrlStatusIcon = () => {
    switch (urlStatus) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case 'valid':
        return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
      case 'invalid':
        return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
      default:
        return null;
    }
  };

  const getUrlStatusMessage = () => {
    switch (urlStatus) {
      case 'validating':
        return 'Validating URL...';
      case 'valid':
        return 'Valid URL detected';
      case 'invalid':
        return 'Invalid URL format';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add News Article</h2>
        
        {/* Real-time toggle */}
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${realTimeEnabled ? 'text-yellow-500' : 'text-gray-400'}`} />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={realTimeEnabled}
              onChange={(e) => setRealTimeEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Real-time analysis
          </label>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            activeTab === 'url'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Link className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Text
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'url' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Article URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/news-article"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                    urlStatus === 'invalid' ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' :
                    urlStatus === 'valid' ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' :
                    'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getUrlStatusIcon()}
                </div>
              </div>
              {urlStatus !== 'idle' && (
                <p className={`text-xs mt-1 ${
                  urlStatus === 'invalid' ? 'text-red-600 dark:text-red-400' :
                  urlStatus === 'valid' ? 'text-green-600 dark:text-green-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {getUrlStatusMessage()}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Paste a link to any news article. Enhanced scraping available for BBC, New York Times, and CNN.
              </p>

              {/* Test Panel Buttons */}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBBCTestPanel(!showBBCTestPanel)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  {showBBCTestPanel ? 'Hide' : 'Show'} BBC test URLs
                </button>
                <button
                  type="button"
                  onClick={() => setShowNYTTestPanel(!showNYTTestPanel)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  {showNYTTestPanel ? 'Hide' : 'Show'} NYT test URLs
                </button>
                <button
                  type="button"
                  onClick={() => setShowCNNTestPanel(!showCNNTestPanel)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  {showCNNTestPanel ? 'Hide' : 'Show'} CNN test URLs
                </button>
              </div>
              
              <URLPreview 
                url={urlInput}
                isVisible={urlStatus === 'valid' && urlInput.trim().length > 0}
              />
              
              <BBCTestPanel
                onUrlSelect={handleTestUrlSelect}
                isVisible={showBBCTestPanel}
              />

              <NYTTestPanel
                onUrlSelect={handleTestUrlSelect}
                isVisible={showNYTTestPanel}
              />

              <CNNTestPanel
                onUrlSelect={handleTestUrlSelect}
                isVisible={showCNNTestPanel}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Article Text
                </label>
                {realTimeEnabled && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {textInput.length < 50 ? 
                      `Type ${50 - textInput.length} more characters for real-time analysis` :
                      'Real-time analysis active'
                    }
                  </span>
                )}
              </div>
              <textarea
                id="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the article text here..."
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600 ${
                  realTimeEnabled && textInput.length > 50 ? 
                    'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' : 
                    'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Progress bar for real-time analysis */}
        {isRealTimeMode && analysisProgress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeTab === 'url' && analysisProgress < 30 ? 'Fetching Article' : 'Analysis Progress'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeTab === 'url' && analysisProgress < 30 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            {activeTab === 'url' && analysisProgress < 30 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fetching content from the provided URL...
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isBBCUrl 
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed' 
              : isNYTUrl
              ? 'bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              : isCNNUrl
              ? 'bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRealTimeMode ? 
                (isBBCUrl ? 'BBC Enhanced Analysis...' : 
                 isNYTUrl ? 'NYT Enhanced Analysis...' : 
                 isCNNUrl ? 'CNN Enhanced Analysis...' :
                 'Real-time Analysis...') : 
                (isBBCUrl ? 'BBC Enhanced Scraping...' : 
                 isNYTUrl ? 'NYT Enhanced Scraping...' : 
                 isCNNUrl ? 'CNN Enhanced Scraping...' :
                 'Analyzing Article...')
              }
            </>
          ) : (
            <>
              {(isBBCUrl || isNYTUrl || isCNNUrl) && <Zap className="w-4 h-4" />}
              {isBBCUrl ? 'Analyze with BBC Enhanced Scraping' : 
               isNYTUrl ? 'Analyze with NYT Enhanced Scraping' : 
               isCNNUrl ? 'Analyze with CNN Enhanced Scraping' :
               'Analyze Article'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};