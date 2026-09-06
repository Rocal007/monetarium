'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from '../components/terminal/Header';
import { ChartWidget } from '../components/terminal/ChartWidget';
import { OrderPanel } from '../components/terminal/OrderPanel';
import { PositionTracker } from '../components/terminal/PositionTracker';
import { MetricsCard } from '../components/terminal/MetricsCard';
import { StrategyPlayground } from '../components/terminal/StrategyPlayground';
import { BacktestInspector } from '../components/terminal/BacktestInspector';
import { EngineSelectorModal } from '../components/terminal/EngineSelectorModal';
import { TradingOrchestratorPanel } from '../components/terminal/TradingOrchestratorPanel';
import { Cicero7QInspector } from '../components/terminal/Cicero7QInspector';
import { BirkenbihlPlayground } from '../components/terminal/BirkenbihlPlayground';
import { WorldNewsBar } from '../components/terminal/WorldNewsBar';
import { SectorFleetPanel } from '../components/terminal/SectorFleetPanel';
import { calculateQuantMetrics } from '../lib/analytics/quant-metrics';
import { fetchCryptoTicker, fetchLiveCryptoCandles } from '../lib/data/crypto-feed';
import { generateRealisticCandles } from '../lib/data/mock-feed';
import { PortfolioManager } from '../lib/engine/portfolio-manager';
import { VirtualExchange } from '../lib/engine/virtual-exchange';
import { EngineManager, EngineType } from '../lib/engines/engine-manager';
import { executeDcaStrategy } from '../lib/strategies/dca-strategy';
import { executeGridStrategy } from '../lib/strategies/grid-strategy';
import { executeMomentumStrategy } from '../lib/strategies/momentum-strategy';
import { TradingAgentOrchestrator } from '../lib/agents/trading-orchestrator';
import { DEFAULT_PROTOCOL_PROFILE } from '../lib/agents/protocols/presets';
import { OrchestratorCycleRecord, TradingAgentProtocolProfile } from '../lib/agents/protocols/types';
import { Cicero7QRecord } from '../lib/types/cicero';
import { MacroSentimentState } from '../lib/types/news';
import { SectorType } from '../lib/types/sectors';
import { getAllSectorAgents, getSectorAgent, getSectorProfile } from '../lib/agents/sectors/sector-fleet';
import { transformCycleToCicero7Q, createSyntheticCicero7Q } from '../lib/agents/protocols/cicero-transformer';
import { Candle, OrderSide, OrderType, StrategyType } from '../lib/types/trading';

export default function TradingTerminalPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(64500);
  const [change24h, setChange24h] = useState(2.45);
  const [high24h, setHigh24h] = useState(65800);
  const [low24h, setLow24h] = useState(63200);
  const [isLive, setIsLive] = useState(false);

  // Engine Manager State
  const engineManagerRef = useRef<EngineManager>(new EngineManager());
  const [activeEngine, setActiveEngine] = useState<EngineType>('SIMULATED_PAPER');
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);

  // Portfolio & Exchange Engines
  const portfolioManagerRef = useRef<PortfolioManager>(new PortfolioManager(10000));
  const virtualExchangeRef = useRef<VirtualExchange>(new VirtualExchange(portfolioManagerRef.current));
  const [portfolioState, setPortfolioState] = useState(portfolioManagerRef.current.getPortfolio());
  const [pendingOrders, setPendingOrders] = useState(virtualExchangeRef.current.getPendingOrders());

  // Active Bot State
  const [activeBot, setActiveBot] = useState<StrategyType | null>(null);
  const botParamsRef = useRef<Record<string, number>>({});

  // NEXUS Trading Agent Orchestrator State
  const orchestratorRef = useRef<TradingAgentOrchestrator>(
    new TradingAgentOrchestrator(virtualExchangeRef.current, DEFAULT_PROTOCOL_PROFILE)
  );
  const [activeProfile, setActiveProfile] = useState<TradingAgentProtocolProfile>(DEFAULT_PROTOCOL_PROFILE);
  const [isOrchestratorAutoPilot, setIsOrchestratorAutoPilot] = useState<boolean>(false);
  const [latestOrchestratorRecord, setLatestOrchestratorRecord] = useState<OrchestratorCycleRecord | null>(null);
  const [orchestratorAuditTrail, setOrchestratorAuditTrail] = useState<OrchestratorCycleRecord[]>([]);
  const [isCircuitTripped, setIsCircuitTripped] = useState<boolean>(false);

  // Cicero-7Q State
  const [currentCiceroRecord, setCurrentCiceroRecord] = useState<Cicero7QRecord | null>(null);
  const [ciceroHistory, setCiceroHistory] = useState<Cicero7QRecord[]>([]);

  // Sektor-Flotte State
  const [activeSector, setActiveSector] = useState<SectorType>('CRYPTO');
  const sectorFleet = useMemo(() => getAllSectorAgents(), []);

  const handleSelectSector = (sector: SectorType) => {
    setActiveSector(sector);
    const profile = getSectorProfile(sector);
    orchestratorRef.current.setProfile(profile);
    setActiveProfile(profile);

    const agent = getSectorAgent(sector);
    if (agent.universe.length > 0 && !agent.universe.some((u) => u.symbol === selectedSymbol)) {
      const target = agent.universe[0];
      setSelectedSymbol(target.symbol);
      setCurrentPrice(target.basePrice);
    }
  };

  // Google Cloud IAM Welt-News State
  const [macroNews, setMacroNews] = useState<MacroSentimentState | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);

  // Weltnachrichten abrufen
  const fetchWorldNews = async (params: { crisis?: boolean; reset?: boolean } = {}) => {
    try {
      setIsNewsLoading(true);
      const query = params.crisis ? '?crisis=true' : params.reset ? '?reset=true' : '';
      const res = await fetch(`/api/news/world${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMacroNews(json.data);
          if (json.data.crisisActive) {
            setIsCircuitTripped(true);
            setIsOrchestratorAutoPilot(false);
          }
        }
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Weltnachrichten:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorldNews();
    const newsTimer = setInterval(() => {
      fetchWorldNews();
    }, 45000);
    return () => clearInterval(newsTimer);
  }, []);

  // 1. Symbol-Daten laden (unterstützt Krypto, CCXT und Alpaca)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const isCrypto = selectedSymbol.includes('USDT');
      const apiSymbol = selectedSymbol.replace('/', '');

      // Falls Aktien / TradFi / Sektor-Symbol
      if (!isCrypto || activeEngine === 'ALPACA_EQUITY') {
        const cleanSym = selectedSymbol.replace('/', '');
        const alpacaBars = await engineManagerRef.current.getAlpaca().getStockBars(cleanSym, '1Hour', 100);
        if (isMounted && alpacaBars.length > 0) {
          setCandles(alpacaBars);
          const latest = alpacaBars[alpacaBars.length - 1].close;
          setCurrentPrice(latest);
          setChange24h(1.25);
          setHigh24h(Number((latest * 1.015).toFixed(2)));
          setLow24h(Number((latest * 0.985).toFixed(2)));
          setIsLive(true);
          portfolioManagerRef.current.updateMarketPrice(selectedSymbol, latest);
          setPortfolioState(portfolioManagerRef.current.getPortfolio());
          return;
        }
      }

      if (isCrypto) {
        // Live-Daten von Binance / CCXT versuchen
        const liveTicker = await fetchCryptoTicker(apiSymbol);
        const liveCandles = await fetchLiveCryptoCandles(apiSymbol, '1h', 100);

        if (isMounted && liveCandles.length > 0) {
          setCandles(liveCandles);
          const latest = liveCandles[liveCandles.length - 1].close;
          setCurrentPrice(latest);
          if (liveTicker) {
            setChange24h(liveTicker.change24h);
            setHigh24h(liveTicker.high24h);
            setLow24h(liveTicker.low24h);
          }
          setIsLive(true);
          portfolioManagerRef.current.updateMarketPrice(selectedSymbol, latest);
          setPortfolioState(portfolioManagerRef.current.getPortfolio());
          return;
        }
      }

      // Fallback: Realistische Simulation
      setIsLive(false);
      const startP = selectedSymbol.includes('ETH') ? 3400 : selectedSymbol.includes('SOL') ? 145 : selectedSymbol.includes('SPY') ? 540 : 64000;
      const simCandles = generateRealisticCandles({
        symbol: selectedSymbol,
        startPrice: startP,
        count: 120,
        volatility: 0.012,
        trend: 0.0004,
      });

      if (isMounted) {
        setCandles(simCandles);
        const latest = simCandles[simCandles.length - 1].close;
        setCurrentPrice(latest);
        setChange24h(1.85);
        setHigh24h(latest * 1.025);
        setLow24h(latest * 0.975);
        portfolioManagerRef.current.updateMarketPrice(selectedSymbol, latest);
        setPortfolioState(portfolioManagerRef.current.getPortfolio());
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, activeEngine]);

  // 2. Tick & Simulation Loop (aktualisiert Preise & führt Bot-Entscheidungen aus)
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        // Kleiner Brownian Jitter
        const deltaPct = (Math.random() - 0.495) * 0.003;
        const newClose = Number((last.close * (1 + deltaPct)).toFixed(2));
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);

        const updatedLast: Candle = {
          ...last,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: last.volume + Math.floor(Math.random() * 5),
        };

        const newCandles = [...prev.slice(0, -1), updatedLast];

        setCurrentPrice(newClose);

        // Virtual Exchange Tick-Bearbeitung
        virtualExchangeRef.current.processTick(selectedSymbol, newHigh, newLow, newClose);

        // Bot-Signal Ausführung falls Basis-Bot aktiv
        if (activeBot) {
          let strat = executeMomentumStrategy;
          if (activeBot === 'GRID') strat = executeGridStrategy;
          if (activeBot === 'DCA') strat = executeDcaStrategy;

          const signal = strat(
            updatedLast,
            newCandles.length - 1,
            newCandles,
            portfolioManagerRef.current,
            botParamsRef.current
          );

          if (signal && signal.action !== 'HOLD') {
            const amount = signal.amount ?? (portfolioManagerRef.current.getPortfolio().cash * 0.15) / newClose;
            if (amount > 0) {
              try {
                virtualExchangeRef.current.submitOrder({
                  symbol: selectedSymbol,
                  side: signal.action,
                  type: 'MARKET',
                  amount,
                  currentMarketPrice: newClose,
                });
              } catch {
                // Ignore limit/insufficient funds
              }
            }
          }
        }

        // NEXUS Trading Agent Orchestrator Takt
        if (orchestratorRef.current.isAutoPilotActive()) {
          const rec = orchestratorRef.current.executeCycle(
            selectedSymbol,
            newClose,
            newCandles,
            portfolioManagerRef.current.getPortfolio(),
            macroNews
          );
          setLatestOrchestratorRecord(rec);
          setOrchestratorAuditTrail(orchestratorRef.current.getAuditTrail());
          const c7q = transformCycleToCicero7Q(rec, activeEngine);
          setCurrentCiceroRecord(c7q);
          setCiceroHistory((prev) => [c7q, ...prev.slice(0, 19)]);
          if (orchestratorRef.current.isCircuitTripped()) {
            setIsCircuitTripped(true);
            setIsOrchestratorAutoPilot(false);
          }
        }

        setPortfolioState(portfolioManagerRef.current.getPortfolio());
        setPendingOrders(virtualExchangeRef.current.getPendingOrders());

        return newCandles;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedSymbol, activeBot, isOrchestratorAutoPilot, activeEngine, macroNews]);

  // Manuelle Order-Ausführung
  const handleSubmitOrder = (params: {
    side: OrderSide;
    type: OrderType;
    amount: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    virtualExchangeRef.current.submitOrder({
      symbol: selectedSymbol,
      side: params.side,
      type: params.type,
      amount: params.amount,
      price: params.price,
      stopPrice: params.stopLoss,
      currentMarketPrice: currentPrice,
    });

    const c7q = createSyntheticCicero7Q({
      symbol: selectedSymbol,
      price: params.price || currentPrice,
      amount: params.amount,
      action: params.side,
      stopLossPercent: params.stopLoss ? Number((Math.abs(currentPrice - params.stopLoss) / currentPrice * 100).toFixed(1)) : 2.0,
      takeProfitMultiplier: params.takeProfit && params.stopLoss ? Number((Math.abs(params.takeProfit - currentPrice) / Math.max(1, Math.abs(currentPrice - params.stopLoss))).toFixed(1)) : 2.0,
      venueName: activeEngine,
    });
    setCurrentCiceroRecord(c7q);
    setCiceroHistory((prev) => [c7q, ...prev.slice(0, 19)]);

    setPortfolioState(portfolioManagerRef.current.getPortfolio());
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
  };

  // Position glattstellen
  const handleClosePosition = (symbol: string) => {
    const pos = portfolioState.positions[symbol];
    if (pos && pos.amount > 0) {
      virtualExchangeRef.current.submitOrder({
        symbol,
        side: 'SELL',
        type: 'MARKET',
        amount: pos.amount,
        currentMarketPrice: currentPrice,
      });
      setPortfolioState(portfolioManagerRef.current.getPortfolio());
    }
  };

  // Order stornieren
  const handleCancelOrder = (orderId: string) => {
    virtualExchangeRef.current.cancelOrder(orderId);
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
  };

  // Portfolio Reset
  const handleResetPortfolio = () => {
    portfolioManagerRef.current.reset(10000);
    virtualExchangeRef.current = new VirtualExchange(portfolioManagerRef.current);
    orchestratorRef.current.setVirtualExchange(virtualExchangeRef.current);
    orchestratorRef.current.resetCircuitBreaker();
    setIsCircuitTripped(false);
    fetchWorldNews({ reset: true });
    setPortfolioState(portfolioManagerRef.current.getPortfolio());
    setPendingOrders([]);
  };

  // Bot starten/stoppen (Klassische Bots)
  const handleStartBot = (type: StrategyType, params: Record<string, number>) => {
    botParamsRef.current = params;
    setActiveBot(type);
    if (isOrchestratorAutoPilot) {
      orchestratorRef.current.setAutoPilot(false);
      setIsOrchestratorAutoPilot(false);
    }
  };

  const handleStopBot = () => {
    setActiveBot(null);
  };

  // NEXUS Trading Agent Orchestrator Handler
  const handleToggleOrchestratorAutoPilot = () => {
    const nextState = !isOrchestratorAutoPilot;
    orchestratorRef.current.setAutoPilot(nextState);
    setIsOrchestratorAutoPilot(nextState);
    if (nextState) {
      setActiveBot(null); // Basis-Bot pausieren, Orchestrator übernimmt
    }
  };

  const handleStepOrchestratorCycle = () => {
    const rec = orchestratorRef.current.executeCycle(
      selectedSymbol,
      currentPrice,
      candles,
      portfolioManagerRef.current.getPortfolio(),
      macroNews
    );
    setLatestOrchestratorRecord(rec);
    setOrchestratorAuditTrail(orchestratorRef.current.getAuditTrail());
    const c7q = transformCycleToCicero7Q(rec, activeEngine);
    setCurrentCiceroRecord(c7q);
    setCiceroHistory((prev) => [c7q, ...prev.slice(0, 19)]);
    setIsCircuitTripped(orchestratorRef.current.isCircuitTripped());
    setPortfolioState(portfolioManagerRef.current.getPortfolio());
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
  };

  // Birkenbihl Simulator Trade Handler (Spieltrieb & Direkte Dekodierung)
  const handleBirkenbihlTrade = (params: {
    side: OrderSide;
    type: OrderType;
    amount: number;
    price: number;
    stopLoss: number;
    takeProfit: number;
    riskPercent: number;
    crvMultiplier: number;
  }) => {
    virtualExchangeRef.current.submitOrder({
      symbol: selectedSymbol,
      side: params.side,
      type: params.type,
      amount: params.amount,
      price: params.price,
      stopPrice: params.stopLoss,
      currentMarketPrice: currentPrice,
    });

    const c7q = createSyntheticCicero7Q({
      symbol: selectedSymbol,
      price: params.price,
      amount: params.amount,
      action: params.side,
      stopLossPercent: params.riskPercent,
      takeProfitMultiplier: params.crvMultiplier,
      venueName: activeEngine,
    });
    setCurrentCiceroRecord(c7q);
    setCiceroHistory((prev) => [c7q, ...prev.slice(0, 19)]);

    setPortfolioState(portfolioManagerRef.current.getPortfolio());
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
  };

  const handleSelectProfile = (profile: TradingAgentProtocolProfile) => {
    orchestratorRef.current.setProfile(profile);
    setActiveProfile(profile);
  };

  const handleResetCircuitBreaker = () => {
    orchestratorRef.current.resetCircuitBreaker();
    setIsCircuitTripped(false);
  };

  // Engine Wechseln
  const handleSelectEngine = (engine: EngineType) => {
    engineManagerRef.current.setActiveEngine(engine);
    setActiveEngine(engine);
    setIsEngineModalOpen(false);
  };

  // Quant-Metriken berechnen
  const quantMetrics = useMemo(() => {
    const equityCurve = [
      { time: Date.now() - 3600000, equity: portfolioState.initialBalance, drawdown: 0 },
      { time: Date.now(), equity: portfolioState.equity, drawdown: Math.max(0, portfolioState.initialBalance - portfolioState.equity) },
    ];
    return calculateQuantMetrics(
      portfolioState.initialBalance,
      equityCurve,
      portfolioState.tradeHistory
    );
  }, [portfolioState]);

  const currentHolding = portfolioState.positions[selectedSymbol]?.amount ?? 0;
  const availableEngines = engineManagerRef.current.getAvailableEngines();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-trading-bg">
      {/* Top Navigation & Status */}
      <Header
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        currentPrice={currentPrice}
        change24h={change24h}
        high24h={high24h}
        low24h={low24h}
        portfolio={portfolioState}
        onResetPortfolio={handleResetPortfolio}
        isLive={isLive}
        activeEngine={activeEngine}
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
      />

      {/* Google Cloud IAM Welt-News Bar */}
      <div className="max-w-[1920px] mx-auto w-full px-4 pt-3">
        <WorldNewsBar
          macroNews={macroNews}
          isLoading={isNewsLoading}
          onRefresh={() => fetchWorldNews()}
          onTriggerCrisisSimulation={() => fetchWorldNews({ crisis: true })}
          onResetCrisisSimulation={() => fetchWorldNews({ reset: true })}
        />
      </div>

      {/* NEXUS Sektor-Flotte (5 Branchen-Agenten) */}
      <div className="max-w-[1920px] mx-auto w-full px-4 pt-3">
        <SectorFleetPanel
          sectors={sectorFleet}
          activeSector={activeSector}
          selectedSymbol={selectedSymbol}
          onSelectSector={handleSelectSector}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym);
            const foundAsset = sectorFleet.flatMap((s) => s.universe).find((u) => u.symbol === sym);
            if (foundAsset?.basePrice) {
              setCurrentPrice(foundAsset.basePrice);
            }
          }}
        />
      </div>

      {/* Main Terminal Layout */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full">
        {/* Left / Center Column: Chart, Positions, Quant Metrics, Backtest */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Chart Widget */}
          <ChartWidget
            candles={candles}
            trades={portfolioState.tradeHistory}
            symbol={selectedSymbol}
          />

          {/* NEXUS Trading Agent Orchestrator */}
          <TradingOrchestratorPanel
            activeProfile={activeProfile}
            availableProfiles={orchestratorRef.current.getAvailableProfiles()}
            onSelectProfile={handleSelectProfile}
            isAutoPilot={isOrchestratorAutoPilot}
            onToggleAutoPilot={handleToggleOrchestratorAutoPilot}
            onStepCycle={handleStepOrchestratorCycle}
            latestRecord={latestOrchestratorRecord}
            auditTrail={orchestratorAuditTrail}
            isCircuitTripped={isCircuitTripped}
            onResetCircuitBreaker={handleResetCircuitBreaker}
          />

          {/* Cicero-7Q Decision Inspector */}
          <Cicero7QInspector
            currentRecord={currentCiceroRecord}
            history={ciceroHistory}
            onSelectHistoricalRecord={(rec) => setCurrentCiceroRecord(rec)}
          />

          {/* Quant Metrics Card */}
          <MetricsCard metrics={quantMetrics} title="Live-Simulation Risikokennzahlen" />

          {/* Position & Order Tracker */}
          <PositionTracker
            positions={portfolioState.positions}
            pendingOrders={pendingOrders}
            tradeHistory={portfolioState.tradeHistory}
            onClosePosition={handleClosePosition}
            onCancelOrder={handleCancelOrder}
          />

          {/* Backtest & Overfitting Inspector */}
          <BacktestInspector candles={candles} symbol={selectedSymbol} />
        </div>

        {/* Right Column: Order Placement & Algorithmic Playground */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Birkenbihl Neurodidaktik Playground */}
          <BirkenbihlPlayground
            currentPrice={currentPrice}
            symbol={selectedSymbol}
            cashBalance={portfolioState.cash}
            onExecuteSimulatedTrade={handleBirkenbihlTrade}
          />

          {/* Order Placement Panel */}
          <OrderPanel
            currentPrice={currentPrice}
            symbol={selectedSymbol}
            cashBalance={portfolioState.cash}
            currentHolding={currentHolding}
            onSubmitOrder={handleSubmitOrder}
          />

          {/* Algorithmic Bot Playground */}
          <StrategyPlayground
            activeBot={activeBot}
            onStartBot={handleStartBot}
            onStopBot={handleStopBot}
          />
        </div>
      </main>

      {/* Engine Selector Modal */}
      <EngineSelectorModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        engines={availableEngines}
        activeEngine={activeEngine}
        onSelectEngine={handleSelectEngine}
      />

      {/* Footer Disclaimer & Protocol Integrity */}
      <footer className="bg-trading-surface border-t border-trading-border px-4 py-2.5 text-center text-[11px] text-trading-muted font-mono flex flex-wrap items-center justify-between gap-2">
        <span>MONETARIUM V1.0 • Multi-Engine Trading Terminal (TradingView + CCXT + Alpaca)</span>
        <span>Paper Trading Umgebung: Alle Orders & Kennzahlen werden virtuell ohne Kapitalrisiko berechnet</span>
        <span>Strikte Out-of-Sample Backtesting-Hygiene aktiv</span>
      </footer>
    </div>
  );
}
