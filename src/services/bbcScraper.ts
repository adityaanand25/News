import axios from 'axios';

interface BBCArticle {
  headline: string;
  content: string;
  author?: string;
  publishDate: string;
  category?: string;
  imageUrl?: string;
  tags: string[];
  url: string;
}

interface ScrapingProgress {
  stage: string;
  progress: number;
  message: string;
}

export class BBCNewsScraper {
  private progressCallback?: (progress: ScrapingProgress) => void;
  private readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';

  setProgressCallback(callback: (progress: ScrapingProgress) => void) {
    this.progressCallback = callback;
  }

  private emitProgress(stage: string, progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  private isBBCUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('bbc.com') || urlObj.hostname.includes('bbc.co.uk');
    } catch {
      return false;
    }
  }

  private extractBBCContent(html: string, url: string): BBCArticle {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract headline - BBC uses various selectors
    let headline = '';
    const headlineSelectors = [
      'h1[data-testid="headline"]',
      'h1.story-body__h1',
      'h1.post-title__text',
      '.media-object__title',
      'h1',
      '.story-headline'
    ];

    for (const selector of headlineSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        headline = element.textContent.trim();
        break;
      }
    }

    // Extract content - BBC article body
    let content = '';
    const contentSelectors = [
      '[data-component="text-block"]',
      '.story-body__inner',
      '.post-content',
      'article',
      '[role="main"]'
    ];

    for (const selector of contentSelectors) {
      const elements = doc.querySelectorAll(selector);
      if (elements.length > 0) {
        const textParts: string[] = [];
        elements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 50) { // Only include substantial text blocks
            textParts.push(text);
          }
        });
        if (textParts.length > 0) {
          content = textParts.join('\n\n');
          break;
        }
      }
    }

    // Fallback content extraction
    if (!content) {
      const paragraphs = doc.querySelectorAll('p');
      const textParts: string[] = [];
      paragraphs.forEach(p => {
        const text = p.textContent?.trim();
        if (text && text.length > 30) {
          textParts.push(text);
        }
      });
      content = textParts.slice(0, 10).join('\n\n'); // Take first 10 substantial paragraphs
    }

    // Extract author
    let author = '';
    const authorSelectors = [
      '[data-testid="byline"]',
      '.byline',
      '.author',
      '[rel="author"]',
      '.story-byline'
    ];

    for (const selector of authorSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        author = element.textContent.trim().replace(/^By\s+/i, '');
        break;
      }
    }

    // Extract publish date
    let publishDate = '';
    const dateSelectors = [
      '[data-testid="timestamp"]',
      'time',
      '.date',
      '.story-date',
      '[datetime]'
    ];

    for (const selector of dateSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const datetime = element.getAttribute('datetime') || element.textContent?.trim();
        if (datetime) {
          try {
            publishDate = new Date(datetime).toLocaleDateString();
            break;
          } catch {
            publishDate = datetime;
            break;
          }
        }
      }
    }

    // Extract category from URL or page
    let category = '';
    const urlPath = new URL(url).pathname;
    const pathParts = urlPath.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
      category = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
    }

    // Extract image
    let imageUrl = '';
    const imageSelectors = [
      '[data-testid="image"]',
      '.story-image img',
      'article img',
      '.media-landscape__image img'
    ];

    for (const selector of imageSelectors) {
      const img = doc.querySelector(selector) as HTMLImageElement;
      if (img?.src) {
        imageUrl = img.src.startsWith('http') ? img.src : `https://www.bbc.com${img.src}`;
        break;
      }
    }

    // Extract tags/topics
    const tags: string[] = [];
    const tagSelectors = [
      '.tags a',
      '.story-topic a',
      '[data-testid="topic"] a'
    ];

    tagSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(element => {
        const tag = element.textContent?.trim();
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });
    });

    return {
      headline: headline || 'BBC News Article',
      content: content || 'Content could not be extracted from this BBC article.',
      author: author || 'BBC News',
      publishDate: publishDate || new Date().toLocaleDateString(),
      category: category || 'News',
      imageUrl,
      tags,
      url
    };
  }

  async scrapeArticle(url: string): Promise<BBCArticle> {
    try {
      // Validate BBC URL
      if (!this.isBBCUrl(url)) {
        throw new Error('This scraper is specifically designed for BBC News URLs. Please provide a valid BBC News article URL.');
      }

      this.emitProgress('validation', 5, 'Validating BBC News URL...');
      
      // Add small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));
      
      this.emitProgress('connecting', 15, 'Connecting to BBC News...');

      // Fetch the content
      this.emitProgress('fetching', 25, 'Fetching article from BBC News...');
      
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(url)}`;
      
      const response = await axios.get(proxyUrl, {
        timeout: 30000, // Increased timeout
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.data || !response.data.contents) {
        throw new Error('Failed to fetch article content from BBC News');
      }

      this.emitProgress('processing', 50, 'Processing article content...');
      await new Promise(resolve => setTimeout(resolve, 200));

      this.emitProgress('parsing', 70, 'Parsing BBC News article...');

      const html = response.data.contents;
      const article = this.extractBBCContent(html, url);

      this.emitProgress('validating', 85, 'Validating extracted content...');

      // Validate extracted content
      if (!article.content || article.content.length < 100) {
        throw new Error('Unable to extract sufficient content from this BBC News article. The article may be behind a paywall or use a different layout.');
      }

      this.emitProgress('finalizing', 95, 'Finalizing extraction...');
      await new Promise(resolve => setTimeout(resolve, 100));

      this.emitProgress('complete', 100, 'BBC News article successfully scraped!');

      return article;

    } catch (error) {
      console.error('BBC News scraping error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Timeout: BBC News is taking too long to respond. Please try again.');
        }
        if (error.message.includes('Network Error')) {
          throw new Error('Network error: Unable to connect to BBC News. Please check your internet connection.');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while scraping BBC News article');
    }
  }

  // Method to scrape multiple BBC articles from a search or category page
  async scrapeMultipleArticles(categoryUrl: string, limit: number = 10): Promise<BBCArticle[]> {
    try {
      this.emitProgress('fetching', 20, 'Fetching BBC News category page...');
      
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(categoryUrl)}`;
      const response = await axios.get(proxyUrl, { timeout: 15000 });
      
      if (!response.data?.contents) {
        throw new Error('Failed to fetch BBC News category page');
      }

      this.emitProgress('parsing', 50, 'Extracting article links...');

      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data.contents, 'text/html');

      // Find article links
      const articleLinks: string[] = [];
      const linkSelectors = [
        'a[href*="/news/"]',
        'a[href*="/sport/"]',
        'a[href*="/business/"]',
        'a[href*="/technology/"]'
      ];

      linkSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(link => {
          const href = (link as HTMLAnchorElement).href;
          if (href && !articleLinks.includes(href) && this.isBBCUrl(href)) {
            articleLinks.push(href);
          }
        });
      });

      this.emitProgress('scraping', 70, `Scraping ${Math.min(limit, articleLinks.length)} articles...`);

      // Scrape individual articles
      const articles: BBCArticle[] = [];
      const articlesToScrape = articleLinks.slice(0, limit);

      for (let i = 0; i < articlesToScrape.length; i++) {
        try {
          const article = await this.scrapeArticle(articlesToScrape[i]);
          articles.push(article);
          
          const progress = 70 + ((i + 1) / articlesToScrape.length) * 25;
          this.emitProgress('scraping', progress, `Scraped ${i + 1}/${articlesToScrape.length} articles`);
          
          // Add delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to scrape article ${articlesToScrape[i]}:`, error);
        }
      }

      this.emitProgress('complete', 100, `Successfully scraped ${articles.length} BBC News articles`);

      return articles;

    } catch (error) {
      console.error('Multiple article scraping error:', error);
      throw new Error('Failed to scrape multiple BBC News articles');
    }
  }
}

export const bbcScraper = new BBCNewsScraper();
