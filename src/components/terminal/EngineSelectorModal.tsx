'use client';

import React, { useState } from 'react';
import { EngineInfo, EngineType, EngineManager } from '../../lib/engines/engine-manager';
import {
  X,
  Server,
  Webhook,
  Coins,
  Landmark,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Key,
  RefreshCw,
  ExternalLink,
  Layers,
  Radio,
  Clock,
  Calendar,
  Gamepad2,
} from 'lucide-react';

interface EngineSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  engines: EngineInfo[];
  activeEngine: EngineType;
  onSelectEngine: (type: EngineType) => void;
  engineManager?: EngineManager;
}

type TabType = 'ENGINES' | 'ALPACA' | 'CCXT' | 'WEBHOOK' | 'CALENDAR';

export const EngineSelectorModal: React.FC<EngineSelectorModalProps> = ({
  isOpen,
  onClose,
  engines,
  activeEngine,
  onSelectEngine,
  engineManager,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ENGINES');

  // Alpaca Form State
  const [alpacaKey, setAlpacaKey] = useState('');
  const [alpacaSecret, setAlpacaSecret] = useState('');
  const [alpacaIsPaper, setAlpacaIsPaper] = useState(true);
  const [alpacaTestResult, setAlpacaTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [isTestingAlpaca, setIsTestingAlpaca] = useState(false);

  // CCXT State
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [ccxtTestResult, setCcxtTestResult] = useState<{ success: boolean; message: string; latencyMs: number; price?: number } | null>(null);
  const [isTestingCcxt, setIsTestingCcxt] = useState(false);

  // Webhook State
  const [webhookPassphrase, setWebhookPassphrase] = useState('monetarium-secret-key');
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Calendar Test State
  const [calendarTestResult, setCalendarTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [isTestingCalendar, setIsTestingCalendar] = useState(false);

  if (!isOpen) return null;

  const getEngineIcon = (type: EngineType) => {
    switch (type) {
      case 'SIMULATED_PAPER':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'SPEED_TRADER_ARCADE':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'TRADINGVIEW_WEBHOOK':
        return <Webhook className="w-5 h-5 text-sky-400" />;
      case 'CCXT_CRYPTO':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'ALPACA_EQUITY':
        return <Landmark className="w-5 h-5 text-purple-400" />;
    }
  };

  const handleSaveAlpaca = () => {
    if (engineManager) {
      engineManager.getAlpaca().setConfig({
        apiKey: alpacaKey,
        apiSecret: alpacaSecret,
        isPaper: alpacaIsPaper,
      });
      handleTestAlpaca();
    }
  };

  const handleTestAlpaca = async () => {
    if (!engineManager) return;
    setIsTestingAlpaca(true);
    setAlpacaTestResult(null);
    try {
      const res = await engineManager.testAlpaca();
      setAlpacaTestResult(res);
    } finally {
      setIsTestingAlpaca(false);
    }
  };

  const handleTestCcxt = async () => {
    if (!engineManager) return;
    setIsTestingCcxt(true);
    setCcxtTestResult(null);
    try {
      const res = await engineManager.testCcxt(selectedExchange, 'BTC/USDT');
      setCcxtTestResult(res);
    } finally {
      setIsTestingCcxt(false);
    }
  };

  const handleTestCalendar = async () => {
    if (!engineManager) return;
    setIsTestingCalendar(true);
    setCalendarTestResult(null);
    try {
      const res = await engineManager.testForexFactory();
      setCalendarTestResult(res);
    } finally {
      setIsTestingCalendar(false);
    }
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/webhook/tradingview`;
  const sampleWebhookJson = JSON.stringify(
    {
      passphrase: webhookPassphrase,
      action: 'BUY',
      symbol: 'BTC/USDT',
      price: 64500,
      amount: 0.05,
      orderType: 'MARKET',
      stopLoss: 62500,
      takeProfit: 68500,
      message: 'Pine Script EMA Breakout Signal',
    },
    null,
    2
  );

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(sampleWebhookJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-fade-in">
      <div className="bg-trading-surface border border-trading-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-trading-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Externe Anbindungen & Broker Hub</h2>
              <p className="text-xs text-trading-muted">
                Multi-Engine Verwaltung für reale Marktdaten, Krypto, TradFi & Webhooks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-trading-muted hover:text-white hover:bg-trading-card transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-trading-bg rounded-lg border border-trading-border text-xs">
          <button
            onClick={() => setActiveTab('ENGINES')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTab === 'ENGINES'
                ? 'bg-trading-card text-white shadow-sm border border-trading-border/60'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Engines
          </button>
          <button
            onClick={() => setActiveTab('ALPACA')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTab === 'ALPACA'
                ? 'bg-trading-card text-white shadow-sm border border-trading-border/60'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-purple-400" />
            Alpaca (Aktien)
          </button>
          <button
            onClick={() => setActiveTab('CCXT')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTab === 'CCXT'
                ? 'bg-trading-card text-white shadow-sm border border-trading-border/60'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            CCXT (Krypto)
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOK')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTab === 'WEBHOOK'
                ? 'bg-trading-card text-white shadow-sm border border-trading-border/60'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-emerald-400" />
            TradingView Webhook
          </button>
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTab === 'CALENDAR'
                ? 'bg-trading-card text-white shadow-sm border border-trading-border/60'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Wirtschaftskalender
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: ENGINES OVERVIEW */}
          {activeTab === 'ENGINES' && (
            <div className="space-y-3">
              <span className="text-xs text-trading-muted block mb-1">
                Wähle die aktive Ausführungs- und Routing-Engine:
              </span>
              {engines.map((eng) => {
                const isSelected = activeEngine === eng.type;
                return (
                  <div
                    key={eng.type}
                    onClick={() => onSelectEngine(eng.type)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-trading-card border-trading-accent/60 shadow-md ring-1 ring-trading-accent/30'
                        : 'bg-trading-bg hover:bg-trading-card/60 border-trading-border'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-trading-surface border border-trading-border/80 flex-shrink-0">
                      {getEngineIcon(eng.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{eng.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-trading-surface text-trading-muted border border-trading-border">
                            {eng.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-trading-muted leading-relaxed mb-1.5">
                        {eng.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-trading-muted">
                        <span>
                          Fokus: <strong className="text-white">{eng.assetFocus}</strong>
                        </span>
                        <span>
                          Live Orders:{' '}
                          <strong className={eng.supportsLiveOrders ? 'text-emerald-400' : 'text-slate-400'}>
                            {eng.supportsLiveOrders ? 'Unterstützt' : 'Nur Paper-Sim'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ALPACA MARKETS */}
          {activeTab === 'ALPACA' && (
            <div className="space-y-4 text-xs">
              <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-purple-400" />
                    Alpaca Markets API Credentials
                  </span>
                  <a
                    href="https://alpaca.markets"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    Konto anlegen <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-trading-muted text-[11px]">
                  Ermöglicht den Handel von US-Aktien (SPY, Apple, Nvidia, Microsoft) über die offizielle Alpaca API.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-trading-muted text-[10px] mb-1 uppercase">
                      Alpaca API Key ID (APCA-API-KEY-ID)
                    </label>
                    <input
                      type="text"
                      value={alpacaKey}
                      onChange={(e) => setAlpacaKey(e.target.value)}
                      placeholder="z.B. PKXXXXXXXXXXXXXXXXXX"
                      className="w-full bg-black/40 border border-trading-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-trading-muted focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-trading-muted text-[10px] mb-1 uppercase">
                      Alpaca Secret Key (APCA-API-SECRET-KEY)
                    </label>
                    <input
                      type="password"
                      value={alpacaSecret}
                      onChange={(e) => setAlpacaSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full bg-black/40 border border-trading-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-trading-muted focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={alpacaIsPaper}
                        onChange={(e) => setAlpacaIsPaper(e.target.checked)}
                        className="rounded border-trading-border text-purple-500 focus:ring-0"
                      />
                      <span>Paper-Trading Modus (empfohlen, paper-api.alpaca.markets)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveAlpaca}
                    className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Credentials Speichern & Aktivieren
                  </button>
                  <button
                    onClick={handleTestAlpaca}
                    disabled={isTestingAlpaca}
                    className="py-2 px-3 rounded-lg bg-trading-card hover:bg-slate-700 text-white border border-trading-border font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingAlpaca ? 'animate-spin' : ''}`} />
                    Testen
                  </button>
                </div>

                {alpacaTestResult && (
                  <div
                    className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                      alpacaTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="font-bold mb-0.5 flex items-center gap-1.5">
                      {alpacaTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {alpacaTestResult.success ? 'Verbindung erfolgreich' : 'Fehler bei Verbindung'} ({alpacaTestResult.latencyMs}ms)
                    </div>
                    {alpacaTestResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CCXT MULTI-EXCHANGE */}
          {activeTab === 'CCXT' && (
            <div className="space-y-4 text-xs">
              <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    CCXT Multi-Börsen Schnittstelle (100+ Exchanges)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    Server Proxy
                  </span>
                </div>
                <p className="text-trading-muted text-[11px]">
                  Verbindet Monetarium über den serverseitigen Proxy mit Krypto-Börsen. Public Feeds laufen ohne API-Key.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-trading-muted text-[10px] mb-1 uppercase">
                      Börse auswählen (CCXT Exchange ID)
                    </label>
                    <select
                      value={selectedExchange}
                      onChange={(e) => setSelectedExchange(e.target.value)}
                      className="w-full bg-black/40 border border-trading-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="binance">Binance (Spot / Testnet)</option>
                      <option value="kraken">Kraken</option>
                      <option value="bybit">Bybit</option>
                      <option value="coinbase">Coinbase Advanced</option>
                      <option value="okx">OKX</option>
                      <option value="bitfinex">Bitfinex</option>
                      <option value="gateio">Gate.io</option>
                      <option value="kucoin">KuCoin</option>
                    </select>
                  </div>

                  <div className="p-2.5 rounded-lg bg-trading-card border border-trading-border text-[11px] text-trading-muted space-y-1">
                    <span className="text-white font-bold block">Für Live-Orderausführung:</span>
                    <span>
                      Hinterlege deine API-Keys in <code className="text-amber-400">.env.local</code>:
                    </span>
                    <pre className="bg-black/60 p-2 rounded text-[10px] text-slate-300 font-mono mt-1 overflow-x-auto">
{`${selectedExchange.toUpperCase()}_API_KEY=dein_api_schlüssel\n${selectedExchange.toUpperCase()}_API_SECRET=dein_secret_schlüssel`}
                    </pre>
                  </div>

                  <button
                    onClick={handleTestCcxt}
                    disabled={isTestingCcxt}
                    className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingCcxt ? 'animate-spin' : ''}`} />
                    {isTestingCcxt ? 'Lade Ticker...' : `${selectedExchange.toUpperCase()} Verbindung & Ticker testen`}
                  </button>

                  {ccxtTestResult && (
                    <div
                      className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                        ccxtTestResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="font-bold mb-0.5 flex items-center gap-1.5">
                        {ccxtTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {ccxtTestResult.success ? 'Ticker erfolgreich' : 'Fehler'} ({ccxtTestResult.latencyMs}ms)
                      </div>
                      {ccxtTestResult.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRADINGVIEW WEBHOOK */}
          {activeTab === 'WEBHOOK' && (
            <div className="space-y-4 text-xs">
              <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Webhook className="w-4 h-4 text-emerald-400" />
                    TradingView Pine Script Alert Webhook
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Aktiv & Empfangsbereit
                  </span>
                </div>
                <p className="text-trading-muted text-[11px]">
                  Sende automatische Kaufs- und Verkaufssignale direkt aus TradingView-Charts an Monetarium.
                </p>

                <div>
                  <label className="block text-trading-muted text-[10px] mb-1 uppercase">
                    Webhook Empfangs-URL (in TradingView Alert eintragen)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-black/40 border border-trading-border rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono select-all"
                    />
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="px-3 py-1.5 rounded-lg bg-trading-card hover:bg-slate-700 text-white border border-trading-border font-bold flex items-center gap-1 transition"
                    >
                      {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedWebhookUrl ? 'Kopiert' : 'Kopieren'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-trading-muted text-[10px] mb-1 uppercase">
                    Sicherheits-Passphrase (optional)
                  </label>
                  <input
                    type="text"
                    value={webhookPassphrase}
                    onChange={(e) => setWebhookPassphrase(e.target.value)}
                    className="w-full bg-black/40 border border-trading-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-trading-muted focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-trading-muted text-[10px] uppercase">
                      Alert Message JSON Vorlage für TradingView:
                    </label>
                    <button
                      onClick={handleCopyPayload}
                      className="text-sky-400 hover:underline text-[10px] flex items-center gap-1"
                    >
                      {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedPayload ? 'JSON kopiert' : 'JSON kopieren'}
                    </button>
                  </div>
                  <pre className="bg-black/60 p-2.5 rounded-lg border border-trading-border text-[10px] text-slate-300 font-mono overflow-x-auto">
{sampleWebhookJson}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WIRTSCHAFTSKALENDER */}
          {activeTab === 'CALENDAR' && (
            <div className="space-y-4 text-xs">
              <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    Forex Factory & Fair Economy CDN
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-bold">
                    Reales CDN
                  </span>
                </div>
                <p className="text-trading-muted text-[11px]">
                  Liefert High-Impact Zinsentscheide (Fed, EZB), Non-Farm Payrolls und Inflationsdaten für den automatischen News-Blackout Circuit-Breaker.
                </p>

                <div className="p-2.5 rounded-lg bg-trading-card border border-trading-border text-[11px] space-y-1 text-trading-muted">
                  <div className="flex justify-between">
                    <span>CDN-Endpunkt:</span>
                    <span className="text-white font-mono">https://nfs.faireconomy.media</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blackout-Schutzfenster:</span>
                    <span className="text-amber-400 font-bold">±20 Minuten vor/nach High-Impact Events</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache-Dauer:</span>
                    <span className="text-slate-300">60 Sekunden (In-Memory)</span>
                  </div>
                </div>

                <button
                  onClick={handleTestCalendar}
                  disabled={isTestingCalendar}
                  className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingCalendar ? 'animate-spin' : ''}`} />
                  {isTestingCalendar ? 'Verbinde mit CDN...' : 'Forex Factory CDN Verbindung testen'}
                </button>

                {calendarTestResult && (
                  <div
                    className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                      calendarTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="font-bold mb-0.5 flex items-center gap-1.5">
                      {calendarTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {calendarTestResult.success ? 'CDN erreichbar' : 'Fehler'} ({calendarTestResult.latencyMs}ms)
                    </div>
                    {calendarTestResult.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-trading-border flex items-center justify-between text-xs text-trading-muted">
          <span>Alle Verbindungen sind mit dem Data Sentinel Agent (Operator D_real) gekoppelt.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-trading-card hover:bg-slate-700 text-white font-semibold transition"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
