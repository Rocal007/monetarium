import { OrderSide, Portfolio, Position, TradeLog } from '../types/trading';

export class PortfolioManager {
  private portfolio: Portfolio;

  constructor(initialCapitalOrPortfolio: number | Portfolio = 10000) {
    if (typeof initialCapitalOrPortfolio === 'object' && initialCapitalOrPortfolio !== null) {
      this.portfolio = {
        cash: initialCapitalOrPortfolio.cash,
        initialBalance: initialCapitalOrPortfolio.initialBalance,
        equity: initialCapitalOrPortfolio.equity,
        realizedPnL: initialCapitalOrPortfolio.realizedPnL,
        unrealizedPnL: initialCapitalOrPortfolio.unrealizedPnL,
        positions: { ...initialCapitalOrPortfolio.positions },
        tradeHistory: [...initialCapitalOrPortfolio.tradeHistory],
      };
    } else {
      const initialCapital = typeof initialCapitalOrPortfolio === 'number' ? initialCapitalOrPortfolio : 10000;
      this.portfolio = {
        cash: initialCapital,
        initialBalance: initialCapital,
        equity: initialCapital,
        realizedPnL: 0,
        unrealizedPnL: 0,
        positions: {},
        tradeHistory: [],
      };
    }
  }

  public restorePortfolio(portfolio: Portfolio): void {
    this.portfolio = {
      cash: portfolio.cash,
      initialBalance: portfolio.initialBalance,
      equity: portfolio.equity,
      realizedPnL: portfolio.realizedPnL,
      unrealizedPnL: portfolio.unrealizedPnL,
      positions: { ...portfolio.positions },
      tradeHistory: [...portfolio.tradeHistory],
    };
  }

  public getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  public reset(initialCapital: number = 10000): void {
    this.portfolio = {
      cash: initialCapital,
      initialBalance: initialCapital,
      equity: initialCapital,
      realizedPnL: 0,
      unrealizedPnL: 0,
      positions: {},
      tradeHistory: [],
    };
  }

  /**
   * Führt einen Kauf aus: Verringert Cash, eröffnet/erhöht Long-Position.
   */
  public executeBuy(
    symbol: string,
    price: number,
    amount: number,
    fee: number,
    orderId: string,
    stopLoss?: number,
    takeProfit?: number
  ): TradeLog {
    const cost = price * amount + fee;
    if (cost > this.portfolio.cash) {
      throw new Error(`Unzureichendes virtuelles Guthaben: Benötigt ${cost.toFixed(2)} €, verfügbar ${this.portfolio.cash.toFixed(2)} €`);
    }

    this.portfolio.cash -= cost;

    const existingPos = this.portfolio.positions[symbol];
    if (existingPos) {
      // Durchschnittspreis (Dollar-Cost-Average) anpassen
      const totalAmount = existingPos.amount + amount;
      const totalInvested = existingPos.entryPrice * existingPos.amount + price * amount;
      const newEntryPrice = totalInvested / totalAmount;

      existingPos.amount = totalAmount;
      existingPos.entryPrice = Number(newEntryPrice.toFixed(2));
      existingPos.currentPrice = price;
      if (stopLoss) existingPos.stopLoss = stopLoss;
      if (takeProfit) existingPos.takeProfit = takeProfit;
    } else {
      this.portfolio.positions[symbol] = {
        id: `pos-${Date.now()}-${symbol}`,
        symbol,
        side: 'BUY',
        entryPrice: price,
        currentPrice: price,
        amount,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        stopLoss,
        takeProfit,
        timestamp: Date.now(),
      };
    }

    const trade: TradeLog = {
      id: `trade-${Date.now()}`,
      orderId,
      symbol,
      side: 'BUY',
      price,
      amount,
      fee,
      timestamp: Date.now(),
    };

    this.portfolio.tradeHistory.push(trade);
    this.updateMarketPrice(symbol, price);
    return trade;
  }

  /**
   * Führt einen Verkauf aus (ganz oder teilweise). Berechnet Realized PnL.
   */
  public executeSell(
    symbol: string,
    price: number,
    amount: number,
    fee: number,
    orderId: string
  ): TradeLog {
    const pos = this.portfolio.positions[symbol];
    if (!pos || pos.amount < amount) {
      throw new Error(`Nicht genügend Position zum Verkaufen: Verfügbar ${pos?.amount ?? 0}, gefordert ${amount}`);
    }

    const revenue = price * amount - fee;
    this.portfolio.cash += revenue;

    // Realisierter Gewinn/Verlust
    const costBasis = pos.entryPrice * amount;
    const pnl = price * amount - costBasis - fee;
    this.portfolio.realizedPnL += pnl;

    pos.amount -= amount;
    pos.realizedPnL += pnl;

    if (pos.amount <= 0.000001) {
      delete this.portfolio.positions[symbol];
    } else {
      pos.currentPrice = price;
    }

    const trade: TradeLog = {
      id: `trade-${Date.now()}`,
      orderId,
      symbol,
      side: 'SELL',
      price,
      amount,
      fee,
      pnl: Number(pnl.toFixed(2)),
      timestamp: Date.now(),
    };

    this.portfolio.tradeHistory.push(trade);
    this.updateMarketPrice(symbol, price);
    return trade;
  }

  /**
   * Aktualisiert Marktpreise und berechnet unrealisierten PnL & Gesamtequity.
   */
  public updateMarketPrice(symbol: string, currentPrice: number): void {
    const pos = this.portfolio.positions[symbol];
    if (pos) {
      pos.currentPrice = currentPrice;
      const positionValue = currentPrice * pos.amount;
      const costBasis = pos.entryPrice * pos.amount;
      pos.unrealizedPnL = Number((positionValue - costBasis).toFixed(2));
      pos.unrealizedPnLPercent = Number((((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));
    }

    // Gesamtbewertung berechnen
    let totalPositionsValue = 0;
    let totalUnrealizedPnL = 0;

    for (const p of Object.values(this.portfolio.positions)) {
      totalPositionsValue += p.currentPrice * p.amount;
      totalUnrealizedPnL += p.unrealizedPnL;
    }

    this.portfolio.unrealizedPnL = Number(totalUnrealizedPnL.toFixed(2));
    this.portfolio.equity = Number((this.portfolio.cash + totalPositionsValue).toFixed(2));
  }
}
