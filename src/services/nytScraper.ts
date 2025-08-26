import axios from 'axios';

interface NYTArticle {
  headline: string;
  content: string;
  author?: string;
  publishDate: string;
  section?: string;
  imageUrl?: string;
  tags: string[];
  url: string;
  byline?: string;
}

interface ScrapingProgress {
  stage: string;
  progress: number;
  message: string;
}

export class NYTimesScraper {
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

  async extractNYTContent(url: string): Promise<NYTArticle> {
    this.emitProgress('validation', 5, 'Validating New York Times URL...');

    if (!this.isValidNYTUrl(url)) {
      throw new Error('Invalid New York Times URL');
    }

    this.emitProgress('connecting', 15, 'Connecting to NY Times...');
    await new Promise(resolve => setTimeout(resolve, 150));
    
    this.emitProgress('fetching', 25, 'Fetching article from NY Times...');

    try {
      // Try direct fetch first (for development/local testing)
      let response;
      try {
        response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.data) {
          this.emitProgress('processing', 50, 'Processing article content...');
          await new Promise(resolve => setTimeout(resolve, 200));
          
          this.emitProgress('parsing', 70, 'Parsing NY Times article structure...');
          const article = this.parseNYTHtml(response.data, url);
          
          this.emitProgress('finalizing', 95, 'Finalizing extraction...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          this.emitProgress('complete', 100, 'NY Times article extracted successfully');
          return article;
        } else {
          throw new Error('No data received from direct fetch');
        }
      } catch (directFetchError) {
        console.warn('Direct fetch failed, trying CORS proxy:', directFetchError);
        
        this.emitProgress('retrying', 35, 'Trying alternative access method...');
        
        // Fallback to CORS proxy
        response = await axios.get(`${this.CORS_PROXY}${encodeURIComponent(url)}`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.data || !response.data.contents) {
          throw new Error('Failed to fetch article content via CORS proxy');
        }

        this.emitProgress('processing', 55, 'Processing proxied content...');
        await new Promise(resolve => setTimeout(resolve, 200));

        this.emitProgress('parsing', 75, 'Parsing NY Times article structure...');
        const htmlContent = response.data.contents;
        const article = this.parseNYTHtml(htmlContent, url);
        
        this.emitProgress('finalizing', 95, 'Finalizing extraction...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.emitProgress('complete', 100, 'NY Times article extracted successfully');
        return article;
      }
    } catch (error) {
      this.emitProgress('error', 0, `Failed to extract NY Times content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private isValidNYTUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      return hostname === 'www.nytimes.com' || 
             hostname === 'nytimes.com' ||
             hostname.endsWith('.nytimes.com');
    } catch {
      return false;
    }
  }

  private parseNYTHtml(html: string, url: string): NYTArticle {
    // Create a simple DOM parser for key content
    const getContentBetweenTags = (html: string, tag: string, attr?: string, value?: string): string[] => {
      const regex = attr && value 
        ? new RegExp(`<${tag}[^>]*${attr}=["'][^"']*${value}[^"']*["'][^>]*>(.*?)<\/${tag}>`, 'gis')
        : new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gis');
      
      const matches = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        matches.push(match[1].replace(/<[^>]*>/g, '').trim());
      }
      return matches;
    };

    const getMetaContent = (html: string, property: string): string => {
      const metaRegex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(metaRegex);
      return match ? match[1] : '';
    };

    // Extract headline
    let headline = getMetaContent(html, 'og:title') || 
                   getMetaContent(html, 'twitter:title') ||
                   getContentBetweenTags(html, 'h1')[0] ||
                   'NY Times Article';

    // Clean headline
    headline = headline.replace(/\s*-\s*The New York Times\s*$/i, '').trim();

    // Extract content - NYT uses specific selectors
    let content = '';
    
    // Try multiple selectors for NYT article content (updated for 2024/2025)
    const articleSelectors = [
      'StoryBodyCompanionColumn',
      'ArticleBody',
      'story-body',
      'article-body',
      'css-53u6y8', // Common NYT class
      'css-at9mc1', // Updated NYT class
      'css-1fanzo5', // Another common NYT class
      'StoryBody',
      'story-content',
      'ArticleBody-articleBody',
      'RichTextStoryBody',
      'ArticleBodyInterstitial'
    ];

    for (const selector of articleSelectors) {
      const selectorContent = getContentBetweenTags(html, 'div', 'class', selector);
      if (selectorContent.length > 0 && selectorContent.join(' ').length > 100) {
        content = selectorContent.join(' ');
        break;
      }
    }

    // Fallback: extract paragraphs if specific selectors don't work
    if (!content || content.length < 100) {
      const paragraphs = getContentBetweenTags(html, 'p').filter(p => 
        p.length > 50 && 
        !p.toLowerCase().includes('subscribe') &&
        !p.toLowerCase().includes('advertisement') &&
        !p.toLowerCase().includes('sign up') &&
        !p.toLowerCase().includes('newsletter') &&
        !p.toLowerCase().includes('follow us') &&
        !p.toLowerCase().includes('download the app')
      );
      
      if (paragraphs.length > 0) {
        content = paragraphs.slice(0, 15).join(' ');
      }
    }

    // Final fallback: extract any meaningful text content
    if (!content || content.length < 50) {
      // Look for JSON-LD structured data that NYT often uses
      const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
      const jsonMatches = html.match(jsonLdRegex);
      
      if (jsonMatches) {
        for (const jsonMatch of jsonMatches) {
          try {
            const jsonContent = jsonMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const data = JSON.parse(jsonContent);
            if (data.articleBody || data.description) {
              content = data.articleBody || data.description;
              break;
            }
          } catch (e) {
            // Continue to next match
          }
        }
      }
    }

    // Extract author/byline
    let author = getMetaContent(html, 'author') ||
                 getMetaContent(html, 'article:author') ||
                 getContentBetweenTags(html, 'span', 'class', 'byline')[0] ||
                 getContentBetweenTags(html, 'div', 'class', 'byline')[0];

    // Clean author name
    if (author) {
      author = author.replace(/^By\s+/i, '').trim();
    }

    // Extract publish date
    let publishDate = getMetaContent(html, 'article:published_time') ||
                      getMetaContent(html, 'publish-date') ||
                      getMetaContent(html, 'date') ||
                      new Date().toISOString();

    // Format date
    try {
      publishDate = new Date(publishDate).toLocaleDateString();
    } catch {
      publishDate = new Date().toLocaleDateString();
    }

    // Extract section
    const section = getMetaContent(html, 'article:section') ||
                    getMetaContent(html, 'section') ||
                    this.extractSectionFromUrl(url);

    // Extract image
    const imageUrl = getMetaContent(html, 'og:image') ||
                     getMetaContent(html, 'twitter:image');

    // Extract tags/keywords
    const keywords = getMetaContent(html, 'keywords') ||
                     getMetaContent(html, 'news_keywords') ||
                     '';
    const tags = keywords ? keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Add section as tag if available
    if (section && !tags.includes(section)) {
      tags.unshift(section);
    }

    return {
      headline: headline || 'NY Times Article',
      content: content || `This appears to be a New York Times article, but the content could not be extracted due to the site's structure or anti-scraping measures. The article is available at: ${url}
      
      Note: NY Times articles often require a subscription to view full content. Try using the article's direct URL in your browser for the complete text.`,
      author: author || undefined,
      publishDate,
      section: section || undefined,
      imageUrl: imageUrl || undefined,
      tags,
      url,
      byline: author
    };
  }

  private extractSectionFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      const segments = path.split('/').filter(segment => segment.length > 0);
      
      // NYT URL structure: /section/year/month/day/title or /section/title
      if (segments.length > 0) {
        const firstSegment = segments[0];
        
        // Common NYT sections
        const knownSections = [
          'world', 'us', 'politics', 'business', 'technology', 'science',
          'health', 'sports', 'arts', 'style', 'food', 'travel',
          'magazine', 'opinion', 'realestate', 'automobiles', 'jobs'
        ];
        
        if (knownSections.includes(firstSegment.toLowerCase())) {
          return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
        }
      }
      
      return 'News';
    } catch {
      return 'News';
    }
  }

  // Test URLs for development
  getTestUrls(): string[] {
    return [
      'https://www.nytimes.com/2024/01/15/world/climate-change-report.html',
      'https://www.nytimes.com/2024/01/15/technology/artificial-intelligence.html',
      'https://www.nytimes.com/2024/01/15/business/economy-forecast.html',
      'https://www.nytimes.com/2024/01/15/politics/election-updates.html',
      'https://www.nytimes.com/2024/01/15/health/medical-breakthrough.html'
    ];
  }

  // Batch scraping for multiple URLs
  async scrapeMultipleArticles(urls: string[]): Promise<NYTArticle[]> {
    const articles: NYTArticle[] = [];
    const total = urls.length;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      this.emitProgress('batch', Math.round(((i + 1) / total) * 100), `Processing article ${i + 1} of ${total}`);

      try {
        const article = await this.extractNYTContent(url);
        articles.push(article);
        
        // Small delay between requests to be respectful
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }

    return articles;
  }
}

// Singleton instance
export const nytScraper = new NYTimesScraper();
