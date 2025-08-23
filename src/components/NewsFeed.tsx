import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  Filter, 
  Search,
  Globe,
  TrendingUp,
  User,
  Tag
} from 'lucide-react';
import { newsCrawler, CrawledArticle, CrawlProgress, NEWS_SOURCES } from '../services/newsCrawler';

interface NewsFeedProps {
  onAnalyzeArticle?: (article: CrawledArticle) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onAnalyzeArticle }) => {
  const [articles, setArticles] = useState<CrawledArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<CrawledArticle[]>([]);
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Subscribe to crawler progress
  useEffect(() => {
    const unsubscribe = newsCrawler.subscribeToProgress((progress) => {
      setCrawlProgress(progress);
      
      // Check if crawling is complete
      const allCompleted = progress.every(p => p.status === 'completed' || p.status === 'error');
      if (allCompleted && progress.length > 0) {
        setArticles(newsCrawler.getArticles());
        setLastUpdate(new Date());
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Filter articles based on search and filters
  useEffect(() => {
    let filtered = articles;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = newsCrawler.searchArticles(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Apply source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(article => article.source.id === selectedSource);
    }

    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory, selectedSource]);

  const handleCrawl = async () => {
    if (newsCrawler.isCurrentlyRunning()) return;
    
    setIsLoading(true);
    setCrawlProgress([]);
    
    try {
      await newsCrawler.crawlAllSources();
    } catch (error) {
      console.error('Crawling failed:', error);
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getUniqueCategories = (): string[] => {
    const categories = new Set(articles.map(article => article.category));
    return Array.from(categories).sort();
  };

  const getActiveSources = (): typeof NEWS_SOURCES => {
    return NEWS_SOURCES.filter(source => source.enabled);
  };

  const getTotalProgress = (): number => {
    if (crawlProgress.length === 0) return 0;
    const totalProgress = crawlProgress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / crawlProgress.length);
  };

  const getProgressStatus = (): string => {
    const completed = crawlProgress.filter(p => p.status === 'completed').length;
    const errors = crawlProgress.filter(p => p.status === 'error').length;
    const total = crawlProgress.length;
    
    if (total === 0) return 'Ready to crawl';
    if (completed === total) return 'Crawling completed';
    if (errors > 0) return `${completed}/${total} completed (${errors} errors)`;
    return `Crawling ${completed}/${total} sources...`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Live News Feed</h2>
              <p className="text-sm text-gray-600">
                {lastUpdate 
                  ? `Last updated: ${lastUpdate.toLocaleTimeString()}`
                  : 'Click refresh to load latest news'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCrawl}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Crawling...' : 'Refresh News'}
          </button>
        </div>

        {/* Progress Bar */}
        {isLoading && crawlProgress.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{getProgressStatus()}</span>
              <span className="text-sm text-gray-500">{getTotalProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getTotalProgress()}%` }}
              ></div>
            </div>
            
            {/* Individual source progress */}
            <div className="mt-2 space-y-1">
              {crawlProgress.map(progress => (
                <div key={progress.sourceId} className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      progress.status === 'completed' ? 'bg-green-500' :
                      progress.status === 'error' ? 'bg-red-500' :
                      progress.status === 'crawling' ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-300'
                    }`}></div>
                    {progress.sourceName}
                  </span>
                  <span>
                    {progress.status === 'error' ? 'Error' : 
                     progress.status === 'completed' ? `${progress.articlesProcessed} articles` :
                     `${progress.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Sources</option>
              {getActiveSources().map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {articles.length === 0 ? (
              <div>
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No news articles yet</p>
                <p>Click "Refresh News" to crawl latest articles from news sources</p>
              </div>
            ) : (
              <div>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No articles match your filters</p>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredArticles.slice(0, 50).map((article) => (
              <div key={article.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {article.imageUrl && (
                    <img 
                      src={article.imageUrl} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        {onAnalyzeArticle && (
                          <button
                            onClick={() => onAnalyzeArticle(article)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            Analyze
                          </button>
                        )}
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {article.content.substring(0, 200)}...
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {article.source.name}
                      </span>
                      
                      {article.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {article.author}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(article.publishDate)}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {article.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredArticles.length > 0 && (
        <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
          Showing {Math.min(filteredArticles.length, 50)} of {filteredArticles.length} articles
        </div>
      )}
    </div>
  );
};
