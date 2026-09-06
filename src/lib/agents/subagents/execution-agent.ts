import { VirtualExchange } from '../../engine/virtual-exchange';
import { AlphaHypothesis, ExecutionDecision, ExecutionRoutingProtocol, RiskValidationProof } from '../protocols/types';

export class ExecutionAgent {
  /**
   * Protokoll-gesteuerte Order-Ausführung und Routing
   */
  public static execute(
    hypothesis: AlphaHypothesis,
    riskProof: RiskValidationProof,
    currentPrice: number,
    protocol: ExecutionRoutingProtocol,
    virtualExchange: VirtualExchange
  ): ExecutionDecision {
    // 1. Wenn kein Signal oder abgelehnt
    if (hypothesis.action === 'HOLD') {
      return {
        symbol: hypothesis.symbol,
        side: 'BUY',
        type: protocol.defaultOrderType,
        amount: 0,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'SKIPPED',
        notes: 'Alpha-Signal HOLD: Kein Routing erforderlich.',
      };
    }

    if (!riskProof.passed || riskProof.approvedAmount <= 0) {
      return {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: protocol.defaultOrderType,
        amount: 0,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'REJECTED',
        notes: riskProof.vetoReason ?? 'Ausführung durch Judikative blockiert.',
      };
    }

    // 2. Order-Parameter konfigurieren
    const orderType = protocol.defaultOrderType;
    let limitPrice: number | undefined;

    if (orderType === 'LIMIT') {
      const offsetFactor = protocol.limitOffsetBps / 10000;
      limitPrice = hypothesis.action === 'BUY'
        ? Number((currentPrice * (1 - offsetFactor)).toFixed(2))
        : Number((currentPrice * (1 + offsetFactor)).toFixed(2));
    }

    try {
      const { order, trade } = virtualExchange.submitOrder({
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        price: limitPrice,
        stopPrice: hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : undefined,
        currentMarketPrice: currentPrice,
      });

      const fillPrice = trade?.price ?? order.filledPrice ?? currentPrice;
      const slippageBps = currentPrice > 0
        ? Math.round((Math.abs(fillPrice - currentPrice) / currentPrice) * 10000)
        : 0;

      return {
        orderId: order.id,
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        executedPrice: fillPrice,
        slippageBps,
        status: 'EXECUTED',
        notes: `Erfolgreich geroutet (${orderType}). Slippage: ${slippageBps} bps. Trade-ID: ${trade?.id ?? 'PENDING'}`,
      };
    } catch (err: any) {
      return {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'REJECTED',
        notes: `Ausführungsfehler Exchange: ${err?.message ?? 'Unbekannter Fehler'}`,
      };
    }
  }
}
