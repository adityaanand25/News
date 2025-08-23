import React from 'react';
import { Copy, Download, Share, Clock, Zap } from 'lucide-react';
import { BiasIndicator, BiasLevel } from './BiasIndicator';
import { ToneType } from './ToneSelector';

interface SummaryData {
  title: string;
  source: string;
  publishDate: string;
  content: string;
  keyPoints: string[];
  biasLevel: BiasLevel;
  biasScore: number;
  biasDetails: string[];
  credibilityScore: number;
  analysisProgress?: number;
  isRealTime?: boolean;
  originalContent?: string;
  isBBCArticle?: boolean;
  author?: string;
  imageUrl?: string;
  tags?: string[];
}

interface SummaryDisplayProps {
  summary: SummaryData;
  tone: ToneType;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, tone }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(summary.content);
  };

  const handleDownload = () => {
    const blob = new Blob([
      `Title: ${summary.title}\n\n`,
      `Source: ${summary.source}\n`,
      `Date: ${summary.publishDate}\n\n`,
      `Summary:\n${summary.content}\n\n`,
      `Key Points:\n${summary.keyPoints.map(point => `• ${point}`).join('\n')}\n\n`,
      `Bias Analysis: ${summary.biasLevel} (${Math.round(summary.biasScore * 100)}%)\n`,
      `Credibility Score: ${summary.credibilityScore}/100`
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-summary-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getToneLabel = (tone: ToneType) => {
    switch (tone) {
      case 'neutral': return 'Neutral Summary';
      case 'facts': return 'Facts Only';
      case 'simple': return 'Simple Language';
    }
  };

  return (
    <div className="space-y-6">
      {/* Article Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{summary.title}</h2>
              {summary.isBBCArticle && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  <Zap className="w-3 h-3" />
                  BBC Enhanced
                </div>
              )}
              {summary.isRealTime && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  <Zap className="w-3 h-3" />
                  Real-time
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{summary.source}</span>
              {summary.author && (
                <>
                  <span>•</span>
                  <span>By {summary.author}</span>
                </>
              )}
              <span>•</span>
              <span>{summary.publishDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Credibility: <span className={`font-medium ${summary.credibilityScore >= 80 ? 'text-green-600' : summary.credibilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {summary.credibilityScore}/100
                </span>
              </span>
              {summary.isRealTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="w-3 h-3" />
                    Live analysis
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy summary"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download summary"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share summary"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 ${
        summary.isRealTime ? 'border-blue-200 shadow-blue-100' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {getToneLabel(tone)}
          </span>
          {summary.isRealTime && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full animate-pulse">
              Updated in real-time
            </span>
          )}
        </div>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">{summary.content}</p>
        </div>

        {/* Key Points */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Key Points:</h4>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  summary.isRealTime ? 'bg-blue-600 animate-pulse' : 'bg-blue-600'
                }`} />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BBC Tags (if available) */}
        {summary.tags && summary.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Article Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {summary.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bias Analysis */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 ${
        summary.isRealTime ? 'border-green-200 shadow-green-100' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bias Analysis</h3>
          {summary.isRealTime && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              Live monitoring
            </div>
          )}
        </div>
        <BiasIndicator
          level={summary.biasLevel}
          score={summary.biasScore}
          details={summary.biasDetails}
        />
      </div>
    </div>
  );
};