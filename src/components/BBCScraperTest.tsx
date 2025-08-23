import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { bbcScraper } from '../services/bbcScraper';

interface TestResult {
  success: boolean;
  title?: string;
  contentLength?: number;
  author?: string;
  error?: string;
}

export const BBCScraperTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const testUrl = 'https://www.bbc.com/news/technology-67890123'; // Example BBC URL

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Set up progress callback
      bbcScraper.setProgressCallback((progress) => {
        console.log(`Progress: ${progress.progress}% - ${progress.message}`);
      });

      const result = await bbcScraper.scrapeArticle(testUrl);
      
      setTestResult({
        success: true,
        title: result.headline,
        contentLength: result.content.length,
        author: result.author
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">BBC Scraper Test</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Test URL:</p>
        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
          {testUrl}
        </code>
      </div>

      <button
        onClick={runTest}
        disabled={isTesting}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isTesting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing BBC Scraper...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Test BBC Scraper
          </>
        )}
      </button>

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`font-medium ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.success ? 'Success!' : 'Failed'}
            </span>
          </div>
          
          {testResult.success ? (
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Title:</strong> {testResult.title}</p>
              <p><strong>Content Length:</strong> {testResult.contentLength} characters</p>
              {testResult.author && <p><strong>Author:</strong> {testResult.author}</p>}
            </div>
          ) : (
            <p className="text-sm text-red-700">{testResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
