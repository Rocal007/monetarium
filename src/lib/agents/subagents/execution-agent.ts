import { VirtualExchange } from '../../engine/virtual-exchange';
import { IOrderExecutor, OrderExecutionRequest, OrderExecutionResult } from '../../engine/order-router';
import { AlphaHypothesis, ExecutionDecision, ExecutionRoutingProtocol, RiskValidationProof } from '../protocols/types';
import { CopilotProposal, OperatingMode } from '../../types/trading';

export class ExecutionAgent {
  /**
   * Protokoll-gesteuerte Order-Ausführung und Routing
   * Unterstützt sowohl VirtualExchange als auch universelle IOrderExecutor (CCXT, Alpaca).
   * - PILOT: Führt Orders direkt und autonom an der Börse / VirtualExchange aus.
   * - COPILOT: Erzeugt einen Trade-Vorschlag (Proposal) mit Status PENDING_APPROVAL. Der Nutzer entscheidet mit!
   */
  public static execute(
    hypothesis: AlphaHypothesis,
    riskProof: RiskValidationProof,
    currentPrice: number,
    protocol: ExecutionRoutingProtocol,
    executor: VirtualExchange | IOrderExecutor,
    operatingMode: OperatingMode = 'PILOT'
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

    // 3. COPILOT-MODUS: Nicht sofort ausführen, sondern Nutzer mitentscheiden lassen!
    if (operatingMode === 'COPILOT') {
      const proposal: CopilotProposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        suggestedStopLoss: hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : undefined,
        suggestedTakeProfit: hypothesis.suggestedTakeProfit > 0 ? hypothesis.suggestedTakeProfit : undefined,
        confluenceScore: hypothesis.confluenceScore,
        strategyUsed: hypothesis.strategyUsed,
        rationale: hypothesis.rationale,
        source: 'ORCHESTRATOR',
        riskEur: riskProof.riskPerTradeEuro,
        status: 'PENDING',
      };

      return {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'PENDING_APPROVAL',
        notes: `Copilot-Modus aktiv: Trade-Vorschlag (${hypothesis.action} ${riskProof.approvedAmount} ${hypothesis.symbol}) wartet auf deine Freigabe.`,
        proposal,
      };
    }

    // 4. PILOT-MODUS: Autonome Ausführung ohne Rückfrage
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
        (result as Promise<any>).catch((asyncErr) => {
          console.error('[ExecutionAgent] Asynchroner Order-Ausführungsfehler:', asyncErr?.message || asyncErr);
        });

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
          notes: `Pilot-Modus: Asynchrone Order autonom an Börse übermittelt (${orderType}).`,
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
        notes: `Pilot-Modus: Autonom ausgeführt (${orderType}). Slippage: ${slippageBps} bps. Trade-ID: ${syncResult.trade?.id ?? 'PENDING'}`,
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
   * Führt einen vom Nutzer freigegebenen Copilot-Vorschlag direkt aus
   */
  public static executeApprovedProposal(
    proposal: CopilotProposal,
    currentPrice: number,
    executor: VirtualExchange | IOrderExecutor
  ): ExecutionDecision {
    try {
      const orderParams: OrderExecutionRequest = {
        symbol: proposal.symbol,
        side: proposal.side,
        type: proposal.type,
        amount: proposal.amount,
        price: proposal.type === 'LIMIT' ? proposal.expectedPrice : undefined,
        stopPrice: proposal.suggestedStopLoss,
        currentMarketPrice: currentPrice,
      };

      const result = executor.submitOrder(orderParams);
      if (result && typeof (result as any).then === 'function') {
        (result as Promise<any>).catch((asyncErr) => {
          console.error('[ExecutionAgent] Freigabe-Order async Fehler:', asyncErr);
        });
        return {
          orderId: `async-${Date.now()}`,
          symbol: proposal.symbol,
          side: proposal.side,
          type: proposal.type,
          amount: proposal.amount,
          expectedPrice: currentPrice,
          executedPrice: currentPrice,
          slippageBps: 0,
          status: 'EXECUTED',
          notes: `Copilot-Freigabe bestätigt: Order übermittelt.`,
        };
      }

      const syncResult = result as OrderExecutionResult;
      const fillPrice = syncResult.trade?.price ?? syncResult.order.filledPrice ?? currentPrice;
      const slippageBps = currentPrice > 0
        ? Math.round((Math.abs(fillPrice - currentPrice) / currentPrice) * 10000)
        : 0;

      return {
        orderId: syncResult.order.id,
        symbol: proposal.symbol,
        side: proposal.side,
        type: proposal.type,
        amount: proposal.amount,
        expectedPrice: currentPrice,
        executedPrice: fillPrice,
        slippageBps,
        status: 'EXECUTED',
        notes: `Copilot-Freigabe ausgeführt: ${proposal.side} ${proposal.amount} ${proposal.symbol} @ ${fillPrice} €. Slippage: ${slippageBps} bps.`,
      };
    } catch (err: any) {
      return {
        symbol: proposal.symbol,
        side: proposal.side,
        type: proposal.type,
        amount: proposal.amount,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'REJECTED',
        notes: `Fehler bei Copilot-Freigabe: ${err?.message ?? 'Unbekannter Fehler'}`,
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
    executor: VirtualExchange | IOrderExecutor,
    operatingMode: OperatingMode = 'PILOT'
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

    if (operatingMode === 'COPILOT') {
      const proposal: CopilotProposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        suggestedStopLoss: hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : undefined,
        suggestedTakeProfit: hypothesis.suggestedTakeProfit > 0 ? hypothesis.suggestedTakeProfit : undefined,
        confluenceScore: hypothesis.confluenceScore,
        strategyUsed: hypothesis.strategyUsed,
        rationale: hypothesis.rationale,
        source: 'ORCHESTRATOR',
        riskEur: riskProof.riskPerTradeEuro,
        status: 'PENDING',
      };

      return {
        symbol: hypothesis.symbol,
        side: hypothesis.action,
        type: orderType,
        amount: riskProof.approvedAmount,
        expectedPrice: currentPrice,
        slippageBps: 0,
        status: 'PENDING_APPROVAL',
        notes: `Copilot-Modus aktiv: Signal (${hypothesis.action} ${riskProof.approvedAmount} ${hypothesis.symbol}) wartet auf deine Freigabe.`,
        proposal,
      };
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
        notes: `Pilot-Modus: Erfolgreich geroutet an ${executorName} (${orderType}). Trade-ID: ${result.trade?.id ?? 'PENDING'}`,
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

