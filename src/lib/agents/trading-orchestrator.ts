import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { Candle, Portfolio } from '../types/trading';
import { DEFAULT_PROTOCOL_PROFILE, PROTOCOL_PRESETS } from './protocols/presets';
import {
  OrchestratorCycleRecord,
  TradingAgentProtocolProfile,
} from './protocols/types';
import { AlphaStrategyAgent } from './subagents/alpha-strategy-agent';
import { ExecutionAgent } from './subagents/execution-agent';
import { MarketIntelligenceAgent } from './subagents/market-intelligence-agent';
import { QuantEvaluatorAgent } from './subagents/quant-evaluator-agent';
import { RiskGuardianAgent } from './subagents/risk-guardian-agent';
import { MacroSentimentState } from '../types/news';

export class TradingAgentOrchestrator {
  private activeProfile: TradingAgentProtocolProfile;
  private virtualExchange: VirtualExchange;
  private cycleIndex: number = 0;
  private isRunning: boolean = false;
  private isCircuitBreakerTripped: boolean = false;
  private consecutiveLosses: number = 0;
  private auditTrail: OrchestratorCycleRecord[] = [];
  private latestRecord: OrchestratorCycleRecord | null = null;
  private lastTradeCount: number = 0;

  constructor(
    virtualExchange: VirtualExchange,
    initialProfile: TradingAgentProtocolProfile = DEFAULT_PROTOCOL_PROFILE
  ) {
    this.virtualExchange = virtualExchange;
    this.activeProfile = initialProfile;
  }

  public setVirtualExchange(virtualExchange: VirtualExchange): void {
    this.virtualExchange = virtualExchange;
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
   * Führt einen atomaren NEXUS-Trading-Zyklus durch:
   * T = C ∘ P_J ∘ D_L ∘ F
   */
  public executeCycle(
    symbol: string,
    currentPrice: number,
    candles: Candle[],
    portfolio: Portfolio,
    macroNews?: MacroSentimentState | null
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

    // 1. Perception Scout (Markt-Intelligenz & Regime)
    const perception = MarketIntelligenceAgent.analyze(
      candles,
      this.activeProfile.marketIntelligence
    );

    // Makro-News & Welt-Sentiment anreichern
    if (macroNews) {
      perception.macroSentiment = macroNews.overallSentiment;
      perception.macroSentimentScore = macroNews.sentimentScore;
      perception.latestBreakingNews = macroNews.crisisActive ? macroNews.crisisReason : macroNews.articles[0]?.title;
      perception.crisisVetoActive = macroNews.crisisActive;
    }

    // 2. Alpha Generator (Hypothesen-Generierung F(X))
    const hypothesis = AlphaStrategyAgent.evaluate(
      symbol,
      currentPrice,
      perception,
      portfolio,
      this.activeProfile.alphaStrategy
    );

    // 3. Risk Guardian (Judikative Proof-Validator P_J)
    const riskProof = RiskGuardianAgent.validate(
      hypothesis,
      portfolio,
      currentPrice,
      this.activeProfile.riskGuardian,
      this.consecutiveLosses
    );

    // Judikative Notbremse bei Makro-Krisenmeldung (Black Swan Schutz)
    if (macroNews?.crisisActive) {
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

    // 4. Execution Officer (Routing & Virtual Exchange)
    const execution = ExecutionAgent.execute(
      hypothesis,
      riskProof,
      currentPrice,
      this.activeProfile.executionRouting,
      this.virtualExchange
    );

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
}
