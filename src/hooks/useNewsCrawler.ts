import { useState, useEffect, useCallback } from 'react';
import { newsCrawler, CrawledArticle, CrawlProgress } from '../services/newsCrawler';

interface UseNewsCrawlerReturn {
  articles: CrawledArticle[];
  crawlProgress: CrawlProgress[];
  isLoading: boolean;
  lastUpdate: Date | null;
  startCrawling: () => Promise<void>;
  stopCrawling: () => void;
  searchArticles: (query: string) => CrawledArticle[];
  getArticlesByCategory: (category: string) => CrawledArticle[];
  getArticlesBySource: (sourceId: string) => CrawledArticle[];
  startPeriodicCrawling: (intervalMinutes?: number) => void;
  stopPeriodicCrawling: () => void;
  isCurrentlyRunning: boolean;
}

export const useNewsCrawler = (): UseNewsCrawlerReturn => {
  const [articles, setArticles] = useState<CrawledArticle[]>([]);
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isCurrentlyRunning, setIsCurrentlyRunning] = useState(false);

  // Subscribe to crawler progress updates
  useEffect(() => {
    const unsubscribe = newsCrawler.subscribeToProgress((progress) => {
      setCrawlProgress(progress);
      setIsCurrentlyRunning(newsCrawler.isCurrentlyRunning());
      
      // Check if crawling is complete
      if (progress.length > 0) {
        const allCompleted = progress.every(p => p.status === 'completed' || p.status === 'error');
        if (allCompleted) {
          setArticles(newsCrawler.getArticles());
          setLastUpdate(new Date());
          setIsLoading(false);
          setIsCurrentlyRunning(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const startCrawling = useCallback(async () => {
    if (newsCrawler.isCurrentlyRunning()) {
      console.warn('Crawler is already running');
      return;
    }

    setIsLoading(true);
    setIsCurrentlyRunning(true);
    setCrawlProgress([]);

    try {
      const crawledArticles = await newsCrawler.crawlAllSources();
      setArticles(crawledArticles);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to crawl news sources:', error);
    } finally {
      setIsLoading(false);
      setIsCurrentlyRunning(false);
    }
  }, []);

  const stopCrawling = useCallback(() => {
    newsCrawler.stopPeriodicCrawling();
    setIsLoading(false);
    setIsCurrentlyRunning(false);
  }, []);

  const searchArticles = useCallback((query: string): CrawledArticle[] => {
    return newsCrawler.searchArticles(query);
  }, []);

  const getArticlesByCategory = useCallback((category: string): CrawledArticle[] => {
    return newsCrawler.getArticlesByCategory(category);
  }, []);

  const getArticlesBySource = useCallback((sourceId: string): CrawledArticle[] => {
    return newsCrawler.getArticlesBySource(sourceId);
  }, []);

  const startPeriodicCrawling = useCallback((intervalMinutes: number = 30) => {
    newsCrawler.startPeriodicCrawling(intervalMinutes);
  }, []);

  const stopPeriodicCrawling = useCallback(() => {
    newsCrawler.stopPeriodicCrawling();
  }, []);

  return {
    articles,
    crawlProgress,
    isLoading,
    lastUpdate,
    startCrawling,
    stopCrawling,
    searchArticles,
    getArticlesByCategory,
    getArticlesBySource,
    startPeriodicCrawling,
    stopPeriodicCrawling,
    isCurrentlyRunning
  };
};
