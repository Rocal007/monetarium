import { VirtualExchange } from '../../engine/virtual-exchange';
import { IOrderExecutor, OrderExecutionRequest, OrderExecutionResult } from '../../engine/order-router';
import { AlphaHypothesis, ExecutionDecision, ExecutionRoutingProtocol, RiskValidationProof } from '../protocols/types';

export class ExecutionAgent {
  /**
   * Protokoll-gesteuerte Order-Ausführung und Routing
   * Unterstützt sowohl VirtualExchange als auch universelle IOrderExecutor (CCXT, Alpaca).
   */
  public static execute(
    hypothesis: AlphaHypothesis,
    riskProof: RiskValidationProof,
    currentPrice: number,
    protocol: ExecutionRoutingProtocol,
    executor: VirtualExchange | IOrderExecutor
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
      const orderParams: OrderExecutionRequest = {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        price: limitPrice,
        stopPrice: hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : undefined,
        currentMarketPrice: currentPrice,
      };

      const result = executor.submitOrder(orderParams);

      // Falls synchrones Promise (wird im Hintergrund aufgelöst)
      if (result && typeof (result as any).then === 'function') {
        return {
          orderId: `async-${Date.now()}`,
          symbol: hypothesis.symbol,
          side: hypothesis.action,
          type: orderType,
          amount: riskProof.approvedAmount,
          expectedPrice: currentPrice,
          executedPrice: limitPrice ?? currentPrice,
          slippageBps: 0,
          status: 'EXECUTED',
          notes: `Asynchrone Order an Börse übermittelt (${orderType}).`,
        };
      }

      const syncResult = result as OrderExecutionResult;
      const fillPrice = syncResult.trade?.price ?? syncResult.order.filledPrice ?? currentPrice;
      const slippageBps = currentPrice > 0
        ? Math.round((Math.abs(fillPrice - currentPrice) / currentPrice) * 10000)
        : 0;

      return {
        orderId: syncResult.order.id,
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        executedPrice: fillPrice,
        slippageBps,
        status: 'EXECUTED',
        notes: `Erfolgreich geroutet (${orderType}). Slippage: ${slippageBps} bps. Trade-ID: ${syncResult.trade?.id ?? 'PENDING'}`,
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

  /**
   * Vollständig asynchrone Variante für Headless-Daemon oder serverseitige Order-Verarbeitung
   */
  public static async executeAsync(
    hypothesis: AlphaHypothesis,
    riskProof: RiskValidationProof,
    currentPrice: number,
    protocol: ExecutionRoutingProtocol,
    executor: VirtualExchange | IOrderExecutor
  ): Promise<ExecutionDecision> {
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

    const orderType = protocol.defaultOrderType;
    let limitPrice: number | undefined;

    if (orderType === 'LIMIT') {
      const offsetFactor = protocol.limitOffsetBps / 10000;
      limitPrice = hypothesis.action === 'BUY'
        ? Number((currentPrice * (1 - offsetFactor)).toFixed(2))
        : Number((currentPrice * (1 + offsetFactor)).toFixed(2));
    }

    try {
      const orderParams: OrderExecutionRequest = {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        price: limitPrice,
        stopPrice: hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : undefined,
        currentMarketPrice: currentPrice,
      };

      const result = await executor.submitOrder(orderParams);
      const fillPrice = result.trade?.price ?? result.order.filledPrice ?? currentPrice;
      const slippageBps = currentPrice > 0
        ? Math.round((Math.abs(fillPrice - currentPrice) / currentPrice) * 10000)
        : 0;

      const executorName = 'name' in executor ? (executor as IOrderExecutor).name : 'VirtualExchange';

      return {
        orderId: result.order.id,
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        executedPrice: fillPrice,
        slippageBps,
        status: 'EXECUTED',
        notes: `Erfolgreich geroutet an ${executorName} (${orderType}). Trade-ID: ${result.trade?.id ?? 'PENDING'}`,
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
