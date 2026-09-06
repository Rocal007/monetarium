/**
 * Realistisches Gebührenmodell für Krypto- und Aktienmärkte.
 */
export interface FeeModel {
  makerFeeRate: number; // z.B. 0.0005 (0.05% für Limit-Orders, die Liquidität bereitstellen)
  takerFeeRate: number; // z.B. 0.001 (0.10% für Market-Orders, die Liquidität entziehen)
}

export const DEFAULT_CRYPTO_FEES: FeeModel = {
  makerFeeRate: 0.0005, // 0.05%
  takerFeeRate: 0.001,  // 0.10%
};

export const DEFAULT_EQUITY_FEES: FeeModel = {
  makerFeeRate: 0.0002, // 0.02%
  takerFeeRate: 0.0005, // 0.05%
};

export function calculateTradeFee(
  amount: number,
  price: number,
  isTaker: boolean = true,
  feeModel: FeeModel = DEFAULT_CRYPTO_FEES
): number {
  const notionalValue = amount * price;
  const rate = isTaker ? feeModel.takerFeeRate : feeModel.makerFeeRate;
  return Number((notionalValue * rate).toFixed(4));
}
