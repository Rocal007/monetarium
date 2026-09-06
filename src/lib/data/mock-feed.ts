import { Candle } from '../types/trading';

/**
 * Erzeugt hochrealistische, deterministische oder stochastische Kerzen-Daten
 * (Geometric Brownian Motion mit Trend- und Volatilitätsregimen).
 */
export function generateRealisticCandles(params: {
  symbol: string;
  startPrice: number;
  count: number;
  intervalMs?: number; // Standard: 1 Stunde = 3600000 ms
  volatility?: number;
  trend?: number; // Positiver Drift (z.B. +0.0002) oder neutral
  seed?: number;
}): Candle[] {
  const candles: Candle[] = [];
  const interval = params.intervalMs ?? 3600 * 1000;
  const vol = params.volatility ?? 0.015; // 1.5% Volatilität pro Kerze
  const drift = params.trend ?? 0.0005;

  let currentPrice = params.startPrice;
  let timestamp = Date.now() - params.count * interval;

  // Pseudozufall mit einfachem LCG für Reproduzierbarkeit
  let seed = params.seed ?? 42;
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Box-Muller Transformation für Gaußsche Normalverteilung
  const nextGaussian = () => {
    const u1 = Math.max(0.00001, nextRandom());
    const u2 = nextRandom();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  for (let i = 0; i < params.count; i++) {
    // Regime-Wechsel simulieren (Kombination aus Trend und Mean-Reversion)
    const shock = nextGaussian();
    const cycle = Math.sin(i / 15) * 0.005;
    const returnPct = drift + cycle + shock * vol;

    const open = currentPrice;
    const close = Math.max(10, open * (1 + returnPct));

    const wickUp = Math.abs(nextGaussian()) * vol * 0.7 * open;
    const wickDown = Math.abs(nextGaussian()) * vol * 0.7 * open;

    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.floor(100 + Math.abs(nextGaussian()) * 500 + (high - low) * 10);

    candles.push({
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(Math.max(1, low).toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
    timestamp += interval;
  }

  return candles;
}
