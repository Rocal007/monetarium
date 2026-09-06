export type NewsCategory = 
  | 'GEOPOLITICS' 
  | 'CENTRAL_BANK' 
  | 'CRYPTO_REGULATION' 
  | 'MACRO_ECONOMY' 
  | 'TECH_EARNINGS';

export type NewsSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'CRISIS';

export interface WorldNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  timestamp: number;
  category: NewsCategory;
  sentiment: NewsSentiment;
  impactScore: number; // 0 - 100 %
  isBreaking: boolean;
}

export interface MacroSentimentState {
  overallSentiment: NewsSentiment;
  sentimentScore: number; // -100 bis +100
  crisisActive: boolean;
  crisisReason?: string;
  lastUpdated: number;
  activeProvider: string;
  articles: WorldNewsItem[];
}
