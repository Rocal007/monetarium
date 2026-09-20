import { AlpacaConnector } from './alpaca-connector';
import { CCXTConnector } from './ccxt-connector';
import { Candle, OrderSide, OrderType, TradeLog } from '../types/trading';

export type EngineType = 'SIMULATED_PAPER' | 'TRADINGVIEW_WEBHOOK' | 'CCXT_CRYPTO' | 'ALPACA_EQUITY' | 'SPEED_TRADER_ARCADE';

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
        type: 'SPEED_TRADER_ARCADE',
        name: 'Speed-Trader Arcade Engine',
        description: 'Gamifizierte Hochgeschwindigkeits-Börsensimulation mit bis zu 20x Speed, AI-Duell-Modus und Event-Shocks.',
        badge: 'Arcade & Game Sim',
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

  public async testAlpaca(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const clock = await this.alpacaConnector.getClock();
      const latencyMs = Date.now() - start;
      const statusText = clock.isOpen ? 'Börse geöffnet' : 'Börse geschlossen';
      const mode = this.alpacaConnector.isConfigured() ? 'Live/Paper API Key' : 'Simulation';
      return {
        success: true,
        message: `Alpaca Verbindung aktiv (${mode}). Status: ${statusText}. Nächstes Open: ${new Date(clock.nextOpen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Alpaca Fehler: ${err.message || 'Verbindung fehlgeschlagen'}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  public async testCcxt(exchangeId: string = 'binance', symbol: string = 'BTC/USDT'): Promise<{ success: boolean; message: string; latencyMs: number; price?: number }> {
    const start = Date.now();
    try {
      const ticker = await this.ccxtConnector.fetchTicker(exchangeId, symbol);
      const latencyMs = Date.now() - start;
      return {
        success: true,
        message: `${exchangeId.toUpperCase()} Ticker erfolgreich: ${symbol} = ${ticker.lastPrice.toFixed(2)} (Bid: ${ticker.bid.toFixed(2)} / Ask: ${ticker.ask.toFixed(2)})`,
        latencyMs,
        price: ticker.lastPrice,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `CCXT Fehler (${exchangeId}): ${err.message || 'Verbindung fehlgeschlagen'}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  public async testBinanceDirect(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch('https://api.binance.com/api/v3/ping');
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: `Binance Direct REST erreichbar (Ping: ${latencyMs}ms). Öffentliche Daten ohne API-Key aktiv.`,
          latencyMs,
        };
      }
      return {
        success: false,
        message: `Binance Direct Status HTTP ${res.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Binance Direct nicht erreichbar: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  public async testForexFactory(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
      const latencyMs = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : 0;
        return {
          success: true,
          message: `Fair Economy CDN erreichbar: ${count} Wirtschaftstermine für diese Woche synchronisiert.`,
          latencyMs,
        };
      }
      return {
        success: false,
        message: `Forex Factory CDN HTTP ${res.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Forex Factory CDN nicht erreichbar: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
