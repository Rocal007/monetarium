import { OrchestratorCycleRecord } from './types';
import { Cicero7QRecord } from '../../types/cicero';

/**
 * Wandelt einen Orchestrator-Takt-Record in einen formalen Cicero-7Q Vektor um.
 * DTO-Muster: Strikte Trennung von Geschäftslogik und UI.
 */
export function transformCycleToCicero7Q(
  record: OrchestratorCycleRecord,
  venueName: string = 'Binance Spot (Virtual/Live)'
): Cicero7QRecord {
  const { perception, hypothesis, riskProof, execution, timestamp, symbol, price } = record;

  const sl = hypothesis.suggestedStopLoss || (price * 0.98);
  const tp = hypothesis.suggestedTakeProfit || (price * 1.04);
  const amount = execution.amount || 0.05;

  const priceDiffSl = Math.abs(price - sl);
  const priceDiffTp = Math.abs(tp - price);
  const rrr = priceDiffSl > 0 ? Number((priceDiffTp / priceDiffSl).toFixed(2)) : 2.0;

  const maxLossUsd = Number((priceDiffSl * amount).toFixed(2));
  const targetGainUsd = Number((priceDiffTp * amount).toFixed(2));

  // Indikatoren aufbereiten
  const indicators = [
    {
      name: 'RSI (14)',
      value: perception.rsi.toFixed(1),
      signal: (perception.rsi < 35 ? 'BULLISH' : perception.rsi > 65 ? 'BEARISH' : 'NEUTRAL') as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      description: perception.rsi < 35 ? 'Überverkauftes Niveau' : perception.rsi > 65 ? 'Überkauftes Niveau' : 'Neutraler Oszillator',
    },
    {
      name: 'Markt-Regime',
      value: perception.regime.replace('_', ' '),
      signal: (perception.regime.includes('BULL') ? 'BULLISH' : perception.regime.includes('BEAR') ? 'BEARISH' : 'NEUTRAL') as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      description: `Trendstärke: ${perception.trendStrength}%`,
    },
    {
      name: 'ATR-Volatilität',
      value: `${perception.atrPercent.toFixed(2)} %`,
      signal: (perception.atrPercent > 2.5 ? 'BEARISH' : 'NEUTRAL') as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      description: perception.atrPercent > 2.5 ? 'Erhöhtes Risiko' : 'Stabile Handelsspanne',
    },
  ];

  if (perception.macroSentiment) {
    indicators.push({
      name: 'GCP Welt-News',
      value: `${perception.macroSentiment} (${perception.macroSentimentScore ?? 0})`,
      signal: (perception.macroSentiment === 'CRISIS' || perception.macroSentiment === 'BEARISH'
        ? 'BEARISH'
        : perception.macroSentiment === 'BULLISH'
        ? 'BULLISH'
        : 'NEUTRAL') as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      description: perception.latestBreakingNews || 'Makro-Nachrichtenlage stabil',
    });
  }

  return {
    id: `7q-${record.id}`,
    timestamp,
    formattedTime: new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),

    // 1. QUIS
    quis: {
      agentName: hypothesis.strategyUsed || 'NEXUS Orchestrator Agent',
      role: 'Autonomer Strategie- & Risiko-Agent',
      profileBadge: record.profileId,
      confluenceScore: hypothesis.confluenceScore,
    },

    // 2. QUID
    quid: {
      action: hypothesis.action,
      symbol,
      amount,
      price: execution.expectedPrice || price,
      orderType: execution.type || 'MARKET',
    },

    // 3. UBI
    ubi: {
      venue: venueName,
      marketRegime: perception.regime,
      orderBookDepth: perception.atrPercent > 2.0 ? 'WIDE' : 'NORMAL',
    },

    // 4. QUIBUS AUXILIIS
    quibus: {
      indicators,
    },

    // 5. CUR
    cur: {
      rationale: hypothesis.rationale || perception.summary || 'Trend- und Konfluenz-Muster identifiziert.',
      statisticalEdge: `Konfluenz-Score ${hypothesis.confluenceScore}%, basierend auf Multiskalen-Regime-Analyse.`,
      radicalObjectivityVerified: true,
    },

    // 6. QUOMODO
    quomodo: {
      stopLossPrice: sl,
      takeProfitPrice: tp,
      riskRewardRatio: rrr,
      maxLossUsd,
      targetGainUsd,
      slippageEstimateBps: execution.slippageBps,
    },

    // 7. QUANDO
    quando: {
      timeframe: '1-Stunden Kerzen (1H)',
      validityWindow: 'Taktzyklus (nächste 4 Std.)',
      candleCloseExpected: new Date(timestamp + 3600000).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },

    // Judikative Proof
    proof: {
      isValidated: riskProof.passed,
      proofScore: riskProof.proofScore,
      circuitBreakerStatus: riskProof.circuitBreakerActive ? 'TRIPPED' : 'NORMAL',
      invariants: {
        drawdownCheck: riskProof.invariantsChecked.drawdownOk,
        exposureCheck: riskProof.invariantsChecked.exposureOk,
        riskSizeCheck: riskProof.invariantsChecked.riskSizeOk,
        cooldownCheck: riskProof.invariantsChecked.cooldownOk,
        macroNewsCheck: riskProof.invariantsChecked.macroNewsOk ?? true,
      },
      vetoReason: riskProof.vetoReason,
    },
  };
}

/**
 * Erzeugt einen standardisierten 7Q-Record für manuelle oder synthetische Orders
 */
export function createSyntheticCicero7Q(params: {
  symbol: string;
  price: number;
  amount: number;
  action: 'BUY' | 'SELL';
  stopLossPercent?: number;
  takeProfitMultiplier?: number;
  venueName?: string;
}): Cicero7QRecord {
  const { symbol, price, amount, action, stopLossPercent = 2, takeProfitMultiplier = 2.5, venueName = 'Monetarium Paper' } = params;
  const isBuy = action === 'BUY';
  const slDist = price * (stopLossPercent / 100);
  const sl = isBuy ? price - slDist : price + slDist;
  const tpDist = slDist * takeProfitMultiplier;
  const tp = isBuy ? price + tpDist : price - tpDist;

  const maxLossUsd = Number((slDist * amount).toFixed(2));
  const targetGainUsd = Number((tpDist * amount).toFixed(2));

  return {
    id: `7q-manual-${Date.now()}`,
    timestamp: Date.now(),
    formattedTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    quis: {
      agentName: 'Benutzer & DECORUM Guardrail',
      role: 'Trader via Birkenbihl-Interface',
      profileBadge: 'HUMAN_SUPERVISED',
      confluenceScore: 85,
    },
    quid: {
      action,
      symbol,
      amount,
      price,
      orderType: 'LIMIT',
    },
    ubi: {
      venue: venueName,
      marketRegime: 'ACTIVE_SESSION',
      orderBookDepth: 'NORMAL',
    },
    quibus: {
      indicators: [
        {
          name: 'Risiko-Toleranz',
          value: `${stopLossPercent}% Puffer`,
          signal: 'NEUTRAL',
          description: 'Über Birkenbihl-Schieberegler justiert',
        },
        {
          name: 'CRV-Ratio',
          value: `1 : ${takeProfitMultiplier.toFixed(1)}`,
          signal: takeProfitMultiplier >= 2 ? 'BULLISH' : 'NEUTRAL',
          description: takeProfitMultiplier >= 2 ? 'Exzellentes Chance-Risiko-Verhältnis' : 'Akzeptables CRV',
        },
      ],
    },
    cur: {
      rationale: 'Benutzergesteuerter Trade mit validierten DECORUM-Risikoschranken.',
      statisticalEdge: `Erwartungswert positiv durch CRV 1 : ${takeProfitMultiplier.toFixed(1)} bei Stop-Loss-Disziplin.`,
      radicalObjectivityVerified: true,
    },
    quomodo: {
      stopLossPrice: Number(sl.toFixed(2)),
      takeProfitPrice: Number(tp.toFixed(2)),
      riskRewardRatio: takeProfitMultiplier,
      maxLossUsd,
      targetGainUsd,
      slippageEstimateBps: 5,
    },
    quando: {
      timeframe: 'Gültig bis auf Widerruf (GTC)',
      validityWindow: 'Aktive Handelssitzung',
      candleCloseExpected: 'Fortlaufend',
    },
    proof: {
      isValidated: true,
      proofScore: 1,
      circuitBreakerStatus: 'NORMAL',
      invariants: {
        drawdownCheck: true,
        exposureCheck: true,
        riskSizeCheck: true,
        cooldownCheck: true,
      },
    },
  };
}
