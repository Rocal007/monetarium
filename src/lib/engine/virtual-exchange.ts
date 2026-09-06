import { calculateTradeFee, DEFAULT_CRYPTO_FEES, FeeModel } from './fee-structure';
import { PortfolioManager } from './portfolio-manager';
import { calculateSlippage, DEFAULT_SLIPPAGE_CONFIG, SlippageConfig } from './slippage-model';
import { Order, OrderSide, OrderType, TradeLog } from '../types/trading';

export class VirtualExchange {
  private portfolioManager: PortfolioManager;
  private pendingOrders: Order[] = [];
  private feeModel: FeeModel;
  private slippageConfig: SlippageConfig;

  constructor(
    portfolioManager: PortfolioManager,
    feeModel: FeeModel = DEFAULT_CRYPTO_FEES,
    slippageConfig: SlippageConfig = DEFAULT_SLIPPAGE_CONFIG
  ) {
    this.portfolioManager = portfolioManager;
    this.feeModel = feeModel;
    this.slippageConfig = slippageConfig;
  }

  public getPendingOrders(): Order[] {
    return [...this.pendingOrders];
  }

  public cancelOrder(orderId: string): boolean {
    const idx = this.pendingOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      this.pendingOrders[idx].status = 'CANCELLED';
      this.pendingOrders.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Platziert eine neue Order. Market Orders werden sofort simuliert ausgeführt,
   * Limit- und Stop-Orders werden in die Pending-Warteschlange eingereiht.
   */
  public submitOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    amount: number;
    price?: number;
    stopPrice?: number;
    currentMarketPrice: number;
    candleRangePercent?: number;
  }): { order: Order; trade?: TradeLog } {
    const id = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order: Order = {
      id,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price,
      stopPrice: params.stopPrice,
      amount: params.amount,
      status: 'PENDING',
      fee: 0,
      slippage: 0,
      timestamp: Date.now(),
    };

    if (params.type === 'MARKET') {
      // Sofortige Ausführung mit realistischer Slippage
      const { executionPrice, slippageAmount } = calculateSlippage(
        params.currentMarketPrice,
        params.side,
        params.amount,
        params.candleRangePercent ?? 0.01,
        this.slippageConfig
      );

      const fee = calculateTradeFee(params.amount, executionPrice, true, this.feeModel);

      order.status = 'FILLED';
      order.filledPrice = executionPrice;
      order.fee = fee;
      order.slippage = slippageAmount;

      let trade: TradeLog;
      if (params.side === 'BUY') {
        trade = this.portfolioManager.executeBuy(
          params.symbol,
          executionPrice,
          params.amount,
          fee,
          order.id
        );
      } else {
        trade = this.portfolioManager.executeSell(
          params.symbol,
          executionPrice,
          params.amount,
          fee,
          order.id
        );
      }

      return { order, trade };
    }

    // Limit oder Stop Order wird vorgehalten
    this.pendingOrders.push(order);
    return { order };
  }

  /**
   * Überprüft bei jedem neuen Ticker-Tick / jeder neuen Kerze alle ausstehenden Orders
   * sowie Stop-Loss / Take-Profit Trigger.
   */
  public processTick(symbol: string, high: number, low: number, close: number): TradeLog[] {
    const executedTrades: TradeLog[] = [];
    const remainingOrders: Order[] = [];

    // 1. Pending Limit- und Stop-Orders matchen
    for (const order of this.pendingOrders) {
      if (order.symbol !== symbol) {
        remainingOrders.push(order);
        continue;
      }

      let fill = false;
      let fillPrice = close;

      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && order.price && low <= order.price) {
          fill = true;
          fillPrice = order.price;
        } else if (order.side === 'SELL' && order.price && high >= order.price) {
          fill = true;
          fillPrice = order.price;
        }
      } else if (order.type === 'STOP_LOSS') {
        if (order.stopPrice && low <= order.stopPrice) {
          fill = true;
          fillPrice = order.stopPrice;
        }
      }

      if (fill) {
        const fee = calculateTradeFee(order.amount, fillPrice, false, this.feeModel);
        order.status = 'FILLED';
        order.filledPrice = fillPrice;
        order.fee = fee;

        try {
          let trade: TradeLog;
          if (order.side === 'BUY') {
            trade = this.portfolioManager.executeBuy(symbol, fillPrice, order.amount, fee, order.id);
          } else {
            trade = this.portfolioManager.executeSell(symbol, fillPrice, order.amount, fee, order.id);
          }
          executedTrades.push(trade);
        } catch {
          order.status = 'REJECTED';
        }
      } else {
        remainingOrders.push(order);
      }
    }

    this.pendingOrders = remainingOrders;

    // 2. Offene Positionen auf automatische Stop-Loss & Take-Profit Trigger prüfen
    const pos = this.portfolioManager.getPortfolio().positions[symbol];
    if (pos && pos.amount > 0) {
      if (pos.stopLoss && low <= pos.stopLoss) {
        // Stop Loss ausgelöst!
        const fee = calculateTradeFee(pos.amount, pos.stopLoss, true, this.feeModel);
        const slTrade = this.portfolioManager.executeSell(
          symbol,
          pos.stopLoss,
          pos.amount,
          fee,
          `sl-trigger-${Date.now()}`
        );
        executedTrades.push(slTrade);
      } else if (pos.takeProfit && high >= pos.takeProfit) {
        // Take Profit ausgelöst!
        const fee = calculateTradeFee(pos.amount, pos.takeProfit, true, this.feeModel);
        const tpTrade = this.portfolioManager.executeSell(
          symbol,
          pos.takeProfit,
          pos.amount,
          fee,
          `tp-trigger-${Date.now()}`
        );
        executedTrades.push(tpTrade);
      }
    }

    this.portfolioManager.updateMarketPrice(symbol, close);
    return executedTrades;
  }
}
