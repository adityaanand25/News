import { useState } from 'react';
import { Newspaper, Brain, Shield, Activity } from 'lucide-react';
import { ArticleInput } from './components/ArticleInput';
import { ToneSelector, ToneType } from './components/ToneSelector';
import { SummaryDisplay } from './components/SummaryDisplay';
import { RealTimeStatus } from './components/RealTimeStatus';
import { NewsDashboard } from './components/NewsDashboard';
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  const [selectedTone, setSelectedTone] = useState<ToneType>('neutral');
  const [currentMode, setCurrentMode] = useState<'manual' | 'dashboard'>('manual');
  
  const { 
    isLoading, 
    summary, 
    analysisProgress,
    isRealTimeMode,
    analyzArticle, 
    updateTone, 
    analyzeTextRealTime,
    stopAnalysis 
  } = useAnalysis();

  // If in dashboard mode, render the dashboard
  if (currentMode === 'dashboard') {
    return <NewsDashboard />;
  }

  const handleAnalyze = (content: string, source: 'url' | 'text') => {
    analyzArticle(content, source, selectedTone);
  };

  const handleRealTimeAnalyze = (text: string) => {
    analyzeTextRealTime(text, selectedTone);
  };

  const handleToneChange = (tone: ToneType) => {
    setSelectedTone(tone);
    if (summary) {
      updateTone(tone);
    }
  };

  const handleReset = () => {
    stopAnalysis();
    window.location.reload();
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Newspaper className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NewsLens</h1>
                <p className="text-gray-600">AI-powered news analysis and bias detection</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentMode === 'manual'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-4 h-4" />
                Manual Analysis
              </button>
              
              <button
                onClick={() => setCurrentMode('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  (currentMode as string) === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                News Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!summary ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Understand News Better
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Get clear, unbiased summaries of news articles with intelligent bias detection 
                and analysis across multiple sources. Now with live news crawling!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <Brain className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Smart Summaries</h3>
                    <p className="text-sm text-gray-600">AI-generated summaries in your preferred style</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Bias Detection</h3>
                    <p className="text-sm text-gray-600">Identifies and explains potential bias in reporting</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <Activity className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Live News Feed</h3>
                    <p className="text-sm text-gray-600">Real-time crawling from multiple news sources</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Input and Tone Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ArticleInput 
                onAnalyze={handleAnalyze} 
                onRealTimeAnalyze={handleRealTimeAnalyze}
                isLoading={isLoading}
                isRealTimeMode={isRealTimeMode}
                analysisProgress={analysisProgress}
              />
              <ToneSelector 
                selectedTone={selectedTone} 
                onToneChange={handleToneChange}
                isLoading={isLoading}
                isRealTimeMode={isRealTimeMode}
              />
            </div>
          </>
        ) : (
          <>
            {/* Back to Input */}
            <div className="mb-6">
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                ← Analyze Another Article
              </button>
            </div>

            {/* Tone Selector for Results */}
            <div className="mb-6">
              <ToneSelector 
                selectedTone={selectedTone} 
                onToneChange={handleToneChange}
                isLoading={isLoading}
                isRealTimeMode={isRealTimeMode}
              />
            </div>

            {/* Summary Results */}
            <SummaryDisplay summary={summary} tone={selectedTone} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 NewsLens. Helping you navigate the news with clarity and confidence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;