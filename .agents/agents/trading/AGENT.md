# Trading Agent Multi-Subagent System — Monetarium

Dieses Dokument definiert die Architektur und Protokoll-Spezifikation für den **NEXUS Trading Agent Orchestrator** und seine 5 spezialisierten, protokollgesteuerten Unteragenten.

---

## I. DIE KERN-MATHEMATIK (NEXUS Trading Zyklus)

Jeder Deliberationstakt im Trading-System operiert unter dem NEXUS-Operator:
\[ T = C \circ P_J \circ D_L \circ F \]
wobei:
*   \( F \): **Perception & Alpha Hypothesis Generator** (erzeugt Handelskandidaten basierend auf Marktregimes).
*   \( D_L \): **Legislative DECORUM-Projektion** (setzt protokollarische Randbedingungen, CRV-Vorgaben und Confluence-Filter durch).
*   \( P_J \): **Judikative Risk Guardian** (verifiziert die 4 unumstößlichen Risiko-Invarianten).
*   \( C \): **Quant Evaluator & Idempotenter Cache** (stabilisiert semantisch äquivalente Zustände und verhindert redundante Berechnungen).

---

## II. DIE 5 PROTOKOLLGESTEUERTEN UNTERAGENTEN

### 1. Perception Scout (`MarketIntelligenceAgent`)
- **Rolle:** Beobachtet Multi-Perioden-Kerzen, ATR, EMAs und RSI.
- **Funktion:** Klassifiziert das aktuelle Marktregime:
  - `BULL_TREND`: Schneller EMA über langsamem EMA, RSI im Expansionskorridor.
  - `BEAR_TREND`: Schneller EMA unter langsamem EMA.
  - `RANGE_BOUND`: Oszillation im Mittelwertkanal.
  - `HIGH_VOLATILITY`: Überschreitung der relativen ATR-Schwelle.
  - `CONSOLIDATION`: Kompression und geringe Trendstärke.
- **Protokoll:** `MarketIntelligenceProtocol`

### 2. Alpha Generator (`AlphaStrategyAgent`)
- **Rolle:** Proponiert konkrete Handelshypothesen basierend auf dem erkannten Regime.
- **Dynamisches Regime-Switching:**
  - Trendfolge (`MOMENTUM_BREAKOUT`) bei bestätigten Trends.
  - Mean-Reversion (`MEAN_REVERSION_GRID`) an Kanalgrenzen in Seitwärtsphasen.
  - Kapitalerhalt (`HOLD`) bei unzureichender Konfluenz oder extremer Volatilität.
- **Protokoll:** `AlphaStrategyProtocol`

### 3. Risk Guardian (`RiskGuardianAgent` — Judikative \( P_J \))
- **Rolle:** Unbestechlicher Sicherheits- und Compliance-Officer.
- **Prüfung der 4 unumstößlichen Risiko-Invarianten:**
  1. **Drawdown Circuit Breaker:** Notfallstopp bei Überschreitung des Max-Drawdown-Limits.
  2. **Anti-Whipsaw Cooldown:** Zwangspause nach Verlustserien.
  3. **Portfolio Exposure Cap:** Begrenzung des maximal im Markt gebundenen Kapitals.
  4. **Fractional Kelly Sizing:** Mathematisch optimierte Positionsgrößenbestimmung basierend auf Stop-Loss-Distanz.
- **Protokoll:** `RiskGuardianProtocol`

### 4. Execution Officer (`ExecutionAgent`)
- **Rolle:** Transformiert autorisierte Signale in Markt- oder Limit-Aufträge.
- **Funktionen:** Slippage-Berechnung (bps), Limit-Offset-Steuerung, Anbindung an VirtualExchange / Broker.
- **Protokoll:** `ExecutionRoutingProtocol`

### 5. Quant Evaluator & Cache (`QuantEvaluatorAgent` — Cache \( C \))
- **Rolle:** Zustandsüberwachung, Fixpunkt-Tracking (\( \Delta(X, X') \)), Berechnung von Sharpe/Sortino und Idempotenz-Optimierung.
- **Protokoll:** `QuantEvaluatorProtocol`

---

## III. PROTOKOLL-PROFILE

1. **`CAPITAL_SHIELD` (Defensiv):**
   - 0.5% Risiko je Trade, 2.0% Circuit-Breaker, 35% max. Exposure, 75% Mindest-Konfluenz.
2. **`BALANCED_ALPHA` (Standard):**
   - 1.2% Risiko je Trade, 5.0% Circuit-Breaker, 60% max. Exposure, dynamischer Regime-Wechsel.
3. **`HIGH_VELOCITY_GRID` (Aggressiv):**
   - 2.0% Risiko je Trade, 8.0% Circuit-Breaker, 80% max. Exposure, enge Gitterlinien.
