// BBC News URL examples for testing
export const BBC_TEST_URLS = [
  'https://www.bbc.com/news/technology-12345678',
  'https://www.bbc.com/news/world-europe-12345678',
  'https://www.bbc.com/news/business-12345678',
  'https://www.bbc.com/sport/football-12345678',
  'https://www.bbc.co.uk/news/uk-politics-12345678',
];

export const validateBBCUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes('bbc.com') || hostname.includes('bbc.co.uk');
  } catch {
    return false;
  }
};

export const getBBCCategory = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    if (pathParts.length >= 2) {
      return pathParts[1]; // Usually news, sport, business, etc.
    }
    
    return 'news';
  } catch {
    return 'news';
  }
};

export const isBBCNewsUrl = (url: string): boolean => {
  if (!validateBBCUrl(url)) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('/news/') || urlObj.pathname.includes('/sport/') || urlObj.pathname.includes('/business/');
  } catch {
    return false;
  }
};
