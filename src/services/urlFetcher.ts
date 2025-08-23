import axios from 'axios';
import { bbcScraper } from './bbcScraper';
import { nytScraper } from './nytScraper';
import { cnnScraper } from './cnnScraper';

interface ArticleData {
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  source: string;
  url: string;
}

interface FetchProgress {
  stage: string;
  progress: number;
  message: string;
}

// Simple text extraction from HTML
const extractTextFromHTML = (html: string): { title: string; content: string } => {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract title
  const titleElement = doc.querySelector('title') || 
                      doc.querySelector('h1') || 
                      doc.querySelector('.title') ||
                      doc.querySelector('[class*="title"]') ||
                      doc.querySelector('[class*="headline"]');
  
  const title = titleElement?.textContent?.trim() || 'Untitled Article';
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement');
  scripts.forEach(el => el.remove());
  
  // Try to find main content
  const contentSelectors = [
    'article',
    '[class*="content"]',
    '[class*="article"]',
    '[class*="story"]',
    '[class*="post"]',
    '.entry-content',
    '.post-content',
    '.article-body',
    '.story-body',
    'main',
    '[role="main"]'
  ];
  
  let content = '';
  
  for (const selector of contentSelectors) {
    const contentElement = doc.querySelector(selector);
    if (contentElement) {
      // Get text content and clean it up
      content = contentElement.textContent || '';
      break;
    }
  }
  
  // Fallback to body if no content found
  if (!content.trim()) {
    content = doc.body?.textContent || '';
  }
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
    .trim();
  
  return { title, content };
};

// CORS proxy service (you would typically use your own backend for this)
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export class URLFetcher {
  private progressCallback?: (progress: FetchProgress) => void;

  setProgressCallback(callback: (progress: FetchProgress) => void) {
    this.progressCallback = callback;
  }

  private emitProgress(stage: string, progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  async fetchArticle(url: string): Promise<ArticleData> {
    try {
      // Validate URL
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
      }

      this.emitProgress('validation', 10, 'Validating URL...');
      
      // Check if it's a BBC URL and use specialized scraper
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname.includes('bbc.com') || hostname.includes('bbc.co.uk')) {
        this.emitProgress('detecting', 15, 'BBC News detected - using specialized scraper...');
        
        // Set up progress forwarding for BBC scraper
        bbcScraper.setProgressCallback((progress) => {
          this.emitProgress(progress.stage, progress.progress, progress.message);
        });

        const bbcArticle = await bbcScraper.scrapeArticle(url);
        
        return {
          title: bbcArticle.headline,
          content: bbcArticle.content,
          author: bbcArticle.author,
          publishDate: bbcArticle.publishDate,
          source: `BBC News - ${bbcArticle.category}`,
          url: bbcArticle.url
        };
      }

      // Check if it's a New York Times URL and use specialized scraper
      if (hostname === 'www.nytimes.com' || hostname === 'nytimes.com' || hostname.endsWith('.nytimes.com')) {
        this.emitProgress('detecting', 15, 'New York Times detected - using specialized scraper...');
        
        // Set up progress forwarding for NYT scraper
        nytScraper.setProgressCallback((progress) => {
          this.emitProgress(progress.stage, progress.progress, progress.message);
        });

        const nytArticle = await nytScraper.extractNYTContent(url);
        
        return {
          title: nytArticle.headline,
          content: nytArticle.content,
          author: nytArticle.author,
          publishDate: nytArticle.publishDate,
          source: `New York Times - ${nytArticle.section}`,
          url: nytArticle.url
        };
      }

      // Check if it's a CNN URL and use specialized scraper
      if (hostname === 'www.cnn.com' || hostname === 'cnn.com' || hostname === 'edition.cnn.com' || hostname.endsWith('.cnn.com')) {
        this.emitProgress('detecting', 15, 'CNN detected - using specialized scraper...');
        
        // Set up progress forwarding for CNN scraper
        cnnScraper.setProgressCallback((progress) => {
          this.emitProgress(progress.stage, progress.progress, progress.message);
        });

        const cnnArticle = await cnnScraper.extractCNNContent(url);
        
        return {
          title: cnnArticle.headline,
          content: cnnArticle.content,
          author: cnnArticle.author,
          publishDate: cnnArticle.publishDate,
          source: `CNN - ${cnnArticle.section}`,
          url: cnnArticle.url
        };
      }
      
      // Check if it's a news site (simple heuristic)
      const newsSites = [
        'cnn.com', 'reuters.com', 'ap.org', 'npr.org',
        'nytimes.com', 'washingtonpost.com', 'theguardian.com',
        'forbes.com', 'bloomberg.com', 'wsj.com', 'usatoday.com',
        'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'foxnews.com'
      ];
      
      const isKnownNewsSite = newsSites.some(site => hostname.includes(site));
      
      this.emitProgress('fetching', 25, 'Fetching article content...');

      // Fetch the content using CORS proxy
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      
      const response = await axios.get(proxyUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
        }
      });

      this.emitProgress('parsing', 50, 'Parsing HTML content...');

      if (!response.data || !response.data.contents) {
        throw new Error('Failed to fetch article content');
      }

      const html = response.data.contents;
      const { title, content } = extractTextFromHTML(html);

      this.emitProgress('extracting', 75, 'Extracting article text...');

      if (!content || content.length < 100) {
        throw new Error('Article content is too short or could not be extracted');
      }

      // Extract metadata
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const author = doc.querySelector('[name="author"]')?.getAttribute('content') ||
                    doc.querySelector('.author')?.textContent?.trim() ||
                    doc.querySelector('[class*="author"]')?.textContent?.trim();

      const publishDateMeta = doc.querySelector('[name="publish_date"]')?.getAttribute('content') ||
                             doc.querySelector('[property="article:published_time"]')?.getAttribute('content') ||
                             doc.querySelector('[name="date"]')?.getAttribute('content');

      let publishDate = publishDateMeta;
      if (publishDate) {
        try {
          publishDate = new Date(publishDate).toLocaleDateString();
        } catch {
          publishDate = publishDateMeta;
        }
      }

      this.emitProgress('complete', 100, 'Article extracted successfully!');

      const articleData: ArticleData = {
        title: title || 'Untitled Article',
        content: content.substring(0, 10000), // Limit content length
        author,
        publishDate: publishDate || new Date().toLocaleDateString(),
        source: hostname,
        url: url
      };

      // Add warning if not a known news site
      if (!isKnownNewsSite) {
        articleData.content = `⚠️ Note: This may not be from a recognized news source.\n\n${articleData.content}`;
      }

      return articleData;

    } catch (error) {
      console.error('Error fetching article:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          throw new Error('Network error: Unable to fetch the article. Please check your internet connection and try again.');
        }
        throw new Error(`Failed to fetch article: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred while fetching the article');
    }
  }

  // Alternative method for when CORS proxy fails
  async fetchArticleWithFallback(url: string): Promise<ArticleData> {
    try {
      return await this.fetchArticle(url);
    } catch (error) {
      // Fallback: create a placeholder article with the URL
      console.warn('Primary fetch failed, using fallback:', error);
      
      const urlObj = new URL(url);
      return {
        title: `Article from ${urlObj.hostname}`,
        content: `This is a simulated analysis of an article from ${url}. In a production environment, this would contain the actual article content extracted from the webpage. The system would analyze the real content for bias, credibility, and generate summaries based on the selected tone.`,
        publishDate: new Date().toLocaleDateString(),
        source: urlObj.hostname,
        url: url
      };
    }
  }
}

// Create and export the singleton instance
const urlFetcherInstance = new URLFetcher();
export { urlFetcherInstance as urlFetcher };
