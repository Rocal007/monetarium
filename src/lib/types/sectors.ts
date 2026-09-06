export type SectorType = 
  | 'CRYPTO' 
  | 'DEFENSE' 
  | 'AI_COMPUTE' 
  | 'AUTOMOTIVE' 
  | 'HUMANOID_ROBOTS';

export interface SectorAsset {
  symbol: string;
  name: string;
  basePrice: number;
  engine: 'CCXT_CRYPTO' | 'ALPACA_EQUITY' | 'SIMULATED_PAPER';
}

export interface SectorAgentInfo {
  id: string;
  name: string;
  badge: string;
  sector: SectorType;
  description: string;
  universe: SectorAsset[];
  focusNewsCategory: string;
  sentimentSensitivity: number; // 0.5 bis 2.0x
  colorTheme: 'emerald' | 'rose' | 'indigo' | 'amber' | 'purple';
  profileId: string;
  convictionScore: number; // 0 - 100 %
  status: 'ACTIVE' | 'STANDBY' | 'SCANNING';
}
