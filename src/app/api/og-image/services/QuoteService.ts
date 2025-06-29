import { FALLBACK_QUOTES, QUOTE_APIS } from '../config';
import { QuoteData } from '../types';

export class QuoteService {
  private weightedPool: number[] = [];
  private currentPoolIndex = 0;

  constructor() {
    this.initializeWeightedPool();
  }

  /**
   * Initialize weighted pool based on API weights
   */
  private initializeWeightedPool(): void {
    this.weightedPool = [];
    QUOTE_APIS.forEach((api, index) => {
      // Add the API index to the pool based on its weight
      for (let i = 0; i < api.weight; i++) {
        this.weightedPool.push(index);
      }
    });
    // Shuffle the pool for better distribution
    for (let i = this.weightedPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.weightedPool[i], this.weightedPool[j]] = [this.weightedPool[j], this.weightedPool[i]];
    }
  }

  /**
   * Get next API using weighted round-robin
   */
  private getNextAPIIndex(): number {
    if (this.weightedPool.length === 0) {
      this.initializeWeightedPool();
    }

    const apiIndex = this.weightedPool[this.currentPoolIndex];
    this.currentPoolIndex = (this.currentPoolIndex + 1) % this.weightedPool.length;

    // Reinitialize pool when we've gone through all entries
    if (this.currentPoolIndex === 0) {
      this.initializeWeightedPool();
    }

    return apiIndex;
  }

  /**
   * Fetch quote using round-robin with fallback
   */
  async fetchRandomQuote(): Promise<QuoteData> {
    const maxRetries = QUOTE_APIS.length; // Try all APIs if needed

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiIndex = this.getNextAPIIndex();
      const apiConfig = QUOTE_APIS[apiIndex];

      try {
        const response = await fetch(apiConfig.url, {
          cache: 'no-cache',
          headers: {
            'User-Agent': 'Idling.app OG Image Generator',
            ...(apiConfig.headers || {})
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const quote = apiConfig.transform(data);

        return quote;
             } catch (error) {
         // eslint-disable-next-line no-console
         console.warn(`⚠️ Failed to fetch from ${apiConfig.name}:`, error);
         // Continue to next API
       }
     }

     // If all APIs fail, return fallback quotes
     // eslint-disable-next-line no-console
     console.log('❌ All quote APIs failed, using fallback quotes');
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }

  /**
   * Get a quote either from custom input or fetch from APIs
   */
  async getQuote(customQuote?: string | null, customAuthor?: string | null): Promise<QuoteData> {
    if (customQuote) {
      return {
        text: customQuote,
        author: customAuthor || 'Idling.app'
      };
    }

    return this.fetchRandomQuote();
  }
} 