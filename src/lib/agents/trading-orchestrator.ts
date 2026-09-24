import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { IOrderExecutor, VirtualOrderExecutor } from '../engine/order-router';
import { Candle, Portfolio, OperatingMode, CopilotProposal, AutopilotStakeConfig, DEFAULT_AUTOPILOT_STAKE } from '../types/trading';
import { DEFAULT_PROTOCOL_PROFILE, PROTOCOL_PRESETS } from './protocols/presets';
import {
  ExecutionDecision,
  OrchestratorCycleRecord,
  TradingAgentProtocolProfile,
} from './protocols/types';
import { AlphaStrategyAgent } from './subagents/alpha-strategy-agent';
import { ExecutionAgent } from './subagents/execution-agent';
import { MarketIntelligenceAgent } from './subagents/market-intelligence-agent';
import { QuantEvaluatorAgent } from './subagents/quant-evaluator-agent';
import { RiskGuardianAgent } from './subagents/risk-guardian-agent';
import { MacroSentimentState } from '../types/news';
import { GlobalMarketState } from '../types/market';
import { SearchVisibilityEngine } from '../analytics/search-visibility-engine';

export class TradingAgentOrchestrator {
  private activeProfile: TradingAgentProtocolProfile;
  private orderExecutor: IOrderExecutor | VirtualExchange;
  private virtualExchange: VirtualExchange | null = null;
  private cycleIndex: number = 0;
  private isRunning: boolean = false;
  private isCircuitBreakerTripped: boolean = false;
  private consecutiveLosses: number = 0;
  private auditTrail: OrchestratorCycleRecord[] = [];
  private latestRecord: OrchestratorCycleRecord | null = null;
  private lastTradeCount: number = 0;
  private operatingMode: OperatingMode = 'COPILOT';
  private pendingProposal: CopilotProposal | null = null;
  private autopilotStake: AutopilotStakeConfig = DEFAULT_AUTOPILOT_STAKE;

  constructor(
    executor: VirtualExchange | IOrderExecutor,
    initialProfile: TradingAgentProtocolProfile = DEFAULT_PROTOCOL_PROFILE
  ) {
    this.orderExecutor = executor;
    if (executor instanceof VirtualExchange) {
      this.virtualExchange = executor;
    } else if ('getVirtualExchange' in executor && typeof (executor as any).getVirtualExchange === 'function') {
      this.virtualExchange = (executor as any).getVirtualExchange();
    }
    this.activeProfile = initialProfile;
  }

  public setVirtualExchange(virtualExchange: VirtualExchange): void {
    this.virtualExchange = virtualExchange;
    this.orderExecutor = virtualExchange;
  }

  public setOrderExecutor(executor: IOrderExecutor | VirtualExchange): void {
    this.orderExecutor = executor;
    if (executor instanceof VirtualExchange) {
      this.virtualExchange = executor;
    }
  }

  public getOrderExecutor(): IOrderExecutor | VirtualExchange {
    return this.orderExecutor;
  }

  public setProfile(profile: TradingAgentProtocolProfile): void {
    this.activeProfile = profile;
  }

  public getProfile(): TradingAgentProtocolProfile {
    return this.activeProfile;
  }

  public getAvailableProfiles(): TradingAgentProtocolProfile[] {
    return Object.values(PROTOCOL_PRESETS);
  }

  public getOperatingMode(): OperatingMode {
    return this.operatingMode;
  }

  public setOperatingMode(mode: OperatingMode): void {
    this.operatingMode = mode;
  }

  public getPendingProposal(): CopilotProposal | null {
    return this.pendingProposal;
  }

  public setPendingProposal(proposal: CopilotProposal | null): void {
    this.pendingProposal = proposal;
  }

  public getAutopilotStakeConfig(): AutopilotStakeConfig {
    return this.autopilotStake;
  }

  public setAutopilotStakeConfig(config: AutopilotStakeConfig): void {
    this.autopilotStake = config;
  }


  /**
   * Bestätigt den anstehenden Copilot-Vorschlag und führt die Order aus
   */
  public approvePendingProposal(currentPrice: number): ExecutionDecision | null {
    if (!this.pendingProposal) return null;
    const proposal = this.pendingProposal;
    proposal.status = 'APPROVED';
    const decision = ExecutionAgent.executeApprovedProposal(
      proposal,
      currentPrice,
      this.orderExecutor
    );
    this.pendingProposal = null;
    return decision;
  }

  /**
   * Verwirft den anstehenden Copilot-Vorschlag
   */
  public rejectPendingProposal(reason?: string): void {
    if (this.pendingProposal) {
      this.pendingProposal.status = 'REJECTED';
      this.pendingProposal = null;
    }
  }

  public isAutoPilotActive(): boolean {
    return this.isRunning;
  }

  public setAutoPilot(active: boolean): void {
    this.isRunning = active;
  }

  public isCircuitTripped(): boolean {
    return this.isCircuitBreakerTripped;
  }

  public resetCircuitBreaker(): void {
    this.isCircuitBreakerTripped = false;
    this.consecutiveLosses = 0;
  }

  public getAuditTrail(): OrchestratorCycleRecord[] {
    return [...this.auditTrail];
  }

  public getLatestRecord(): OrchestratorCycleRecord | null {
    return this.latestRecord;
  }


  /**
   * Führt einen atomaren NEXUS-Trading-Zyklus synchron/isomorph durch:
   * T = C ∘ P_J ∘ D_L ∘ F
   */
  public executeCycle(
    symbol: string,
    currentPrice: number,
    candles: Candle[],
    portfolio: Portfolio,
    macroNews?: MacroSentimentState | null,
    globalMarket?: GlobalMarketState | null
  ): OrchestratorCycleRecord {
    this.cycleIndex++;
    const timestamp = Date.now();

    // Trades auf Verlustserie prüfen
    if (portfolio.tradeHistory.length > this.lastTradeCount) {
      const newTrades = portfolio.tradeHistory.slice(this.lastTradeCount);
      for (const t of newTrades) {
        if (t.pnl !== undefined) {
          if (t.pnl < 0) {
            this.consecutiveLosses++;
          } else if (t.pnl > 0) {
            this.consecutiveLosses = 0;
          }
        }
      }
      this.lastTradeCount = portfolio.tradeHistory.length;
    }

    // 1. Perception Scout (Markt-Intelligenz, Regime & Gesamtbörsenmarkt-Konfluenz)
    const perception = MarketIntelligenceAgent.analyze(
      candles,
      this.activeProfile.marketIntelligence,
      globalMarket
    );

    // Makro-News & Welt-Sentiment anreichern
    if (macroNews) {
      perception.macroSentiment = macroNews.overallSentiment;
      perception.macroSentimentScore = macroNews.sentimentScore;
      perception.latestBreakingNews = macroNews.crisisActive ? macroNews.crisisReason : macroNews.articles[0]?.title;
      perception.crisisVetoActive = macroNews.crisisActive;
    }

    // Search Visibility & Google Trends Alpha anreichern
    const searchMetrics = SearchVisibilityEngine.getMetrics(symbol, currentPrice, candles);
    perception.searchVisibility = {
      svi: searchMetrics.svi,
      delta24h: searchMetrics.delta24h,
      regime: searchMetrics.regime,
      confidenceModifier: searchMetrics.confidenceModifier,
      retailEuphoriaScore: searchMetrics.retailEuphoriaScore,
    };

    // 2. Alpha Generator (Hypothesen-Generierung F(X))
    const hypothesis = AlphaStrategyAgent.evaluate(
      symbol,
      currentPrice,
      perception,
      portfolio,
      this.activeProfile.alphaStrategy
    );

    // 3. Risk Guardian (Judikative Proof-Validator P_J mit Autopilot-Einsatz)
    const riskProtocol = {
      ...this.activeProfile.riskGuardian,
      customStake: this.autopilotStake,
    };

    const riskProof = RiskGuardianAgent.validate(
      hypothesis,
      portfolio,
      currentPrice,
      riskProtocol,
      this.consecutiveLosses
    );


    // Search-Euphorie-Schutz: Veto gegen Long-Einstiege bei Retail-FOMO Peak
    if (hypothesis.action === 'BUY' && searchMetrics.regime === 'EUPHORIA_OVERHEATED' && searchMetrics.retailEuphoriaScore >= 90) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.vetoReason = `Judikatives Veto (Search Euphorie Peak): Google Trends SVI bei ${searchMetrics.svi} (Retail-Euphorie ${searchMetrics.retailEuphoriaScore}%). Veto gegen Long-Käufe im Peak.`;
      if (riskProof.invariantsChecked) {
        riskProof.invariantsChecked.searchEuphoriaOk = false;
      }
    } else if (riskProof.invariantsChecked) {
      riskProof.invariantsChecked.searchEuphoriaOk = true;
    }

    // Judikative Notbremse bei Makro-Krisenmeldung oder Forex Factory News-Blackout
    if (macroNews?.isBlackoutActive) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.circuitBreakerActive = true;
      riskProof.proofScore = 0;
      riskProof.vetoReason = `Judikatives Veto (News-Blackout): ${macroNews.blackoutReason || 'Forex Factory High-Impact Event blockiert Orderausführung'}`;
      if (riskProof.invariantsChecked) {
        riskProof.invariantsChecked.macroNewsOk = false;
      }
      this.isCircuitBreakerTripped = true;
      this.isRunning = false;
    } else if (macroNews?.crisisActive) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.circuitBreakerActive = true;
      riskProof.proofScore = 0;
      riskProof.vetoReason = `Judikatives Veto (Makro-Schock): ${macroNews.crisisReason || 'Akute Krisenmeldung blockiert Käufe'}`;
      if (riskProof.invariantsChecked) {
        riskProof.invariantsChecked.macroNewsOk = false;
      }
      this.isCircuitBreakerTripped = true;
      this.isRunning = false;
    } else if (riskProof.invariantsChecked) {
      riskProof.invariantsChecked.macroNewsOk = true;
    }

    if (riskProof.circuitBreakerActive) {
      this.isCircuitBreakerTripped = true;
      this.isRunning = false; // Auto-Pilot anhalten
    }

    // 4. Execution Officer (Routing & Exchange)
    const execution = ExecutionAgent.execute(
      hypothesis,
      riskProof,
      currentPrice,
      this.activeProfile.executionRouting,
      this.orderExecutor,
      this.operatingMode
    );

    if (execution.status === 'PENDING_APPROVAL' && execution.proposal) {
      this.pendingProposal = execution.proposal;
    }

    // 5. Quant Evaluator (Cache C & Fixpunkt-Tracking)
    const telemetry = QuantEvaluatorAgent.evaluate(
      portfolio,
      currentPrice,
      perception.regime,
      this.cycleIndex,
      this.activeProfile.quantEvaluator
    );

    const record: OrchestratorCycleRecord = {
      id: `cyc-${this.cycleIndex}-${timestamp}`,
      cycleIndex: this.cycleIndex,
      timestamp,
      symbol,
      price: currentPrice,
      profileId: this.activeProfile.id,
      perception,
      hypothesis,
      riskProof,
      execution,
      telemetry,
    };

    this.latestRecord = record;
    this.auditTrail.unshift(record);
    if (this.auditTrail.length > 50) {
      this.auditTrail.pop();
    }

    return record;
  }

  /**
   * Vollständig asynchrone Variante für den 24/7 Headless-Daemon
   */
  public async executeCycleAsync(
    symbol: string,
    currentPrice: number,
    candles: Candle[],
    portfolio: Portfolio,
    macroNews?: MacroSentimentState | null
  ): Promise<OrchestratorCycleRecord> {
    this.cycleIndex++;
    const timestamp = Date.now();

    if (portfolio.tradeHistory.length > this.lastTradeCount) {
      const newTrades = portfolio.tradeHistory.slice(this.lastTradeCount);
      for (const t of newTrades) {
        if (t.pnl !== undefined) {
          if (t.pnl < 0) {
            this.consecutiveLosses++;
          } else if (t.pnl > 0) {
            this.consecutiveLosses = 0;
          }
        }
      }
      this.lastTradeCount = portfolio.tradeHistory.length;
    }

    // 1. Perception Scout
    const perception = MarketIntelligenceAgent.analyze(
      candles,
      this.activeProfile.marketIntelligence
    );

    if (macroNews) {
      perception.macroSentiment = macroNews.overallSentiment;
      perception.macroSentimentScore = macroNews.sentimentScore;
      perception.latestBreakingNews = macroNews.crisisActive ? macroNews.crisisReason : macroNews.articles[0]?.title;
      perception.crisisVetoActive = macroNews.crisisActive;
    }

    // Search Visibility & Google Trends Alpha anreichern
    const searchMetrics = SearchVisibilityEngine.getMetrics(symbol, currentPrice, candles);
    perception.searchVisibility = {
      svi: searchMetrics.svi,
      delta24h: searchMetrics.delta24h,
      regime: searchMetrics.regime,
      confidenceModifier: searchMetrics.confidenceModifier,
      retailEuphoriaScore: searchMetrics.retailEuphoriaScore,
    };

    // 2. Alpha Generator
    const hypothesis = AlphaStrategyAgent.evaluate(
      symbol,
      currentPrice,
      perception,
      portfolio,
      this.activeProfile.alphaStrategy
    );

    // 3. Risk Guardian (Judikative Proof-Validator P_J mit Autopilot-Einsatz)
    const riskProtocolAsync = {
      ...this.activeProfile.riskGuardian,
      customStake: this.autopilotStake,
    };

    const riskProof = RiskGuardianAgent.validate(
      hypothesis,
      portfolio,
      currentPrice,
      riskProtocolAsync,
      this.consecutiveLosses
    );


    // Search-Euphorie-Schutz: Veto gegen Long-Einstiege bei Retail-FOMO Peak
    if (hypothesis.action === 'BUY' && searchMetrics.regime === 'EUPHORIA_OVERHEATED' && searchMetrics.retailEuphoriaScore >= 90) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.vetoReason = `Judikatives Veto (Search Euphorie Peak): Google Trends SVI bei ${searchMetrics.svi} (Retail-Euphorie ${searchMetrics.retailEuphoriaScore}%). Veto gegen Long-Käufe im Peak.`;
      if (riskProof.invariantsChecked) {
        riskProof.invariantsChecked.searchEuphoriaOk = false;
      }
    } else if (riskProof.invariantsChecked) {
      riskProof.invariantsChecked.searchEuphoriaOk = true;
    }

    if (macroNews?.isBlackoutActive) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.circuitBreakerActive = true;
      riskProof.proofScore = 0;
      riskProof.vetoReason = `Judikatives Veto (News-Blackout): ${macroNews.blackoutReason || 'Forex Factory High-Impact Event'}`;
      this.isCircuitBreakerTripped = true;
      this.isRunning = false;
    } else if (macroNews?.crisisActive) {
      riskProof.passed = false;
      riskProof.approvedAmount = 0;
      riskProof.circuitBreakerActive = true;
      riskProof.proofScore = 0;
      riskProof.vetoReason = `Judikatives Veto (Makro-Schock): ${macroNews.crisisReason || 'Akute Krise'}`;
      this.isCircuitBreakerTripped = true;
      this.isRunning = false;
    }

    if (riskProof.circuitBreakerActive) {
      this.isCircuitBreakerTripped = true;
      this.isRunning = false;
    }

    // 4. Execution Officer (Asynchrones Routing)
    const execution = await ExecutionAgent.executeAsync(
      hypothesis,
      riskProof,
      currentPrice,
      this.activeProfile.executionRouting,
      this.orderExecutor,
      this.operatingMode
    );

    if (execution.status === 'PENDING_APPROVAL' && execution.proposal) {
      this.pendingProposal = execution.proposal;
    }

    // 5. Quant Evaluator
    const telemetry = QuantEvaluatorAgent.evaluate(
      portfolio,
      currentPrice,
      perception.regime,
      this.cycleIndex,
      this.activeProfile.quantEvaluator
    );

    const record: OrchestratorCycleRecord = {
      id: `cyc-${this.cycleIndex}-${timestamp}`,
      cycleIndex: this.cycleIndex,
      timestamp,
      symbol,
      price: currentPrice,
      profileId: this.activeProfile.id,
      perception,
      hypothesis,
      riskProof,
      execution,
      telemetry,
    };

    this.latestRecord = record;
    this.auditTrail.unshift(record);
    if (this.auditTrail.length > 50) {
      this.auditTrail.pop();
    }

    return record;
  }
}
