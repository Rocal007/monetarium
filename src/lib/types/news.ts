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
  isBlackoutActive?: boolean;
  blackoutReason?: string;
  lastUpdated: number;
  activeProvider: string;
  articles: WorldNewsItem[];
}

export type ForexFactoryImpact = 'High' | 'Medium' | 'Low' | 'Holiday';

export interface ForexFactoryEvent {
  title: string;
  country: string;
  date: string; // ISO 8601, z.B. "2026-09-21T12:00:00-04:00"
  impact: ForexFactoryImpact;
  forecast: string;
  previous: string;
  actual?: string;
}

export interface ForexFactoryCalendarResponse {
  events: ForexFactoryEvent[];
  highImpactCount: number;
  mediumImpactCount: number;
  lowImpactCount: number;
  nextHighImpactEvent: ForexFactoryEvent | null;
  timeToNextHighImpactMs: number | null;
  isBlackoutActive: boolean;
  blackoutReason?: string;
  lastUpdated: number;
  cached: boolean;
}
