import { Order, OrderSide, OrderType, TradeLog } from '../types/trading';
import { VirtualExchange } from './virtual-exchange';
import { CCXTConnector } from '../engines/ccxt-connector';
import { AlpacaConnector } from '../engines/alpaca-connector';

export interface OrderExecutionRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  currentMarketPrice: number;
  candleRangePercent?: number;
}

export interface OrderExecutionResult {
  order: Order;
  trade?: TradeLog;
  raw?: any;
}

/**
 * Universelle Schnittstelle für Orderausführer (Simulation, Krypto-Börsen, US-Broker)
 */
export interface IOrderExecutor {
  readonly name: string;
  readonly isSimulation: boolean;
  submitOrder(params: OrderExecutionRequest): Promise<OrderExecutionResult> | OrderExecutionResult;
}

/**
 * 1. Virtueller Ausführer (Standard Monetarium Paper Trading Engine)
 */
export class VirtualOrderExecutor implements IOrderExecutor {
  public readonly name: string = 'Monetarium Paper Engine';
  public readonly isSimulation: boolean = true;
  private virtualExchange: VirtualExchange;

  constructor(virtualExchange: VirtualExchange) {
    this.virtualExchange = virtualExchange;
  }

  public submitOrder(params: OrderExecutionRequest): OrderExecutionResult {
    return this.virtualExchange.submitOrder(params);
  }

  public getVirtualExchange(): VirtualExchange {
    return this.virtualExchange;
  }
}

/**
 * 2. Reale/Testnet Krypto-Order-Ausführung via CCXT
 */
export class CCXTOrderExecutor implements IOrderExecutor {
  public readonly name: string;
  public readonly isSimulation: boolean;
  private ccxtConnector: CCXTConnector;
  private exchangeId: string;

  constructor(exchangeId: string = 'binance', isSimulation: boolean = false) {
    this.exchangeId = exchangeId;
    this.isSimulation = isSimulation;
    this.name = `CCXT (${exchangeId.toUpperCase()}${isSimulation ? ' Testnet' : ' Live'})`;
    this.ccxtConnector = new CCXTConnector();
  }

  public async submitOrder(params: OrderExecutionRequest): Promise<OrderExecutionResult> {
    const res = await this.ccxtConnector.createOrder({
      exchangeId: this.exchangeId,
      symbol: params.symbol,
      type: params.type.toLowerCase() as 'market' | 'limit',
      side: params.side,
      amount: params.amount,
      price: params.price,
    });

    const tradeId = `trd-ccxt-${Date.now()}`;
    const fillPrice = res.price || params.currentMarketPrice;

    const order: Order = {
      id: res.id,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price,
      amount: params.amount,
      status: 'FILLED',
      filledPrice: fillPrice,
      fee: 0,
      slippage: 0,
      timestamp: res.timestamp || Date.now(),
    };

    const trade: TradeLog = {
      id: tradeId,
      orderId: res.id,
      symbol: params.symbol,
      side: params.side,
      price: fillPrice,
      amount: params.amount,
      fee: 0,
      timestamp: res.timestamp || Date.now(),
    };

    return { order, trade, raw: res.raw };
  }
}

/**
 * 3. Reale/Paper US-Aktien-Ausführung via Alpaca Markets
 */
export class AlpacaOrderExecutor implements IOrderExecutor {
  public readonly name: string;
  public readonly isSimulation: boolean;
  private alpacaConnector: AlpacaConnector;

  constructor(isPaper: boolean = true) {
    this.isSimulation = isPaper;
    this.name = `Alpaca (${isPaper ? 'Paper' : 'Live'})`;
    this.alpacaConnector = new AlpacaConnector({ isPaper });
  }

  public async submitOrder(params: OrderExecutionRequest): Promise<OrderExecutionResult> {
    const res = await this.alpacaConnector.submitOrder({
      symbol: params.symbol,
      qty: params.amount,
      side: params.side,
      type: params.type.toLowerCase() as 'market' | 'limit',
      limitPrice: params.price,
    });

    const order: Order = {
      id: res.id,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price,
      amount: params.amount,
      status: res.status === 'accepted' || res.status === 'filled' ? 'FILLED' : 'PENDING',
      filledPrice: params.price || params.currentMarketPrice,
      fee: 0,
      slippage: 0,
      timestamp: Date.now(),
    };

    const trade: TradeLog = {
      id: `trd-alpaca-${Date.now()}`,
      orderId: res.id,
      symbol: params.symbol,
      side: params.side,
      price: params.price || params.currentMarketPrice,
      amount: params.amount,
      fee: 0,
      timestamp: Date.now(),
    };

    return { order, trade, raw: res };
  }
}
