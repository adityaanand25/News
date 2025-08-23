// New York Times URL examples for testing
export const NYT_TEST_URLS = [
  'https://www.nytimes.com/2024/01/15/technology/artificial-intelligence-breakthrough.html',
  'https://www.nytimes.com/2024/01/15/world/climate-change-summit.html',
  'https://www.nytimes.com/2024/01/15/business/market-analysis.html',
  'https://www.nytimes.com/2024/01/15/politics/election-coverage.html',
  'https://www.nytimes.com/2024/01/15/health/medical-research.html',
];

export const validateNYTUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname === 'www.nytimes.com' || 
           hostname === 'nytimes.com' ||
           hostname.endsWith('.nytimes.com');
  } catch {
    return false;
  }
};

export const getNYTSection = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    
    if (pathSegments.length > 0) {
      const section = pathSegments[0];
      
      // Map common NYT sections to display names
      const sectionMap: { [key: string]: string } = {
        'world': 'World News',
        'us': 'U.S. News',
        'politics': 'Politics',
        'business': 'Business',
        'technology': 'Technology',
        'science': 'Science',
        'health': 'Health',
        'sports': 'Sports',
        'arts': 'Arts',
        'style': 'Style',
        'food': 'Food',
        'travel': 'Travel',
        'magazine': 'Magazine',
        'opinion': 'Opinion',
        'realestate': 'Real Estate',
        'automobiles': 'Automobiles',
        'jobs': 'Jobs'
      };
      
      return sectionMap[section.toLowerCase()] || section.charAt(0).toUpperCase() + section.slice(1);
    }
    
    return 'News';
  } catch {
    return 'News';
  }
};

export const isNYTPaywallContent = (content: string): boolean => {
  const paywallIndicators = [
    'subscribe to continue reading',
    'this article is for subscribers only',
    'create a free account',
    'sign up for free',
    'continue reading the main story',
    'subscriber benefit'
  ];
  
  const lowerContent = content.toLowerCase();
  return paywallIndicators.some(indicator => lowerContent.includes(indicator));
};

export const extractNYTArticleId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    
    // NYT URLs often end with the article slug
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment.replace('.html', '');
    }
    
    return null;
  } catch {
    return null;
  }
};
