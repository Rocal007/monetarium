'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from '../components/terminal/Header';
import { ChartWidget } from '../components/terminal/ChartWidget';
import { OrderPanel } from '../components/terminal/OrderPanel';
import { PositionTracker } from '../components/terminal/PositionTracker';
import { MetricsCard } from '../components/terminal/MetricsCard';
import { StrategyPlayground } from '../components/terminal/StrategyPlayground';
import { BacktestInspector } from '../components/terminal/BacktestInspector';
import { EngineSelectorModal } from '../components/terminal/EngineSelectorModal';
import { TradingOrchestratorPanel } from '../components/terminal/TradingOrchestratorPanel';
import { SearchVisibilityRadar } from '../components/terminal/SearchVisibilityRadar';
import { RiskPositionCalculator } from '../components/terminal/RiskPositionCalculator';
import { WorldNewsBar, NewsProviderType } from '../components/terminal/WorldNewsBar';
import { SectorFleetPanel } from '../components/terminal/SectorFleetPanel';
import { GlobalMarketRadar } from '../components/terminal/GlobalMarketRadar';
import { GlobalMarketScreener } from '../components/terminal/GlobalMarketScreener';
import { MacroHorizonInspector } from '../components/terminal/MacroHorizonInspector';
import { calculateQuantMetrics } from '../lib/analytics/quant-metrics';
import { fetchCryptoTicker, fetchLiveCryptoCandles } from '../lib/data/crypto-feed';
import { generateRealisticCandles } from '../lib/data/mock-feed';
import { fetchGlobalMarketOverview, fetchGlobalMarketScreenerData, resolveGlobalSymbol, loadUniversalCandles } from '../lib/data/global-market-feed';
import { GlobalMarketScreenerData, GlobalMarketState } from '../lib/types/market';
import { PortfolioManager } from '../lib/engine/portfolio-manager';
import { VirtualExchange } from '../lib/engine/virtual-exchange';
import { EngineManager, EngineType } from '../lib/engines/engine-manager';
import { getStrategyExecutor } from '../lib/strategies/strategy-registry';
import { TradingAgentOrchestrator } from '../lib/agents/trading-orchestrator';
import { DEFAULT_PROTOCOL_PROFILE } from '../lib/agents/protocols/presets';
import { OrchestratorCycleRecord, TradingAgentProtocolProfile } from '../lib/agents/protocols/types';
import { MacroSentimentState } from '../lib/types/news';
import { SectorType } from '../lib/types/sectors';
import { getAllSectorAgents, getSectorAgent, getSectorProfile } from '../lib/agents/sectors/sector-fleet';
import { Candle, OrderSide, OrderType, Portfolio, StrategyType, OperatingMode, CopilotProposal, AutopilotStakeConfig, DEFAULT_AUTOPILOT_STAKE } from '../lib/types/trading';
import { dataIntegrityAgent } from '../lib/agents/subagents/data-integrity-agent';
import { DataSentinelModal } from '../components/terminal/DataSentinelModal';
import { DataSentinelOverallState } from '../lib/types/data-integrity';
import { SpeedTraderArcadeModal } from '../components/terminal/SpeedTraderArcadeModal';
import { CryptoAutoInvestModal } from '../components/terminal/CryptoAutoInvestModal';
import { executeCryptoBasket, evaluateAutonomousCryptoDecision } from '../lib/crypto/crypto-allocator';
import { CryptoBasketExecutionResult, CryptoBasketPlan } from '../lib/types/crypto-allocator';
import { generateOmniMarketPlan, executeOmniMarketBasket } from '../lib/engine/omni-market-allocator';

export default function TradingTerminalPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(64500);
  const [change24h, setChange24h] = useState(2.45);
  const [high24h, setHigh24h] = useState(65800);
  const [low24h, setLow24h] = useState(63200);
  const [isLive, setIsLive] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<string>('1h');
  const [chartViewMode, setChartViewMode] = useState<'SPLIT' | 'CHART_ONLY' | 'HORIZON_ONLY'>('SPLIT');

  // Engine Manager State
  const engineManagerRef = useRef<EngineManager>(new EngineManager());
  const [activeEngine, setActiveEngine] = useState<EngineType>('SIMULATED_PAPER');
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);
  const [isArcadeModalOpen, setIsArcadeModalOpen] = useState(false);
  const [isCryptoAutoInvestModalOpen, setIsCryptoAutoInvestModalOpen] = useState(false);

  // Portfolio & Exchange Engines
  const portfolioManagerRef = useRef<PortfolioManager>(new PortfolioManager(10000));
  const virtualExchangeRef = useRef<VirtualExchange>(new VirtualExchange(portfolioManagerRef.current));
  const [portfolioState, setPortfolioState] = useState(portfolioManagerRef.current.getPortfolio());
  const [pendingOrders, setPendingOrders] = useState(virtualExchangeRef.current.getPendingOrders());

  // 0. Portfolio-Synchronisation mit SQLite
  const syncWithServerPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio/state');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.hasPersistedState && json.portfolio) {
          portfolioManagerRef.current.restorePortfolio(json.portfolio);
          setPortfolioState(portfolioManagerRef.current.getPortfolio());
        }
      }
    } catch {
      // Offline- oder Start-Fallback
    }
  };

  const persistServerPortfolio = async (pf: Portfolio) => {
    try {
      await fetch('/api/portfolio/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: pf }),
      });
    } catch {
      // Best-effort Persistence
    }
  };

  useEffect(() => {
    syncWithServerPortfolio();
    const syncInterval = setInterval(syncWithServerPortfolio, 20000);
    return () => clearInterval(syncInterval);
  }, []);

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

  // Grundeinstellungen: PILOT (Vollautomatik) vs. COPILOT (Assistiert mit Freigabe)
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('COPILOT');
  const [pendingProposal, setPendingProposal] = useState<CopilotProposal | null>(null);

  // Gespeicherte Grundeinstellung laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem('monetarium_operating_mode') as OperatingMode | null;
      if (saved === 'PILOT' || saved === 'COPILOT') {
        setOperatingMode(saved);
        orchestratorRef.current.setOperatingMode(saved);
      }
    } catch {
      // Offline- oder Start-Fallback
    }
  }, []);

  const handleToggleOperatingMode = (mode: OperatingMode) => {
    setOperatingMode(mode);
    orchestratorRef.current.setOperatingMode(mode);
    try {
      localStorage.setItem('monetarium_operating_mode', mode);
    } catch {
      // Best-effort Persistence
    }
  };

  // Autopilot Stake / Einsatz-Budget (z.B. 500 € oder benutzerdefiniert)
  const [autopilotStake, setAutopilotStake] = useState<AutopilotStakeConfig>(DEFAULT_AUTOPILOT_STAKE);

  // Gespeicherten Autopilot-Einsatz laden
  useEffect(() => {
    try {
      const savedStake = localStorage.getItem('monetarium_autopilot_stake');
      if (savedStake) {
        const parsed = JSON.parse(savedStake) as AutopilotStakeConfig;
        if (parsed && parsed.stakeType && typeof parsed.stakeValue === 'number') {
          setAutopilotStake(parsed);
          orchestratorRef.current.setAutopilotStakeConfig(parsed);
        }
      }
    } catch {
      // Offline-Fallback
    }
  }, []);

  const handleChangeAutopilotStake = (config: AutopilotStakeConfig) => {
    setAutopilotStake(config);
    orchestratorRef.current.setAutopilotStakeConfig(config);
    try {
      localStorage.setItem('monetarium_autopilot_stake', JSON.stringify(config));
    } catch {
      // Best-effort
    }
  };

  const handleApproveProposal = (prop: CopilotProposal) => {
    try {
      orchestratorRef.current.approvePendingProposal(currentPrice);
      setPendingProposal(null);
      const updated = portfolioManagerRef.current.getPortfolio();
      setPortfolioState(updated);
      setPendingOrders(virtualExchangeRef.current.getPendingOrders());
      persistServerPortfolio(updated);
      setOrchestratorAuditTrail(orchestratorRef.current.getAuditTrail());
    } catch (err) {
      console.error('Fehler bei Freigabe:', err);
    }
  };

  const handleRejectProposal = (prop: CopilotProposal) => {
    orchestratorRef.current.rejectPendingProposal();
    setPendingProposal(null);
  };

  // Data Sentinel Agent State (D_real Real-Data Stream Officer)
  const [dataSentinelState, setDataSentinelState] = useState<DataSentinelOverallState>(() => dataIntegrityAgent.getTelemetry());
  const [isDataSentinelModalOpen, setIsDataSentinelModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = dataIntegrityAgent.subscribe((state) => {
      setDataSentinelState({ ...state });
    });
    return () => unsubscribe();
  }, []);

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

  // Gesamtbörsenmarkt-Radar State (Weltmarkt-Indizes, VIX, Zinsen, Rohstoffe)
  const [globalMarketState, setGlobalMarketState] = useState<GlobalMarketState>(() => fetchGlobalMarketOverview());
  const [screenerData, setScreenerData] = useState<GlobalMarketScreenerData>(() => fetchGlobalMarketScreenerData());

  const handleSelectUniversalSymbol = (sym: string) => {
    const resolved = resolveGlobalSymbol(sym);
    setSelectedSymbol(resolved.symbol);
    setCurrentPrice(resolved.basePrice);
  };

  // Makro-News & Wirtschaftskalender State (GCP vs. Forex Factory)
  const [newsProvider, setNewsProvider] = useState<NewsProviderType>('FOREX_FACTORY');
  const [macroNews, setMacroNews] = useState<MacroSentimentState | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);

  // Weltnachrichten / Kalender abrufen
  const fetchWorldNews = useCallback(async (
    params: { crisis?: boolean; reset?: boolean; provider?: NewsProviderType } = {}
  ) => {
    try {
      setIsNewsLoading(true);
      const activeProv = params.provider ?? newsProvider;
      const queryParts: string[] = [];

      if (params.crisis) queryParts.push('crisis=true');
      if (params.reset) queryParts.push('reset=true');
      if (activeProv === 'FOREX_FACTORY') queryParts.push('provider=forexfactory');
      else queryParts.push('provider=gcp');

      const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await fetch(`/api/news/world${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMacroNews(json.data);
          if (json.data.crisisActive || json.data.isBlackoutActive) {
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
  }, [newsProvider]);

  useEffect(() => {
    fetchWorldNews();
    const newsTimer = setInterval(() => {
      fetchWorldNews();
    }, 45000);

    const marketTimer = setInterval(() => {
      setGlobalMarketState(fetchGlobalMarketOverview());
      setScreenerData(fetchGlobalMarketScreenerData());
    }, 30000);

    return () => {
      clearInterval(newsTimer);
      clearInterval(marketTimer);
    };
  }, [fetchWorldNews]);

  // 1. Symbol-Daten laden (unterstützt Krypto, CCXT, Alpaca und weltweites Universum)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const verified = await dataIntegrityAgent.fetchVerifiedSymbolData(selectedSymbol, chartTimeframe, 100);
        if (isMounted && verified.candles.length > 0) {
          setCandles(verified.candles);
          setCurrentPrice(verified.currentPrice);
          setChange24h(verified.change24h);
          setHigh24h(verified.high24h);
          setLow24h(verified.low24h);
          setIsLive(verified.isLive);
          portfolioManagerRef.current.updateMarketPrice(selectedSymbol, verified.currentPrice);
          setPortfolioState(portfolioManagerRef.current.getPortfolio());
        }
      } catch (err) {
        console.error('Data Sentinel Ladefehler:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, activeEngine, chartTimeframe]);

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
          const strat = getStrategyExecutor(activeBot);

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
              if (operatingMode === 'COPILOT') {
                const prop: CopilotProposal = {
                  id: `prop-bot-${Date.now()}`,
                  timestamp: Date.now(),
                  symbol: selectedSymbol,
                  side: signal.action,
                  type: 'MARKET',
                  amount: Number(amount.toFixed(4)),
                  expectedPrice: newClose,
                  confluenceScore: signal.confidence ?? 75,
                  strategyUsed: activeBot,
                  rationale: signal.reason || `Signal von ${activeBot}-Strategie generiert.`,
                  source: 'CLASSIC_BOT',
                  status: 'PENDING',
                };
                setPendingProposal(prop);
                orchestratorRef.current.setPendingProposal(prop);
              } else {
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
        }

        // NEXUS Trading Agent Orchestrator Takt
        if (orchestratorRef.current.isAutoPilotActive()) {
          const rec = orchestratorRef.current.executeCycle(
            selectedSymbol,
            newClose,
            newCandles,
            portfolioManagerRef.current.getPortfolio(),
            macroNews,
            globalMarketState
          );
          setLatestOrchestratorRecord(rec);
          setOrchestratorAuditTrail(orchestratorRef.current.getAuditTrail());
          if (rec.execution.status === 'PENDING_APPROVAL' && rec.execution.proposal) {
            setPendingProposal(rec.execution.proposal);
          }
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
  }, [selectedSymbol, activeBot, isOrchestratorAutoPilot, activeEngine, macroNews, globalMarketState, operatingMode]);


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

    const updated = portfolioManagerRef.current.getPortfolio();
    setPortfolioState(updated);
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
    persistServerPortfolio(updated);
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
      const updated = portfolioManagerRef.current.getPortfolio();
      setPortfolioState(updated);
      persistServerPortfolio(updated);
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

    // Mit SQLite synchronisieren
    fetch('/api/portfolio/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true, initialCapital: 10000 }),
    }).catch(() => {});
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
      macroNews,
      globalMarketState
    );
    setLatestOrchestratorRecord(rec);
    setOrchestratorAuditTrail(orchestratorRef.current.getAuditTrail());
    if (rec.execution.status === 'PENDING_APPROVAL' && rec.execution.proposal) {
      setPendingProposal(rec.execution.proposal);
    }
    setIsCircuitTripped(orchestratorRef.current.isCircuitTripped());
    setPortfolioState(portfolioManagerRef.current.getPortfolio());
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
  };

  // Risk & Position Calculator Trade Handler (Kelly & CRV-Modellierung)
  const handleRiskPositionTrade = (params: {
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

    const updated = portfolioManagerRef.current.getPortfolio();
    setPortfolioState(updated);
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
    persistServerPortfolio(updated);
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
    if (engine === 'SPEED_TRADER_ARCADE') {
      setIsArcadeModalOpen(true);
    }
  };

  // Krypto Auto-Invest & Basket-Ausführung
  const handleExecuteCryptoBasket = async (plan: CryptoBasketPlan): Promise<CryptoBasketExecutionResult> => {
    const result = executeCryptoBasket(plan, virtualExchangeRef.current);
    
    // Portfolio & Pending Orders aktualisieren und mit Server synchronisieren
    const updated = portfolioManagerRef.current.getPortfolio();
    setPortfolioState(updated);
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
    await persistServerPortfolio(updated);

    return {
      ...result,
      portfolioCashRemaining: updated.cash,
      portfolioEquity: updated.equity,
    };
  };

  // Vollautonome Krypto-Investition (App übernimmt die komplette Auswahl & Ausführung)
  const handleExecuteAutonomousCrypto = async (budget?: number): Promise<CryptoBasketExecutionResult> => {
    const vixPrice = globalMarketState?.vixLevel ?? 16.5;
    const isRiskOff = globalMarketState?.riskRegime === 'RISK_OFF' || !!macroNews?.crisisActive;
    const { plan } = evaluateAutonomousCryptoDecision({
      availableCash: portfolioState.cash,
      vixPrice,
      macroRegime: isRiskOff ? 'RISK_OFF' : 'RISK_ON',
      customBudget: budget,
    });
    return handleExecuteCryptoBasket(plan);
  };

  // Omni-Market & Sektor-Flotten Allokations-Ausführung (20 Assets über alle Weltmärkte & Sektoren)
  const handleExecuteOmniMarketInvestment = async () => {
    const plan = generateOmniMarketPlan({
      availableCash: portfolioState.cash,
      targetBudgetPercent: 80,
    });
    executeOmniMarketBasket(plan, virtualExchangeRef.current);
    const updated = portfolioManagerRef.current.getPortfolio();
    setPortfolioState(updated);
    setPendingOrders(virtualExchangeRef.current.getPendingOrders());
    await persistServerPortfolio(updated);
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
    <div className="flex-1 flex flex-col min-h-screen bg-trading-bg w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Navigation & Status */}
      <Header
        selectedSymbol={selectedSymbol}
        onSelectSymbol={handleSelectUniversalSymbol}
        currentPrice={currentPrice}
        change24h={change24h}
        high24h={high24h}
        low24h={low24h}
        portfolio={portfolioState}
        onResetPortfolio={handleResetPortfolio}
        isLive={isLive}
        activeEngine={activeEngine}
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
        dataSentinelState={dataSentinelState}
        onOpenDataSentinelModal={() => setIsDataSentinelModalOpen(true)}
        onOpenArcadeModal={() => setIsArcadeModalOpen(true)}
        onOpenCryptoAutoInvestModal={() => setIsCryptoAutoInvestModalOpen(true)}
        operatingMode={operatingMode}
        onToggleOperatingMode={handleToggleOperatingMode}
        pendingProposalCount={pendingProposal ? 1 : 0}
      />

      {/* GESAMTBÖRSENMARKT-RADAR (Global Intermarket Watch) */}
      <div className="max-w-[1920px] mx-auto w-full px-2 sm:px-4 pt-3 min-w-0">
        <GlobalMarketRadar
          globalMarket={globalMarketState}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={handleSelectUniversalSymbol}
          onRefresh={() => setGlobalMarketState(fetchGlobalMarketOverview())}
        />
      </div>

      {/* GESAMTBÖRSENMARKT-SCREENER (Live Movers & 11 GICS Sektoren) */}
      <div className="max-w-[1920px] mx-auto w-full px-2 sm:px-4 pt-3 min-w-0">
        <GlobalMarketScreener
          screenerData={screenerData}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={handleSelectUniversalSymbol}
          defaultExpanded={true}
        />
      </div>

      {/* Makro-News & Forex Factory Kalender Bar */}
      <div className="max-w-[1920px] mx-auto w-full px-2 sm:px-4 pt-3 min-w-0">
        <WorldNewsBar
          macroNews={macroNews}
          isLoading={isNewsLoading}
          activeProviderType={newsProvider}
          onSelectProvider={(prov) => {
            setNewsProvider(prov);
            fetchWorldNews({ provider: prov });
          }}
          onRefresh={() => fetchWorldNews()}
          onTriggerCrisisSimulation={() => fetchWorldNews({ crisis: true })}
          onResetCrisisSimulation={() => fetchWorldNews({ reset: true })}
        />
      </div>

      {/* NEXUS Sektor-Flotte (5 Branchen-Agenten) */}
      <div className="max-w-[1920px] mx-auto w-full px-2 sm:px-4 pt-3 min-w-0">
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
          onExecuteOmniMarketInvestment={handleExecuteOmniMarketInvestment}
        />
      </div>

      {/* Main Terminal Layout */}
      <main className="flex-1 p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full min-w-0">
        {/* Left / Center Column: Chart, Positions, Quant Metrics, Backtest */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0 w-full">
          {/* Ansichten-Umschalter: Kombi vs. Nur Chart vs. Nur Zeithorizonte */}
          <div className="flex flex-wrap items-center justify-between bg-trading-surface border border-trading-border rounded-xl px-3 py-2 gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-trading-muted text-[11px]">Ansichtsmodus:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedSymbol}
              </span>
            </div>
            <div className="flex bg-trading-bg rounded-lg border border-trading-border p-0.5 text-xs font-mono">
              <button
                onClick={() => setChartViewMode('SPLIT')}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  chartViewMode === 'SPLIT'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold shadow-sm border border-emerald-500/30'
                    : 'text-trading-muted hover:text-white'
                }`}
              >
                Kombi (Chart & Horizonte)
              </button>
              <button
                onClick={() => setChartViewMode('CHART_ONLY')}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  chartViewMode === 'CHART_ONLY'
                    ? 'bg-trading-card text-trading-accent font-bold shadow-sm'
                    : 'text-trading-muted hover:text-white'
                }`}
              >
                Nur Chart
              </button>
              <button
                onClick={() => setChartViewMode('HORIZON_ONLY')}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  chartViewMode === 'HORIZON_ONLY'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold shadow-sm border border-emerald-500/30'
                    : 'text-trading-muted hover:text-white'
                }`}
              >
                Nur Zeithorizonte (W/M/Q/1J/5J/10J)
              </button>
            </div>
          </div>

          {/* Chart Widget */}
          {chartViewMode !== 'HORIZON_ONLY' && (
            <ChartWidget
              candles={candles}
              trades={portfolioState.tradeHistory}
              symbol={selectedSymbol}
              timeframe={chartTimeframe}
              onTimeframeChange={(tf) => setChartTimeframe(tf)}
            />
          )}

          {/* Multi-Perioden & Zeithorizont-Inspektor (Woche, Monat, Quartal, Jahr, 5 Jahre, 10 Jahre) */}
          {chartViewMode !== 'CHART_ONLY' && (
            <MacroHorizonInspector
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              candles={candles}
              activeTimeframe={chartTimeframe}
              onSelectTimeframe={(tf) => setChartTimeframe(tf)}
            />
          )}

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
            operatingMode={operatingMode}
            onToggleOperatingMode={handleToggleOperatingMode}
            pendingProposal={pendingProposal}
            onApproveProposal={handleApproveProposal}
            onRejectProposal={handleRejectProposal}
            autopilotStake={autopilotStake}
            onChangeAutopilotStake={handleChangeAutopilotStake}
            currentPrice={currentPrice}
            availableCash={portfolioState.cash}
            symbol={selectedSymbol}
          />

          {/* Search Visibility & Attention Radar */}
          <SearchVisibilityRadar
            symbol={selectedSymbol}
            currentPrice={currentPrice}
            candles={candles}
          />

          {/* Position & Order Tracker */}
          <PositionTracker
            positions={portfolioState.positions}
            pendingOrders={pendingOrders}
            tradeHistory={portfolioState.tradeHistory}
            onClosePosition={handleClosePosition}
            onCancelOrder={handleCancelOrder}
          />

          {/* Quant Metrics Card */}
          <MetricsCard metrics={quantMetrics} title="Live-Simulation Risikokennzahlen" />

          {/* Backtest & Overfitting Inspector */}
          <BacktestInspector candles={candles} symbol={selectedSymbol} />
        </div>

        {/* Right Column: Order Placement & Algorithmic Playground */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0 w-full">
          {/* Risk & Position Sizing Calculator */}
          <RiskPositionCalculator
            currentPrice={currentPrice}
            symbol={selectedSymbol}
            cashBalance={portfolioState.cash}
            onExecuteSimulatedTrade={handleRiskPositionTrade}
          />

          {/* Order Placement Panel */}
          <OrderPanel
            currentPrice={currentPrice}
            symbol={selectedSymbol}
            cashBalance={portfolioState.cash}
            currentHolding={currentHolding}
            onSubmitOrder={handleSubmitOrder}
            onOpenCryptoAutoInvest={() => setIsCryptoAutoInvestModalOpen(true)}
            onExecuteAutonomousBasket={handleExecuteAutonomousCrypto}
            pendingProposal={pendingProposal}
            operatingMode={operatingMode}
            vixPrice={globalMarketState?.vixLevel ?? 16.5}
            macroRegime={globalMarketState?.riskRegime === 'RISK_OFF' || !!macroNews?.crisisActive ? 'RISK_OFF' : 'RISK_ON'}
          />

          {/* Algorithmic Bot Playground */}
          <StrategyPlayground
            activeBot={activeBot}
            onStartBot={handleStartBot}
            onStopBot={handleStopBot}
          />
        </div>
      </main>


      {/* Engine Selector & External Connections Modal */}
      <EngineSelectorModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        engines={availableEngines}
        activeEngine={activeEngine}
        onSelectEngine={handleSelectEngine}
        engineManager={engineManagerRef.current}
      />

      {/* Data Sentinel Real-Data Stream & Diagnostic Modal */}
      <DataSentinelModal
        isOpen={isDataSentinelModalOpen}
        onClose={() => setIsDataSentinelModalOpen(false)}
        telemetry={dataSentinelState}
        onRunDiagnostics={async () => {
          await dataIntegrityAgent.pingAllProviders();
        }}
      />

      {/* Speed-Trader Arcade & Market Game Modal */}
      {isArcadeModalOpen && (
        <SpeedTraderArcadeModal
          isOpen={isArcadeModalOpen}
          onClose={() => setIsArcadeModalOpen(false)}
        />
      )}

      {/* Krypto Auto-Invest & Robo-Advisor Modal */}
      <CryptoAutoInvestModal
        isOpen={isCryptoAutoInvestModalOpen}
        onClose={() => setIsCryptoAutoInvestModalOpen(false)}
        availableCash={portfolioState.cash}
        onExecuteBasket={handleExecuteCryptoBasket}
        onSelectSymbol={handleSelectUniversalSymbol}
        vixPrice={globalMarketState?.vixLevel ?? 16.5}
        macroRegime={globalMarketState?.riskRegime === 'RISK_OFF' || !!macroNews?.crisisActive ? 'RISK_OFF' : 'RISK_ON'}
      />

      {/* Footer Disclaimer & Protocol Integrity */}
      <footer className="bg-trading-surface border-t border-trading-border px-3 sm:px-4 py-3 text-[11px] text-trading-muted font-mono flex flex-col gap-1.5 max-w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-white">MONETARIUM V1.0 • Institutional Quant Terminal</span>
          <span>Status: SQLite-Persistenz aktiv • Out-of-Sample Backtesting-Hygiene</span>
          <span>Routing: CCXT / Alpaca / Paper Engine</span>
        </div>
        <div className="text-[10px] text-slate-500 border-t border-trading-border/30 pt-1.5">
          <span className="font-semibold text-amber-500/80 uppercase mr-1">Risikohinweis:</span>
          Monetarium dient primär als algorithmische Simulations- und Research-Umgebung. Der Handel mit Hebelprodukten, Aktien und Krypto-Assets birgt hohe Verlustrisiken bis hin zum Totalverlust. Historische Backtests, Kennzahlen (Sharpe/Sortino) und Modell-Projektionen stellen keine Garantie oder verlässliche Zusicherung künftiger Gewinne dar.
        </div>
      </footer>
    </div>
  );
}
