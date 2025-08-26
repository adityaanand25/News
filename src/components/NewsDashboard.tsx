import React, { useState } from 'react';
import { Newspaper, Activity, BarChart3, Settings } from 'lucide-react';
import { NewsFeed } from './NewsFeed';
import { ToneSelector, ToneType } from './ToneSelector';
import { SummaryDisplay } from './SummaryDisplay';
import { RealTimeStatus } from './RealTimeStatus';
import { useAnalysis } from '../hooks/useAnalysis';
import { CrawledArticle } from '../services/newsCrawler';

export const NewsDashboard: React.FC = () => {
  const [selectedTone, setSelectedTone] = useState<ToneType>('neutral');
  const [currentView, setCurrentView] = useState<'feed' | 'analysis'>('feed');
  
  const {
    isLoading,
    summary,
    analysisProgress,
    isRealTimeMode,
    analyzArticle,
    updateTone,
    stopAnalysis
  } = useAnalysis();

  const handleAnalyzeArticle = (article: CrawledArticle) => {
    setCurrentView('analysis');
    // Use the article content for analysis
    analyzArticle(article.content, 'text', selectedTone);
  };

  const handleToneChange = (tone: ToneType) => {
    setSelectedTone(tone);
    if (summary) {
      updateTone(tone);
    }
  };

  const handleBackToFeed = () => {
    stopAnalysis();
    setCurrentView('feed');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time Status Indicator */}
      <RealTimeStatus
        isActive={isRealTimeMode}
        isAnalyzing={isLoading}
        progress={analysisProgress}
        lastUpdate={summary?.isRealTime ? new Date() : undefined}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Newspaper className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">News Summaarizer Dashboard</h1>
                <p className="text-gray-600">Live news crawling and AI-powered analysis</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('feed')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'feed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                Live Feed
              </button>
              
              <button
                onClick={() => setCurrentView('analysis')}
                disabled={!summary}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'analysis'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'feed' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* News Feed - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <NewsFeed onAnalyzeArticle={handleAnalyzeArticle} />
            </div>

            {/* Sidebar - Analysis Controls */}
            <div className="space-y-6">
              {/* Tone Selector */}
              <ToneSelector 
                selectedTone={selectedTone} 
                onToneChange={handleToneChange}
                isLoading={isLoading}
                isRealTimeMode={isRealTimeMode}
              />

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles Analyzed</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sources Active</span>
                    <span className="font-medium">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Bias Score</span>
                    <span className="font-medium text-green-600">Low</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Crawl</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Auto-refresh every 30 min</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Real-time notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Include international sources</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Analysis View
          <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToFeed}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                ← Back to News Feed
              </button>
              
              <div className="flex-1">
                <ToneSelector 
                  selectedTone={selectedTone} 
                  onToneChange={handleToneChange}
                  isLoading={isLoading}
                  isRealTimeMode={isRealTimeMode}
                />
              </div>
            </div>

            {/* Analysis Results */}
            {summary ? (
              <SummaryDisplay summary={summary} tone={selectedTone} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Article Selected</h3>
                <p className="text-gray-600 mb-6">
                  Go back to the news feed and click "Analyze" on any article to see detailed analysis here.
                </p>
                <button
                  onClick={handleBackToFeed}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse News Feed
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
