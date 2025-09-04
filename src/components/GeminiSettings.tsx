import React, { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle, AlertCircle, Brain, Sparkles } from 'lucide-react';

interface GeminiSettingsProps {
  onAPIKeySet: (apiKey: string) => void;
  onTestConnection: () => Promise<boolean>;
}

export const GeminiSettings: React.FC<GeminiSettingsProps> = ({ 
  onAPIKeySet, 
  onTestConnection 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onAPIKeySet(savedApiKey);
    }
  }, [onAPIKeySet]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      onAPIKeySet(apiKey.trim());
      setConnectionStatus('idle');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key first');
      return;
    }

    setIsTestingConnection(true);
    try {
      const success = await onTestConnection();
      setConnectionStatus(success ? 'success' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setConnectionStatus('idle');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 group"
        title="Configure Gemini AI"
      >
        <Brain className="w-5 h-5" />
        <Sparkles className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-96 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Gemini AI Settings</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim()}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Save Key
          </button>
          
          <button
            onClick={handleTestConnection}
            disabled={!apiKey.trim() || isTestingConnection}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isTestingConnection ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Test
              </>
            )}
          </button>
        </div>

        {connectionStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            connectionStatus === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {connectionStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {connectionStatus === 'success' 
                ? 'Connection successful! Gemini AI is now enabled for enhanced analysis.' 
                : 'Connection failed. Please check your API key and try again.'
              }
            </span>
          </div>
        )}

        {apiKey && (
          <button
            onClick={handleClearApiKey}
            className="w-full text-red-600 hover:text-red-700 py-2 text-sm font-medium transition-colors"
          >
            Clear API Key
          </button>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-purple-800 mb-2">Enhanced Features with Gemini AI:</h4>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• AI-powered article summarization</li>
            <li>• Advanced bias detection and analysis</li>
            <li>• Intelligent key point extraction</li>
            <li>• Enhanced credibility scoring</li>
            <li>• Context-aware content analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
