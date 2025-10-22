interface GeminiRequest {
  message: string;
  context?: any;
}

interface GeminiResponse {
  message: string;
  suggestions?: string[];
}

class GeminiAIService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  async sendMessage(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      return await response.json();
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again later.',
        suggestions: ['Try again', 'Job search help', 'Contact support']
      };
    }
  }
}

export const geminiAIService = new GeminiAIService();
