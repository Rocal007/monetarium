import { Portfolio } from '../../types/trading';
import { AlphaHypothesis, RiskGuardianProtocol, RiskValidationProof } from '../protocols/types';

export class RiskGuardianAgent {
  /**
   * Judikative Proof-Validator-Funktion P_J(X):
   * Prüft jede Handelshypothese gegen unumstößliche Risiko-Invarianten.
   */
  public static validate(
    hypothesis: AlphaHypothesis,
    portfolio: Portfolio,
    currentPrice: number,
    protocol: RiskGuardianProtocol,
    recentConsecutiveLosses: number = 0
  ): RiskValidationProof {
    // 1. HOLD benötigt keine Risikoallokation
    if (hypothesis.action === 'HOLD') {
      return {
        passed: true,
        approvedAmount: 0,
        riskPerTradeEuro: 0,
        circuitBreakerActive: false,
        proofScore: 1,
        invariantsChecked: {
          drawdownOk: true,
          exposureOk: true,
          riskSizeOk: true,
          cooldownOk: true,
        },
      };
    }

    const pos = portfolio.positions[hypothesis.symbol];
    const currentHolding = pos?.amount ?? 0;

    // 2. SELL / Exit Validierung
    if (hypothesis.action === 'SELL') {
      if (currentHolding <= 0) {
        if (!protocol.allowShorting) {
          return {
            passed: false,
            approvedAmount: 0,
            riskPerTradeEuro: 0,
            circuitBreakerActive: false,
            proofScore: 0,
            vetoReason: 'Judikative VETO: Shorting ist im Protokoll deaktiviert und kein Bestand vorhanden.',
            invariantsChecked: {
              drawdownOk: true,
              exposureOk: true,
              riskSizeOk: false,
              cooldownOk: true,
            },
          };
        }
      }
      return {
        passed: true,
        approvedAmount: currentHolding > 0 ? currentHolding : 0,
        riskPerTradeEuro: 0,
        circuitBreakerActive: false,
        proofScore: 1,
        invariantsChecked: {
          drawdownOk: true,
          exposureOk: true,
          riskSizeOk: true,
          cooldownOk: true,
        },
      };
    }

    // 3. BUY Validierung — Harte Invarianten

    // Invariante A: Max Drawdown Circuit Breaker
    const initialBalance = portfolio.initialBalance > 0 ? portfolio.initialBalance : 10000;
    const currentDrawdownPct = Math.max(0, ((initialBalance - portfolio.equity) / initialBalance) * 100);
    const isCircuitTripped = currentDrawdownPct >= protocol.maxDrawdownCircuitPercent;

    if (isCircuitTripped) {
      return {
        passed: false,
        approvedAmount: 0,
        riskPerTradeEuro: 0,
        circuitBreakerActive: true,
        proofScore: 0,
        vetoReason: `CIRCUIT BREAKER AUSGELÖST: Aktueller Drawdown (${currentDrawdownPct.toFixed(2)}%) übersteigt Grenzwert von ${protocol.maxDrawdownCircuitPercent}%. Käufe gestoppt.`,
        invariantsChecked: {
          drawdownOk: false,
          exposureOk: true,
          riskSizeOk: false,
          cooldownOk: true,
        },
      };
    }

    // Invariante B: Anti-Whipsaw Cooldown
    if (recentConsecutiveLosses >= protocol.cooldownTicksAfterLoss) {
      return {
        passed: false,
        approvedAmount: 0,
        riskPerTradeEuro: 0,
        circuitBreakerActive: false,
        proofScore: 0,
        vetoReason: `COOLDOWN AKTIV: ${recentConsecutiveLosses} aufeinanderfolgende Verluste. Cooldown-Protokoll erzwingt Pause zum Kapitalschutz.`,
        invariantsChecked: {
          drawdownOk: true,
          exposureOk: true,
          riskSizeOk: false,
          cooldownOk: false,
        },
      };
    }

    // Invariante C: Portfolio Exposure Obergrenze
    const investedCapital = Math.max(0, portfolio.equity - portfolio.cash);
    const exposurePct = portfolio.equity > 0 ? (investedCapital / portfolio.equity) * 100 : 0;
    if (exposurePct >= protocol.maxPortfolioExposurePercent) {
      return {
        passed: false,
        approvedAmount: 0,
        riskPerTradeEuro: 0,
        circuitBreakerActive: false,
        proofScore: 0,
        vetoReason: `EXPOSURE-LIMIT: Portfoliobereitschaft (${exposurePct.toFixed(1)}%) über Limit von ${protocol.maxPortfolioExposurePercent}%.`,
        invariantsChecked: {
          drawdownOk: true,
          exposureOk: false,
          riskSizeOk: false,
          cooldownOk: true,
        },
      };
    }

    // Invariante D: Positionsgrößenbestimmung & Autopilot Einsatz
    const maxRiskEuro = (portfolio.equity * (protocol.maxRiskPerTradePercent / 100));
    let targetOrderEur = 0;

    if (protocol.customStake?.stakeType === 'FIXED_EUR') {
      targetOrderEur = protocol.customStake.stakeValue;
    } else if (protocol.customStake?.stakeType === 'PERCENT_CASH') {
      targetOrderEur = portfolio.cash * (protocol.customStake.stakeValue / 100);
    } else {
      // Standard: Fractional Kelly Modell
      const slPrice = hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : currentPrice * 0.98;
      const slDistance = Math.max(currentPrice * 0.005, currentPrice - slPrice);
      const rawAmount = maxRiskEuro / slDistance;
      const kellyAmount = rawAmount * protocol.kellyFraction;
      const maxOrderCost = portfolio.cash * 0.25;
      targetOrderEur = Math.min(kellyAmount * currentPrice, maxOrderCost);
    }

    // Obergrenze: Nicht mehr als das verfügbare Cash
    const maxAffordable = Math.max(0, portfolio.cash * 0.98);
    if (targetOrderEur > maxAffordable) {
      targetOrderEur = maxAffordable;
    }

    const calculatedAmount = currentPrice > 0 ? targetOrderEur / currentPrice : 0;

    // Mindestgröße prüfen (z. B. mindestens 15 € Gegenwert)
    if (targetOrderEur < 15) {
      return {
        passed: false,
        approvedAmount: 0,
        riskPerTradeEuro: maxRiskEuro,
        circuitBreakerActive: false,
        proofScore: 0,
        vetoReason: `MINDESTORDER-VETO: Berechnete Ordergröße (${targetOrderEur.toFixed(2)} €) liegt unter Mindestvolumen von 15 € (Verfügbares Guthaben: ${portfolio.cash.toFixed(2)} €).`,
        invariantsChecked: {
          drawdownOk: true,
          exposureOk: true,
          riskSizeOk: false,
          cooldownOk: true,
        },
      };
    }

    // Alles bestanden! P_J = 1
    return {
      passed: true,
      approvedAmount: Number(calculatedAmount.toFixed(4)),
      riskPerTradeEuro: Number(maxRiskEuro.toFixed(2)),
      circuitBreakerActive: false,
      proofScore: 1,
      invariantsChecked: {
        drawdownOk: true,
        exposureOk: true,
        riskSizeOk: true,
        cooldownOk: true,
      },
    };
  }
}

