import axios from 'axios';

export interface NewsSource {
  id: string;
  name: string;
  baseUrl: string;
  selectors: {
    articleLinks: string;
    title: string;
    content: string;
    author?: string;
    publishDate?: string;
    image?: string;
  };
  rssUrl?: string;
  category: string;
  country: string;
  language: string;
  enabled: boolean;
}

export interface CrawledArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  author?: string;
  publishDate: Date;
  source: NewsSource;
  imageUrl?: string;
  category: string;
  tags: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  biasScore?: number;
  credibilityScore?: number;
  crawledAt: Date;
}

export interface CrawlProgress {
  sourceId: string;
  sourceName: string;
  status: 'pending' | 'crawling' | 'completed' | 'error';
  progress: number;
  articlesFound: number;
  articlesProcessed: number;
  error?: string;
}

// Pre-configured news sources
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'bbc-news',
    name: 'BBC News',
    baseUrl: 'https://www.bbc.com/news',
    rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
    selectors: {
      articleLinks: 'a[href*="/news/"]',
      title: 'h1, .story-headline, [data-testid="headline"]',
      content: '.story-body, [data-component="text-block"], .rich-text',
      author: '.byline, .author, [data-testid="byline"]',
      publishDate: 'time, .date, [data-testid="timestamp"]',
      image: '.story-image img, .media-placeholder img'
    },
    category: 'general',
    country: 'GB',
    language: 'en',
    enabled: true
  },
  {
    id: 'cnn',
    name: 'CNN',
    baseUrl: 'https://www.cnn.com',
    rssUrl: 'http://rss.cnn.com/rss/edition.rss',
    selectors: {
      articleLinks: 'a[href*="/2024/"], a[href*="/2025/"]',
      title: 'h1, .headline, [data-analytics-link-article]',
      content: '.article-wrap, .zn-body, .l-container',
      author: '.byline, .metadata__byline',
      publishDate: '.timestamp, .update-time',
      image: '.media img, .image img'
    },
    category: 'general',
    country: 'US',
    language: 'en',
    enabled: true
  },
  {
    id: 'reuters',
    name: 'Reuters',
    baseUrl: 'https://www.reuters.com',
    rssUrl: 'https://www.reuters.com/arc/outboundfeeds/rss/',
    selectors: {
      articleLinks: 'a[href*="/world/"], a[href*="/business/"], a[href*="/technology/"]',
      title: 'h1, [data-testid="Heading"]',
      content: '[data-testid="ArticleBody"], .article-body',
      author: '[data-testid="AuthorName"], .author',
      publishDate: '[data-testid="ArticleHeader"] time, .date-line',
      image: '[data-testid="Image"] img'
    },
    category: 'general',
    country: 'US',
    language: 'en',
    enabled: true
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    baseUrl: 'https://www.theguardian.com',
    rssUrl: 'https://www.theguardian.com/world/rss',
    selectors: {
      articleLinks: 'a[href*="/2024/"], a[href*="/2025/"]',
      title: 'h1, .content__headline',
      content: '.content__article-body, .article-body-commercial-selector',
      author: '.byline, .contributor-full-name',
      publishDate: '.content__dateline time, .content__meta-container time',
      image: '.content__main-column img, figure img'
    },
    category: 'general',
    country: 'GB',
    language: 'en',
    enabled: true
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    baseUrl: 'https://techcrunch.com',
    rssUrl: 'https://techcrunch.com/feed/',
    selectors: {
      articleLinks: 'a[href*="/2024/"], a[href*="/2025/"]',
      title: 'h1, .article__title',
      content: '.article-content, .entry-content',
      author: '.article__byline, .byline',
      publishDate: '.article__meta time, .byline time',
      image: '.article__featured-image img'
    },
    category: 'technology',
    country: 'US',
    language: 'en',
    enabled: true
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    baseUrl: 'https://arstechnica.com',
    rssUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    selectors: {
      articleLinks: 'a[href*="/2024/"], a[href*="/2025/"]',
      title: 'h1, .post-title',
      content: '.post-content, .article-content',
      author: '.byline, .author',
      publishDate: '.byline time, .post-meta time',
      image: '.listing-image img, .post-image img'
    },
    category: 'technology',
    country: 'US',
    language: 'en',
    enabled: true
  }
];

// CORS proxy for web scraping
const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

export class NewsCrawler {
  private isRunning: boolean = false;
  private progressCallbacks: Set<(progress: CrawlProgress[]) => void> = new Set();
  private currentProgress: Map<string, CrawlProgress> = new Map();
  private crawledArticles: CrawledArticle[] = [];
  private maxArticlesPerSource: number = 10;
  private crawlInterval?: number;

  constructor(maxArticlesPerSource: number = 10) {
    this.maxArticlesPerSource = maxArticlesPerSource;
  }

  subscribeToProgress(callback: (progress: CrawlProgress[]) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private emitProgress() {
    const progressArray = Array.from(this.currentProgress.values());
    this.progressCallbacks.forEach(callback => callback(progressArray));
  }

  private updateProgress(sourceId: string, updates: Partial<CrawlProgress>) {
    const current = this.currentProgress.get(sourceId);
    if (current) {
      this.currentProgress.set(sourceId, { ...current, ...updates });
      this.emitProgress();
    }
  }

  private async fetchWithProxy(url: string): Promise<string> {
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.data || !response.data.contents) {
        throw new Error('Failed to fetch content');
      }

      return response.data.contents;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  private async fetchRSSFeed(rssUrl: string): Promise<any[]> {
    try {
      const response = await axios.get(`${RSS_PROXY}${encodeURIComponent(rssUrl)}`, {
        timeout: 10000
      });

      if (response.data && response.data.items) {
        return response.data.items.slice(0, this.maxArticlesPerSource);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
      return [];
    }
  }

  private extractTextFromElement(html: string, selector: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const elements = doc.querySelectorAll(selector);
      
      if (elements.length > 0) {
        return Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 0)
          .join(' ')
          .substring(0, 2000); // Limit length
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  private async crawlSource(source: NewsSource): Promise<CrawledArticle[]> {
    const articles: CrawledArticle[] = [];
    
    // Initialize progress
    this.currentProgress.set(source.id, {
      sourceId: source.id,
      sourceName: source.name,
      status: 'crawling',
      progress: 0,
      articlesFound: 0,
      articlesProcessed: 0
    });

    try {
      // Try RSS first if available
      if (source.rssUrl) {
        this.updateProgress(source.id, { progress: 10 });
        
        const rssItems = await this.fetchRSSFeed(source.rssUrl);
        
        this.updateProgress(source.id, { 
          progress: 30, 
          articlesFound: rssItems.length 
        });

        for (let i = 0; i < Math.min(rssItems.length, this.maxArticlesPerSource); i++) {
          const item = rssItems[i];
          
          try {
            const article: CrawledArticle = {
              id: `${source.id}-${Date.now()}-${i}`,
              title: item.title || 'Untitled',
              content: item.description || item.content || '',
              url: item.link || item.guid || '',
              author: item.author || undefined,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              source: source,
              imageUrl: item.thumbnail || item.enclosure?.link,
              category: source.category,
              tags: item.categories || [],
              crawledAt: new Date()
            };

            // Try to fetch full content if URL is available
            if (article.url && article.content.length < 200) {
              try {
                const fullHtml = await this.fetchWithProxy(article.url);
                const fullContent = this.extractTextFromElement(fullHtml, source.selectors.content);
                if (fullContent.length > article.content.length) {
                  article.content = fullContent;
                }
              } catch (error) {
                console.warn(`Failed to fetch full content for ${article.url}`);
              }
            }

            articles.push(article);
            
            this.updateProgress(source.id, {
              progress: 30 + (i / rssItems.length) * 60,
              articlesProcessed: i + 1
            });

            // Add delay to avoid overwhelming servers
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`Error processing RSS item ${i}:`, error);
          }
        }
      } else {
        // Fallback to web scraping
        this.updateProgress(source.id, { progress: 10 });
        
        const html = await this.fetchWithProxy(source.baseUrl);
        this.updateProgress(source.id, { progress: 30 });
        
        // Extract article links
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const linkElements = doc.querySelectorAll(source.selectors.articleLinks);
        const links = Array.from(linkElements)
          .map(el => (el as HTMLAnchorElement).href)
          .filter(href => href && href.includes('http'))
          .slice(0, this.maxArticlesPerSource);

        this.updateProgress(source.id, { 
          progress: 40, 
          articlesFound: links.length 
        });

        // Process each article link
        for (let i = 0; i < links.length; i++) {
          try {
            const articleHtml = await this.fetchWithProxy(links[i]);
            
            const title = this.extractTextFromElement(articleHtml, source.selectors.title);
            const content = this.extractTextFromElement(articleHtml, source.selectors.content);
            const author = source.selectors.author ? 
              this.extractTextFromElement(articleHtml, source.selectors.author) : undefined;

            if (title && content.length > 100) {
              const article: CrawledArticle = {
                id: `${source.id}-${Date.now()}-${i}`,
                title,
                content,
                url: links[i],
                author,
                publishDate: new Date(),
                source: source,
                category: source.category,
                tags: [],
                crawledAt: new Date()
              };

              articles.push(article);
            }

            this.updateProgress(source.id, {
              progress: 40 + (i / links.length) * 50,
              articlesProcessed: i + 1
            });

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`Error crawling article ${links[i]}:`, error);
          }
        }
      }

      this.updateProgress(source.id, {
        status: 'completed',
        progress: 100
      });

    } catch (error) {
      console.error(`Error crawling source ${source.name}:`, error);
      this.updateProgress(source.id, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return articles;
  }

  async crawlAllSources(sources?: NewsSource[]): Promise<CrawledArticle[]> {
    if (this.isRunning) {
      throw new Error('Crawler is already running');
    }

    this.isRunning = true;
    this.crawledArticles = [];
    this.currentProgress.clear();

    const sourcesToCrawl = sources || NEWS_SOURCES.filter(s => s.enabled);

    // Initialize progress for all sources
    sourcesToCrawl.forEach(source => {
      this.currentProgress.set(source.id, {
        sourceId: source.id,
        sourceName: source.name,
        status: 'pending',
        progress: 0,
        articlesFound: 0,
        articlesProcessed: 0
      });
    });

    this.emitProgress();

    try {
      // Crawl sources with limited concurrency
      const batchSize = 2; // Process 2 sources concurrently
      
      for (let i = 0; i < sourcesToCrawl.length; i += batchSize) {
        const batch = sourcesToCrawl.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (source) => {
          try {
            const articles = await this.crawlSource(source);
            this.crawledArticles.push(...articles);
            return articles;
          } catch (error) {
            console.error(`Failed to crawl ${source.name}:`, error);
            return [];
          }
        });

        await Promise.all(batchPromises);
        
        // Add delay between batches
        if (i + batchSize < sourcesToCrawl.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Sort articles by publish date (newest first)
      this.crawledArticles.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());

    } finally {
      this.isRunning = false;
    }

    return this.crawledArticles;
  }

  startPeriodicCrawling(intervalMinutes: number = 30): void {
    this.stopPeriodicCrawling();
    
    this.crawlInterval = window.setInterval(() => {
      if (!this.isRunning) {
        this.crawlAllSources().catch(console.error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicCrawling(): void {
    if (this.crawlInterval) {
      clearInterval(this.crawlInterval);
      this.crawlInterval = undefined;
    }
  }

  getArticles(): CrawledArticle[] {
    return this.crawledArticles;
  }

  getArticlesByCategory(category: string): CrawledArticle[] {
    return this.crawledArticles.filter(article => article.category === category);
  }

  getArticlesBySource(sourceId: string): CrawledArticle[] {
    return this.crawledArticles.filter(article => article.source.id === sourceId);
  }

  searchArticles(query: string): CrawledArticle[] {
    const lowercaseQuery = query.toLowerCase();
    return this.crawledArticles.filter(article => 
      article.title.toLowerCase().includes(lowercaseQuery) ||
      article.content.toLowerCase().includes(lowercaseQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const newsCrawler = new NewsCrawler();
