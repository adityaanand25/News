# Gemini AI Integration for NewsLens

## Overview
This project now supports Google's Gemini AI for enhanced news analysis, providing more accurate and intelligent summarization, bias detection, and content analysis.

## Setup Instructions

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated API key

### 2. Configure the API Key
You can set up your Gemini API key in two ways:

#### Option A: Through the UI (Recommended)
1. Start the application (`npm run dev`)
2. Look for the purple brain icon (🧠✨) in the bottom-right corner
3. Click it to open the Gemini Settings panel
4. Paste your API key
5. Click "Save Key" and then "Test" to verify the connection

#### Option B: Environment Variable
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and replace `your_gemini_api_key_here` with your actual API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   VITE_ENABLE_GEMINI_BY_DEFAULT=true
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```

### 3. Enhanced Features
Once Gemini is configured, you'll get:

- **AI-Powered Summarization**: More accurate and context-aware summaries
- **Advanced Bias Analysis**: Sophisticated bias detection with detailed explanations
- **Intelligent Key Points**: AI-extracted key points from articles
- **Enhanced Credibility Scoring**: More nuanced credibility assessment
- **Context-Aware Analysis**: Better understanding of article context and implications

### 4. Usage
The Gemini integration works automatically once configured:

1. **Analyze any article**: The system will use Gemini for enhanced analysis
2. **Real-time processing**: Progress indicators show AI analysis stages
3. **Fallback support**: If Gemini fails, the system falls back to standard analysis
4. **Tone-aware summaries**: AI adapts to your selected tone (neutral, facts, simple)

### 5. Privacy & Security
- API keys are stored locally in your browser's localStorage
- No API keys are sent to external servers (except Google's Gemini API)
- You can clear your API key anytime through the settings panel

### 6. Troubleshooting

#### Connection Issues
- Verify your API key is correct
- Check your internet connection
- Ensure the API key has proper permissions

#### Analysis Failures
- The system automatically falls back to standard analysis
- Check browser console for detailed error messages
- Verify API quota hasn't been exceeded

### 7. API Limits
- Free tier: Limited requests per day
- Check [Google AI Studio](https://makersuite.google.com) for current limits
- Consider upgrading for higher usage

## Technical Details

### Integration Points
- `src/services/geminiService.ts`: Core Gemini API service
- `src/components/GeminiSettings.tsx`: UI for configuration
- `src/hooks/useAnalysis.ts`: Integration with analysis pipeline

### API Features Used
- `gemini-pro` model for text analysis
- Structured JSON responses for consistent parsing
- Progress tracking for real-time feedback
- Error handling with fallback mechanisms

## Benefits
- **Accuracy**: More accurate bias detection and summarization
- **Intelligence**: Context-aware analysis and key point extraction
- **User Experience**: Real-time progress with smooth transitions
- **Reliability**: Fallback to standard analysis ensures continuous service
