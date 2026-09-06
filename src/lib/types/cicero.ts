import { OrderSide, OrderType } from './trading';

/**
 * 7Q-Vektor nach Cicero für mathematisch transparente Handelsentscheidungen
 */
export interface Cicero7QRecord {
  id: string;
  timestamp: number;
  formattedTime: string;

  // 1. QUIS (Wer handelt?)
  quis: {
    agentName: string;
    role: string;
    profileBadge: string;
    confluenceScore: number; // 0 - 100 %
  };

  // 2. QUID (Was wird gehandelt?)
  quid: {
    action: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    amount: number;
    price: number;
    orderType: OrderType;
  };

  // 3. UBI (Wo wird gehandelt?)
  ubi: {
    venue: string;
    marketRegime: string;
    orderBookDepth: 'TIGHT' | 'NORMAL' | 'WIDE';
  };

  // 4. QUIBUS AUXILIIS (Womit / Welche Werkzeuge & Indikatoren?)
  quibus: {
    indicators: Array<{
      name: string;
      value: string | number;
      signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      description: string;
    }>;
  };

  // 5. CUR (Warum / Sachlicher Grund)
  cur: {
    rationale: string;
    statisticalEdge: string;
    radicalObjectivityVerified: boolean;
  };

  // 6. QUOMODO (Wie / Schutzmechanik & Risiko)
  quomodo: {
    stopLossPrice: number;
    takeProfitPrice: number;
    riskRewardRatio: number; // e.g. 2.5
    maxLossUsd: number;
    targetGainUsd: number;
    slippageEstimateBps: number;
  };

  // 7. QUANDO (Wann / Zeitfenster & Gültigkeit)
  quando: {
    timeframe: string;
    validityWindow: string;
    candleCloseExpected: string;
  };

  // Judikative Proof & DECORUM Konformität (P_J)
  proof: {
    isValidated: boolean;
    proofScore: number; // 1 = Proof OK, 0 = Rejected
    circuitBreakerStatus: 'NORMAL' | 'WARNING' | 'TRIPPED';
    invariants: {
      drawdownCheck: boolean;
      exposureCheck: boolean;
      riskSizeCheck: boolean;
      cooldownCheck: boolean;
      macroNewsCheck?: boolean;
    };
    vetoReason?: string;
  };
}
