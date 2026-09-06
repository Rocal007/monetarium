import { OrderSide } from '../types/trading';

export interface SlippageConfig {
  baseSpreadPercent: number; // Normaler Spread z. B. 0.02% = 0.0002
  volatilityImpactFactor: number; // Multiplikator bei starker Kerzen-Range
  sizeImpactFactor: number; // Zusätzlicher Schlupf bei großen Positionen
}

export const DEFAULT_SLIPPAGE_CONFIG: SlippageConfig = {
  baseSpreadPercent: 0.0003, // 0.03%
  volatilityImpactFactor: 0.05,
  sizeImpactFactor: 0.00001,
};

/**
 * Simuliert realistische Slippage für Market Orders.
 * Beim Kauf rutscht der Fill-Preis nach oben, beim Verkauf nach unten.
 */
export function calculateSlippage(
  basePrice: number,
  side: OrderSide,
  orderAmount: number,
  highLowRangePercent: number = 0.01,
  config: SlippageConfig = DEFAULT_SLIPPAGE_CONFIG
): {
  executionPrice: number;
  slippageAmount: number;
  slippagePercent: number;
} {
  // Grund-Slippage basierend auf Spread und Volatilität
  const volPenalty = highLowRangePercent * config.volatilityImpactFactor;
  const sizePenalty = orderAmount * config.sizeImpactFactor;
  const totalSlippageRate = config.baseSpreadPercent + volPenalty + sizePenalty;

  const slippageAmount = basePrice * totalSlippageRate;
  const executionPrice =
    side === 'BUY'
      ? basePrice + slippageAmount
      : basePrice - slippageAmount;

  return {
    executionPrice: Number(executionPrice.toFixed(2)),
    slippageAmount: Number(slippageAmount.toFixed(2)),
    slippagePercent: Number((totalSlippageRate * 100).toFixed(3)),
  };
}
