import { AlpacaConnector } from './alpaca-connector';
import { CCXTConnector } from './ccxt-connector';
import { Candle, OrderSide, OrderType, TradeLog } from '../types/trading';

export type EngineType = 'SIMULATED_PAPER' | 'TRADINGVIEW_WEBHOOK' | 'CCXT_CRYPTO' | 'ALPACA_EQUITY';

export interface EngineInfo {
  type: EngineType;
  name: string;
  description: string;
  badge: string;
  status: 'CONNECTED' | 'SIMULATION' | 'STANDBY';
  supportsLiveOrders: boolean;
  assetFocus: 'CRYPTO' | 'EQUITIES' | 'MULTI_ASSET';
}

export class EngineManager {
  private currentEngine: EngineType = 'SIMULATED_PAPER';
  private ccxtConnector: CCXTConnector;
  private alpacaConnector: AlpacaConnector;

  constructor() {
    this.ccxtConnector = new CCXTConnector();
    this.alpacaConnector = new AlpacaConnector();
  }

  public getAvailableEngines(): EngineInfo[] {
    return [
      {
        type: 'SIMULATED_PAPER',
        name: 'Monetarium Paper Engine',
        description: 'Autonome, risikofreie Börsensimulation mit interner Slippage- und Gebührenberechnung.',
        badge: 'Zero-Risk Sim',
        status: 'SIMULATION',
        supportsLiveOrders: false,
        assetFocus: 'MULTI_ASSET',
      },
      {
        type: 'TRADINGVIEW_WEBHOOK',
        name: 'TradingView Webhook Engine',
        description: 'Empfängt Pine-Script Alert Payloads über /api/webhook/tradingview und führt Trades virtuell aus.',
        badge: 'Pine Script Alert',
        status: 'CONNECTED',
        supportsLiveOrders: false,
        assetFocus: 'MULTI_ASSET',
      },
      {
        type: 'CCXT_CRYPTO',
        name: 'CCXT Multi-Exchange (Krypto)',
        description: 'Echtzeit-Anbindung an Binance, Kraken, Bybit, OKX und 100+ Börsen (Public & Testnet/Live).',
        badge: '100+ Exchanges',
        status: 'CONNECTED',
        supportsLiveOrders: true,
        assetFocus: 'CRYPTO',
      },
      {
        type: 'ALPACA_EQUITY',
        name: 'Alpaca Markets (US-Aktien)',
        description: 'TradFi Aktien- und ETF-Trading (SPY, Apple, Nvidia) über die offizielle Alpaca Paper REST API.',
        badge: 'TradFi Equities',
        status: 'CONNECTED',
        supportsLiveOrders: true,
        assetFocus: 'EQUITIES',
      },
    ];
  }

  public getActiveEngine(): EngineType {
    return this.currentEngine;
  }

  public setActiveEngine(engine: EngineType) {
    this.currentEngine = engine;
  }

  public getCcxt(): CCXTConnector {
    return this.ccxtConnector;
  }

  public getAlpaca(): AlpacaConnector {
    return this.alpacaConnector;
  }
}
