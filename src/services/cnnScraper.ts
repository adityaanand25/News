import axios from 'axios';

interface CNNArticle {
  headline: string;
  content: string;
  author?: string;
  publishDate: string;
  section?: string;
  imageUrl?: string;
  tags: string[];
  url: string;
}

interface ScrapingProgress {
  stage: string;
  progress: number;
  message: string;
}

export class CNNScraper {
  private readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  private progressCallback?: (progress: ScrapingProgress) => void;

  setProgressCallback(callback: (progress: ScrapingProgress) => void) {
    this.progressCallback = callback;
  }

  private emitProgress(stage: string, progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  async extractCNNContent(url: string): Promise<CNNArticle> {
    this.emitProgress('validation', 10, 'Validating CNN URL...');

    if (!this.isValidCNNUrl(url)) {
      throw new Error('Invalid CNN URL');
    }

    this.emitProgress('fetching', 30, 'Fetching article from CNN...');

    try {
      // Try CORS proxy for CNN (they have strong anti-scraping measures)
      const response = await axios.get(`${this.CORS_PROXY}${encodeURIComponent(url)}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.data || !response.data.contents) {
        throw new Error('Failed to fetch article content via CORS proxy');
      }

      this.emitProgress('parsing', 60, 'Parsing CNN article structure...');
      const htmlContent = response.data.contents;
      const article = this.parseCNNHtml(htmlContent, url);
      this.emitProgress('complete', 100, 'CNN article extracted successfully');
      return article;

    } catch (error) {
      this.emitProgress('error', 0, `Failed to extract CNN content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private isValidCNNUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      return hostname === 'www.cnn.com' || 
             hostname === 'cnn.com' ||
             hostname === 'edition.cnn.com' ||
             hostname.endsWith('.cnn.com');
    } catch {
      return false;
    }
  }

  private parseCNNHtml(html: string, url: string): CNNArticle {
    // Create a more sophisticated DOM parser for CNN content
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
                   'CNN Article';

    // Clean headline
    headline = headline.replace(/\s*-\s*CNN\s*$/i, '').trim();

    // Extract content using CNN-specific selectors and fallback strategies
    let content = '';
    
    // Try CNN-specific content selectors (updated for current CNN structure)
    const cnnContentSelectors = [
      'zn-body__paragraph',
      'zn-body__read-all',
      'pg-rail-tall__body',
      'l-container',
      'zn-body',
      'cnn-article__content',
      'Article__content',
      'BasicArticle__main',
      'ArticleBody',
      'story-body',
      'article-wrap'
    ];

    // First, try structured content extraction
    for (const selector of cnnContentSelectors) {
      const selectorContent = getContentBetweenTags(html, 'div', 'class', selector);
      if (selectorContent.length > 0) {
        const joinedContent = selectorContent.join(' ').trim();
        if (joinedContent.length > 100) {
          content = joinedContent;
          break;
        }
      }
    }

    // Enhanced paragraph extraction with better filtering
    if (!content || content.length < 100) {
      const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gis;
      const paragraphs: string[] = [];
      let match;
      
      while ((match = paragraphRegex.exec(html)) !== null) {
        const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
        
        // More comprehensive filtering for CNN content
        if (cleanText.length > 30 && 
            !cleanText.toLowerCase().includes('subscribe') &&
            !cleanText.toLowerCase().includes('advertisement') &&
            !cleanText.toLowerCase().includes('sign up') &&
            !cleanText.toLowerCase().includes('newsletter') &&
            !cleanText.toLowerCase().includes('follow us') &&
            !cleanText.toLowerCase().includes('related:') &&
            !cleanText.toLowerCase().includes('watch:') &&
            !cleanText.toLowerCase().includes('read more') &&
            !cleanText.toLowerCase().includes('click here') &&
            !cleanText.toLowerCase().includes('cnn.com') &&
            !cleanText.toLowerCase().includes('© 20') &&
            !cleanText.match(/^\s*\d+\s*$/) && // Skip standalone numbers
            !cleanText.match(/^[A-Z]{2,}\s*$/) && // Skip all caps short text
            cleanText.includes(' ')) { // Ensure it's a sentence, not just a word
          paragraphs.push(cleanText);
        }
      }
      
      // Take more paragraphs and join them for better content
      if (paragraphs.length > 0) {
        content = paragraphs.slice(0, 20).join(' ');
      }
    }

    // Try to extract from JSON-LD structured data (CNN often uses this)
    if (!content || content.length < 100) {
      const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
      const jsonMatches = html.match(jsonLdRegex);
      
      if (jsonMatches) {
        for (const jsonMatch of jsonMatches) {
          try {
            const jsonContent = jsonMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const data = JSON.parse(jsonContent);
            
            // Look for article body in various formats
            if (data.articleBody && typeof data.articleBody === 'string' && data.articleBody.length > 100) {
              content = data.articleBody;
              break;
            } else if (data.description && data.description.length > 100) {
              content = data.description;
              break;
            } else if (data['@graph']) {
              // Sometimes CNN uses graph structure
              for (const item of data['@graph']) {
                if (item.articleBody && item.articleBody.length > 100) {
                  content = item.articleBody;
                  break;
                }
              }
              if (content) break;
            }
          } catch (e) {
            // Continue to next match
          }
        }
      }
    }

    // Final fallback: extract from article tag content
    if (!content || content.length < 50) {
      const articleContent = getContentBetweenTags(html, 'article');
      if (articleContent.length > 0) {
        const fullText = articleContent.join(' ');
        // Extract meaningful sentences
        const sentences = fullText.split(/[.!?]+/).filter(s => 
          s.trim().length > 20 && 
          !s.toLowerCase().includes('subscribe') &&
          !s.toLowerCase().includes('advertisement')
        );
        content = sentences.slice(0, 10).join('. ') + '.';
      }
    }

    // Extract author/byline with enhanced detection
    let author = getMetaContent(html, 'author') ||
                 getMetaContent(html, 'article:author') ||
                 getContentBetweenTags(html, 'span', 'class', 'byline')[0] ||
                 getContentBetweenTags(html, 'div', 'class', 'byline')[0] ||
                 getContentBetweenTags(html, 'span', 'class', 'metadata__byline')[0] ||
                 getContentBetweenTags(html, 'div', 'class', 'author')[0] ||
                 getContentBetweenTags(html, 'p', 'class', 'byline')[0];

    // Try to extract author from JSON-LD
    if (!author && html.includes('application/ld+json')) {
      const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
      let match;
      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const jsonContent = match[1].replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          if (data.author) {
            if (typeof data.author === 'string') {
              author = data.author;
            } else if (data.author.name) {
              author = data.author.name;
            } else if (Array.isArray(data.author) && data.author[0]?.name) {
              author = data.author[0].name;
            }
            if (author) break;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    // Clean author name
    if (author) {
      author = author.replace(/^By\s+/i, '')
                   .replace(/\s*,.*$/, '')
                   .replace(/CNN\s*/i, '')
                   .trim();
    }

    // Extract publish date
    let publishDate = getMetaContent(html, 'article:published_time') ||
                      getMetaContent(html, 'publishdate') ||
                      new Date().toISOString();

    // Format publish date
    if (publishDate && publishDate !== new Date().toISOString()) {
      try {
        publishDate = new Date(publishDate).toLocaleDateString();
      } catch {
        publishDate = new Date().toLocaleDateString();
      }
    } else {
      publishDate = new Date().toLocaleDateString();
    }

    // Extract section from URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    let section = '';
    
    if (pathSegments.length > 0) {
      const sectionSegment = pathSegments[0];
      
      // Map common CNN sections to display names
      const sectionMap: { [key: string]: string } = {
        'politics': 'Politics',
        'business': 'Business',
        'world': 'World',
        'us': 'US',
        'sport': 'Sport',
        'entertainment': 'Entertainment',
        'tech': 'Technology',
        'health': 'Health',
        'style': 'Style',
        'travel': 'Travel',
        'opinions': 'Opinion'
      };
      
      section = sectionMap[sectionSegment] || sectionSegment.charAt(0).toUpperCase() + sectionSegment.slice(1);
    }

    // Extract featured image
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
      headline: headline || 'CNN Article',
      content: content || `Unable to extract the full article content from this CNN URL. This may be due to:

• The article may be behind a paywall or require subscription
• Content may be loaded dynamically with JavaScript
• The article structure may have changed since scraper implementation
• Regional access restrictions may apply

Article URL: ${url}
Headline: ${headline}
Author: ${author || 'Not detected'}
Section: ${section || 'Not detected'}

Please try accessing the article directly in your browser for the complete content.`,
      author: author || undefined,
      publishDate,
      section: section || undefined,
      imageUrl: imageUrl || undefined,
      tags,
      url,
    };
  }
}

// Singleton instance
export const cnnScraper = new CNNScraper();
