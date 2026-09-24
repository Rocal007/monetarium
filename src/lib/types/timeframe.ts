export type MacroPeriodId = '1W' | '1M' | '1Q' | '1Y' | '5Y' | '10Y';

export type TimeframeId = '1m' | '15m' | '1h' | '4h' | '1d' | '1W' | '1M' | '1Q' | '1Y' | '5Y' | '10Y';

export interface HorizonPerformance {
  id: MacroPeriodId;
  label: string; // z.B. 'Woche', 'Monat', 'Quartal', 'Jahr', '5 Jahre', '10 Jahre'
  shortLabel: string; // '1W', '1M', '1Q', '1Y', '5Y', '10Y'
  durationLabel: string; // '7 Tage', '30 Tage', '90 Tage', '365 Tage', '5 Jahre', '10 Jahre'
  returnPct: number;
  startPrice: number;
  endPrice: number;
  high: number;
  low: number;
  volatilityPct: number;
  maxDrawdownPct: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  annualizedReturnPct: number;
  sparkline: number[];
}
