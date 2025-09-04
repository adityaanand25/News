import { GoogleGenerativeAI } from '@google/generative-ai';

interface SummarizationOptions {
  tone?: 'formal' | 'casual' | 'neutral' | 'technical';
  length?: 'short' | 'medium' | 'detailed';
  focus?: 'key-points' | 'analysis' | 'facts' | 'opinion';
}

interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  biasAnalysis: string;
  credibilityScore: number;
}

interface ProgressCallback {
  (stage: string, progress: number, message: string): void;
}

export class GeminiSummarizationService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private progressCallback?: ProgressCallback;

  constructor(apiKey?: string) {
    // Try to initialize with provided key or environment variable
    const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (keyToUse && keyToUse !== 'your_gemini_api_key_here') {
      this.initializeAPI(keyToUse);
    }
  }

  setProgressCallback(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  private emitProgress(stage: string, progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback(stage, progress, message);
    }
  }

  initializeAPI(apiKey: string) {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('Gemini API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new Error('Failed to initialize Gemini API');
    }
  }

  isInitialized(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  async summarizeArticle(
    articleText: string, 
    title: string = '',
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    if (!this.isInitialized()) {
      throw new Error('Gemini API not initialized. Please provide an API key.');
    }

    this.emitProgress('preparing', 10, 'Preparing text for analysis...');

    const { tone = 'neutral', length = 'medium', focus = 'key-points' } = options;

    // Construct the prompt based on options
    const prompt = this.buildPrompt(articleText, title, tone, length, focus);

    try {
      this.emitProgress('analyzing', 30, 'Sending to Gemini AI for analysis...');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.emitProgress('processing', 70, 'Processing AI response...');

      // Parse the structured response
      const parsedResult = this.parseGeminiResponse(text);

      this.emitProgress('complete', 100, 'Summarization complete!');

      return parsedResult;

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(
    articleText: string, 
    title: string, 
    tone: string, 
    length: string, 
    focus: string
  ): string {
    const lengthMap = {
      'short': '2-3 sentences',
      'medium': '4-6 sentences',
      'detailed': '8-10 sentences'
    };

    const focusMap = {
      'key-points': 'main points and takeaways',
      'analysis': 'analytical insights and implications',
      'facts': 'factual information and data',
      'opinion': 'opinions and editorial perspectives'
    };

    return `
Please analyze the following news article and provide a comprehensive analysis in JSON format.

Article Title: ${title}
Article Content: ${articleText}

Instructions:
- Write in a ${tone} tone
- Provide a summary of ${lengthMap[length as keyof typeof lengthMap]}
- Focus on ${focusMap[focus as keyof typeof focusMap]}
- Analyze the article for bias and credibility

Please respond with a valid JSON object containing:
{
  "summary": "A ${length} summary of the article",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "sentiment": "positive/negative/neutral",
  "biasAnalysis": "Analysis of potential bias in the article",
  "credibilityScore": 85
}

Ensure the credibilityScore is a number between 0-100 based on:
- Source reliability
- Factual accuracy
- Balanced reporting
- Use of credible sources and data
`;
  }

  private parseGeminiResponse(responseText: string): SummarizationResult {
    try {
      // Clean the response text (remove markdown formatting if present)
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      // Validate and set defaults if needed
      return {
        summary: parsed.summary || 'Summary not available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : ['Key points not available'],
        sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment) 
          ? parsed.sentiment 
          : 'neutral',
        biasAnalysis: parsed.biasAnalysis || 'Bias analysis not available',
        credibilityScore: typeof parsed.credibilityScore === 'number' 
          ? Math.max(0, Math.min(100, parsed.credibilityScore))
          : 70
      };

    } catch (error) {
      console.warn('Failed to parse Gemini response as JSON, using fallback:', error);
      
      // Fallback parsing if JSON parsing fails
      return {
        summary: responseText.slice(0, 500) + '...',
        keyPoints: this.extractKeyPointsFromText(responseText),
        sentiment: 'neutral',
        biasAnalysis: 'Unable to analyze bias from this response',
        credibilityScore: 70
      };
    }
  }

  private extractKeyPointsFromText(text: string): string[] {
    // Simple extraction of bullet points or numbered items
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const keyPoints: string[] = [];

    for (const line of lines) {
      // Look for bullet points, numbers, or key phrases
      if (line.match(/^[\d\-\*\•]|\b(key|main|important|significant)\b/i)) {
        const cleanPoint = line.replace(/^[\d\-\*\•\s]+/, '').trim();
        if (cleanPoint.length > 10) {
          keyPoints.push(cleanPoint);
        }
      }
      
      if (keyPoints.length >= 5) break;
    }

    return keyPoints.length > 0 ? keyPoints : ['Analysis points could not be extracted'];
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const result = await this.model.generateContent("Hello, please respond with 'Hello World'");
      const response = await result.response;
      const text = response.text();
      return text.toLowerCase().includes('hello');
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const geminiService = new GeminiSummarizationService();
