// CNN URL examples for testing
export const CNN_TEST_URLS = [
  'https://www.cnn.com/2024/01/15/politics/election-analysis/index.html',
  'https://www.cnn.com/2024/01/15/business/market-trends/index.html',
  'https://www.cnn.com/2024/01/15/world/international-news/index.html',
  'https://www.cnn.com/2024/01/15/tech/artificial-intelligence/index.html',
  'https://www.cnn.com/2024/01/15/health/medical-breakthrough/index.html',
];

export const validateCNNUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname === 'www.cnn.com' || 
           hostname === 'cnn.com' ||
           hostname === 'edition.cnn.com' ||
           hostname.endsWith('.cnn.com');
  } catch {
    return false;
  }
};

export const getCNNSection = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    
    if (pathSegments.length > 0) {
      const section = pathSegments[0];
      
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
      
      return sectionMap[section] || section.charAt(0).toUpperCase() + section.slice(1);
    }
    
    return 'General';
  } catch {
    return 'General';
  }
};

export const isCNNBreakingNews = (url: string): boolean => {
  return url.toLowerCase().includes('breaking') || 
         url.toLowerCase().includes('live-news') ||
         url.toLowerCase().includes('developing');
};

export const getCNNArticleType = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/video/')) {
    return 'Video';
  } else if (urlLower.includes('/live-news/')) {
    return 'Live Updates';
  } else if (urlLower.includes('/opinions/')) {
    return 'Opinion';
  } else if (urlLower.includes('/analysis/')) {
    return 'Analysis';
  } else if (isCNNBreakingNews(url)) {
    return 'Breaking News';
  }
  
  return 'Article';
};

export const formatCNNUrl = (url: string): string => {
  // Ensure we're using the main CNN domain for consistency
  if (url.includes('edition.cnn.com')) {
    return url.replace('edition.cnn.com', 'www.cnn.com');
  }
  
  if (url.includes('cnn.com') && !url.includes('www.')) {
    return url.replace('cnn.com', 'www.cnn.com');
  }
  
  return url;
};

export const getCNNRegion = (url: string): string => {
  if (url.includes('edition.cnn.com')) {
    return 'International';
  } else if (url.includes('www.cnn.com')) {
    return 'US';
  }
  
  return 'US';
};
