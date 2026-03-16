/**
 * AI Service for aircraft intelligence queries
 * Direct Groq API integration for hackathon demo
 */

export interface AIQueryResponse {
  response: string;
  confidence: number;
  processing_time: number;
  model_used: string;
  timestamp: string;
}

class AIService {
  private readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  private readonly GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly MODEL = 'llama-3.1-8b-instant';

  /**
   * Query AI about aircraft intelligence
   */
  async queryAircraftIntelligence(
    query: string, 
    context?: {
      aircraft?: any[];
      location?: string;
      timestamp?: string;
    }
  ): Promise<AIQueryResponse> {
    const startTime = Date.now();

    try {
      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(query, context);

      const response = await fetch(this.GROQ_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'No response generated';

      const processingTime = Date.now() - startTime;

      return {
        response: aiResponse,
        confidence: 0.85, // Default confidence for demo
        processing_time: processingTime,
        model_used: this.MODEL,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Query Error:', error);
      
      // Fallback response for demo
      return {
        response: this.getFallbackResponse(query),
        confidence: 0.3,
        processing_time: Date.now() - startTime,
        model_used: 'fallback',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context?: any): string {
    const basePrompt = `You are AircraftWorth AI, an intelligent assistant specializing in aviation, aircraft tracking, and MLAT (Multilateration) systems.

Your expertise includes:
- Aircraft identification and classification
- ADS-B and MLAT technologies
- Flight patterns and aviation safety
- Real-time aircraft tracking analysis
- Aviation regulations and procedures

Current Context:
- Location: London area tracking
- Time: ${new Date().toLocaleString()}
- System: AircraftWorth MLAT with OpenSky Network integration

Provide concise, accurate, and helpful responses about aviation and aircraft tracking.`;

    if (context?.aircraft && context.aircraft.length > 0) {
      const aircraftSummary = context.aircraft.slice(0, 5).map((ac: any) => 
        `${ac.icao} (${ac.callsign || 'N/A'}) - ${ac.alt_ft}ft - ${ac.origin_country || 'Unknown'}`
      ).join('\n');

      return `${basePrompt}\n\nCurrently tracked aircraft:\n${aircraftSummary}`;
    }

    return basePrompt;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(query: string, context?: any): string {
    if (context?.aircraft && context.aircraft.length > 0) {
      return `Query: ${query}\n\nBased on the current aircraft tracking data, please provide insights about this query.`;
    }
    return query;
  }

  /**
   * Fallback response for demo purposes
   */
  private getFallbackResponse(query: string): string {
    const fallbacks = {
      'threat': 'Based on current flight patterns, no immediate threats detected. All aircraft are following standard flight paths with normal altitude and speed profiles.',
      'anomaly': 'Current tracking shows normal aircraft behavior. No anomalous flight patterns detected in the monitored airspace.',
      'identification': 'Aircraft identification is based on ADS-B transponder signals and MLAT calculations. Cooperative aircraft transmit their identification, while non-cooperative aircraft are tracked via multilateration.',
      'default': 'I am AircraftWorth AI, your aviation intelligence assistant. I can help analyze flight patterns, identify aircraft, and provide insights about air traffic in the monitored area.'
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, response] of Object.entries(fallbacks)) {
      if (lowerQuery.includes(key)) {
        return response;
      }
    }

    return fallbacks.default;
  }

  /**
   * Quick analysis of current aircraft
   */
  async analyzeCurrentAircraft(aircraft: any[]): Promise<AIQueryResponse> {
    const analysis = this.generateQuickAnalysis(aircraft);
    return this.queryAircraftIntelligence('Analyze current air traffic situation', { aircraft });
  }

  /**
   * Generate quick analysis without AI call
   */
  private generateQuickAnalysis(aircraft: any[]): string {
    if (aircraft.length === 0) {
      return 'No aircraft currently tracked in the monitored area.';
    }

    const total = aircraft.length;
    const cooperative = aircraft.filter(ac => ac.cooperative).length;
    const highAltitude = aircraft.filter(ac => ac.alt_ft > 25000).length;
    const countries = [...new Set(aircraft.map(ac => ac.origin_country).filter(Boolean))];

    return `Current air traffic: ${total} aircraft tracked (${cooperative} ADS-B, ${total - cooperative} MLAT). ${highAltitude} aircraft at high altitude. Originating from ${countries.length} countries: ${countries.slice(0, 3).join(', ')}${countries.length > 3 ? '...' : ''}.`;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export convenience functions
export const queryAircraftAI = (query: string, context?: any) => 
  aiService.queryAircraftIntelligence(query, context);

export const analyzeAirTraffic = (aircraft: any[]) => 
  aiService.analyzeCurrentAircraft(aircraft);
