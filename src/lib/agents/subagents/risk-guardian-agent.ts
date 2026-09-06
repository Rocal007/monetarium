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

    // Invariante D: Positionsgrößenbestimmung & Fractional Kelly
    const maxRiskEuro = (portfolio.equity * (protocol.maxRiskPerTradePercent / 100));
    const slPrice = hypothesis.suggestedStopLoss > 0 ? hypothesis.suggestedStopLoss : currentPrice * 0.98;
    const slDistance = Math.max(currentPrice * 0.005, currentPrice - slPrice);

    let rawAmount = maxRiskEuro / slDistance;
    // Skalierung mit Kelly-Faktor
    let kellyAmount = rawAmount * protocol.kellyFraction;

    // Obergrenze: maximal 25% des verfügbaren Cashs für eine Einzelorder
    const maxOrderCost = portfolio.cash * 0.25;
    const calculatedCost = kellyAmount * currentPrice;

    if (calculatedCost > maxOrderCost) {
      kellyAmount = maxOrderCost / currentPrice;
    }

    // Mindestgröße prüfen (z. B. mindestens 15 € Gegenwert)
    if (kellyAmount * currentPrice < 15) {
      return {
        passed: false,
        approvedAmount: 0,
        riskPerTradeEuro: maxRiskEuro,
        circuitBreakerActive: false,
        proofScore: 0,
        vetoReason: `MINDESTORDER-VETO: Berechnete Ordergröße (${(kellyAmount * currentPrice).toFixed(2)} €) liegt unter Mindestvolumen von 15 €.`,
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
      approvedAmount: Number(kellyAmount.toFixed(4)),
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
