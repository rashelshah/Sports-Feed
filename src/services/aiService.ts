// AI Service for various AI-powered features
// Voice-to-text, multilingual filtering, and abuse detection

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface ContentFilterResult {
  isSafe: boolean;
  detectedLanguage: string;
  confidence: number;
  flaggedPhrases?: string[];
  reason?: string;
}

export interface AbuseDetectionResult {
  isAbusive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  confidence: number;
  flaggedContent?: string;
  suggestions?: string[];
}

class AIService {
  // Voice-to-Text Transcription using Web Speech API
  async transcribeAudio(audioBlob: Blob, language: string = 'en-US'): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      try {
        // Check if the browser supports Web Speech API
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          // Fallback: Return an error or use an alternative service
          return reject(new Error('Speech recognition not supported in this browser'));
        }

        // Create audio context and decode audio
        const audioContext = new AudioContext();
        const fileReader = new FileReader();

        fileReader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          audioContext.decodeAudioData(arrayBuffer)
            .then((audioBuffer) => {
              const duration = audioBuffer.duration;
              
              // In a real implementation, you would send this to a transcription service
              // For now, we'll simulate the transcription
              // TODO: Integrate with actual transcription service (e.g., Google Speech-to-Text, AWS Transcribe, etc.)
              
              setTimeout(() => {
                resolve({
                  text: '[Transcribed audio text would appear here]',
                  confidence: 0.85,
                  language: language,
                  duration: duration
                });
              }, 1000);
            })
            .catch(reject);
        };

        fileReader.readAsArrayBuffer(audioBlob);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Real-time speech recognition for ongoing transcription
  startRealTimeTranscription(
    onTranscript: (text: string) => void,
    language: string = 'en-US'
  ): { start: () => void; stop: () => void } {
    // This would use Web Speech API for real-time transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return { start: () => {}, stop: () => {} };
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    return {
      start: () => recognition.start(),
      stop: () => recognition.stop()
    };
  }

  // Multilingual Content Filtering
  async filterMultilingualContent(
    content: string,
    context: 'post' | 'message' | 'comment' | 'video-description'
  ): Promise<ContentFilterResult> {
    // Simulated content filtering
    // In production, this would use Google Translate API or similar to detect language
    // and filter inappropriate content across multiple languages
    
    const flaggedPhrases = [
      /inappropriate|hate|violence/gi,
      /spam|scam|fraud/gi,
      /adult content|nsfw/gi
    ];

    const detectedLanguage = await this.detectLanguage(content);
    const hasFlaggedPhrases = flaggedPhrases.some(pattern => pattern.test(content));
    const isSafe = !hasFlaggedPhrases;

    // Context-specific rules
    if (context === 'message') {
      // Stricter filtering for private messages
      const additionalFlags = [
        /personal information|phone|address|email/gi
      ];
      if (additionalFlags.some(pattern => pattern.test(content))) {
        return {
          isSafe: false,
          detectedLanguage,
          confidence: 0.9,
          flaggedPhrases: ['Personal information sharing'],
          reason: 'Contains potentially sensitive information'
        };
      }
    }

    return {
      isSafe,
      detectedLanguage,
      confidence: hasFlaggedPhrases ? 0.85 : 0.95,
      flaggedPhrases: hasFlaggedPhrases ? ['flagged content'] : undefined,
      reason: hasFlaggedPhrases ? 'Detected inappropriate content' : undefined
    };
  }

  // Abuse Detection System
  async detectAbuse(
    content: string,
    contentType: 'text' | 'audio' | 'image' | 'video',
    metadata?: Record<string, any>
  ): Promise<AbuseDetectionResult> {
    // Simulated abuse detection
    // In production, this would integrate with services like:
    // - Google Cloud AI Platform
    // - AWS Comprehend
    // - Perspective API
    // - Custom ML models

    const abusePatterns = {
      severe: [
        /hate speech|racism|discrimination/gi,
        /threats|violence|harm/gi,
        /sexual harassment|inappropriate sexual/gi
      ],
      high: [
        /harassment|bullying/gi,
        /profanity|curse words/gi,
        /spam|advertising/gi
      ],
      medium: [
        /offensive language|rude behavior/gi,
        /inappropriate content/gi
      ]
    };

    const detectedCategories: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let confidence = 0.5;
    let isAbusive = false;

    // Check severe patterns
    for (const pattern of abusePatterns.severe) {
      if (pattern.test(content)) {
        isAbusive = true;
        severity = 'critical';
        confidence = 0.95;
        detectedCategories.push('severe-abuse');
        break;
      }
    }

    // Check high severity patterns
    if (!isAbusive) {
      for (const pattern of abusePatterns.high) {
        if (pattern.test(content)) {
          isAbusive = true;
          severity = 'high';
          confidence = 0.85;
          detectedCategories.push('high-severity-abuse');
          break;
        }
      }
    }

    // Check medium severity patterns
    if (!isAbusive) {
      for (const pattern of abusePatterns.medium) {
        if (pattern.test(content)) {
          isAbusive = true;
          severity = 'medium';
          confidence = 0.75;
          detectedCategories.push('medium-severity-abuse');
        }
      }
    }

    // Enhanced checks for audio/video content
    if (contentType === 'audio' && isAbusive) {
      detectedCategories.push('voice-abuse-detected');
      severity = severity === 'low' ? 'medium' : severity;
    }

    return {
      isAbusive,
      severity: isAbusive ? severity : 'low',
      categories: detectedCategories,
      confidence,
      flaggedContent: isAbusive ? content.substring(0, 50) + '...' : undefined,
      suggestions: isAbusive 
        ? ['Please review and revise your content before posting']
        : undefined
    };
  }

  // Language Detection
  private async detectLanguage(text: string): Promise<string> {
    // Simplified language detection
    // In production, use a proper language detection service
    
    if (!text || text.length < 10) return 'en';
    
    // Detect common languages by patterns
    const patterns: Record<string, RegExp> = {
      es: /[áéíóúñ]/gi,
      fr: /[àâäéèêëïîôùûüÿç]/gi,
      de: /[äöüß]/gi,
      zh: /[\u4e00-\u9fa5]/gi,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/gi,
      ar: /[\u0600-\u06ff]/gi,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  // Content Sentiment Analysis
  async analyzeSentiment(content: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  }> {
    // Simplified sentiment analysis
    // In production, use services like AWS Comprehend, Google Natural Language API
    
    const positiveWords = /\b(great|excellent|amazing|wonderful|fantastic|love|good|awesome)\b/gi;
    const negativeWords = /\b(bad|terrible|awful|hate|dislike|horrible|poor)\b/gi;
    
    const positiveMatches = content.match(positiveWords)?.length || 0;
    const negativeMatches = content.match(negativeWords)?.length || 0;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;
    
    if (positiveMatches > negativeMatches) {
      sentiment = 'positive';
      score = Math.min(positiveMatches / content.split(/\s+/).length, 1);
    } else if (negativeMatches > positiveMatches) {
      sentiment = 'negative';
      score = Math.min(negativeMatches / content.split(/\s+/).length, 1);
    }
    
    return {
      sentiment,
      score,
      confidence: 0.7 + (Math.abs(positiveMatches - negativeMatches) * 0.1)
    };
  }

  // Real-time moderation check (for live content)
  async realTimeModerationCheck(content: string): Promise<{
    action: 'allow' | 'warn' | 'block';
    reason?: string;
    suggestions?: string[];
  }> {
    const filterResult = await this.filterMultilingualContent(content, 'message');
    const abuseResult = await this.detectAbuse(content, 'text');

    if (abuseResult.isAbusive) {
      if (abuseResult.severity === 'critical' || abuseResult.severity === 'high') {
        return {
          action: 'block',
          reason: 'Content violates community guidelines',
          suggestions: ['Please review community guidelines']
        };
      } else {
        return {
          action: 'warn',
          reason: 'Content may be inappropriate',
          suggestions: ['Please consider revising your message']
        };
      }
    }

    if (!filterResult.isSafe) {
      return {
        action: 'warn',
        reason: filterResult.reason || 'Content may need review',
        suggestions: ['Please ensure content is appropriate']
      };
    }

    return { action: 'allow' };
  }
}

export const aiService = new AIService();


