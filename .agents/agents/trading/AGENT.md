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
- **Rolle:** Beobachtet Multi-Perioden-Kerzen, ATR, EMAs, RSI sowie das **globale Börsenmarkt-Regime** (Gesamtmarkt-Radar: S&P 500, Nasdaq, DAX, VIX, US-Zinsen, Gold, Öl).
- **Funktion:** Klassifiziert das aktuelle Marktregime unter Intermarket-Konfluenz:
  - `BULL_TREND`: Schneller EMA über langsamem EMA, RSI im Expansionskorridor, unterstützt von Risk-On im Gesamtmarkt.
  - `BEAR_TREND`: Schneller EMA unter langsamem EMA oder breitflächige Makro-Korrektur.
  - `RANGE_BOUND`: Oszillation im Mittelwertkanal.
  - `HIGH_VOLATILITY`: Überschreitung der relativen ATR-Schwelle oder VIX-Spike (> 22).
  - `CONSOLIDATION`: Kompression und geringe Trendstärke vor Makro-Impulsen.
- **Global Market Breadth:** Überwacht das Risk-On / Risk-Off-Klima des Weltbörsenmarkts (\( \Omega_{\text{Macro}} \)) und drosselt Signale bei Makro-Divergenzen.
- **Protokoll:** `MarketIntelligenceProtocol`

### 2. Alpha Generator (`AlphaStrategyAgent`)
- **Rolle:** Proponiert konkrete Handelshypothesen basierend auf dem erkannten Regime und den 14 fest integrierten quantitativen Strategiemustern:
  - **Trendfolge & Breakout:**
    - `MOMENTUM_BREAKOUT`: EMA Golden Cross mit RSI-Dynamikfilter.
    - `TURTLE_BREAKOUT`: 20/55-Tage Donchian Breakout mit 2x ATR Stop.
    - `SUPERTREND_VOLATILITY`: Median-ATR Band-Crossover mit Richtungs-Flip.
    - `ORB_BREAKOUT`: Opening Range Breakout aus der Session-Eröffnungsspanne.
  - **Mean Reversion & Statistische Arbitrage:**
    - `MEAN_REVERSION_GRID`: Symmetrische Gittererfassung von Oszillationen.
    - `BOLLINGER_ZSCORE`: 2-Sigma Mean Rebound mit Take-Profit am SMA 20.
    - `RSI_CONNORS_REVERSAL`: Larry Connors 2-Perioden RSI Flash-Rebound im Aufwärtstrend.
    - `PAIRS_STATARB`: Kointegrierte Marktneutrale Spread-Divergenz.
    - `DCA_ACCUMULATION`: Zeitgesteuerte Tranchen-Akkumulation im Konsolidierungsfenster.
  - **Optionen & Derivate:**
    - `COLLAR_CYLINDER`: Zylinder-Option (Zero-Cost Collar mit Put-Floor und Call-Cap).
    - `STRADDLE_VOLATILITY`: Long Straddle Delta-Ausbruch vor/bei High-Impact News.
  - **Execution & Portfolioschutz:**
    - `TWAP_EXECUTION`: Zeitgewichtete Orderzerlegung.
    - `VWAP_VALUE`: Volumengewichteter Discount-Kauf unter VWAP.
    - `CPPI_CAPITAL_FLOOR`: Constant Proportion Portfolio Insurance mit hartem Garantie-Floor.
- **Protokoll:** `AlphaStrategyProtocol`

### 3. Risk Guardian (`RiskGuardianAgent` — Judikative \( P_J \))
- **Rolle:** Unbestechlicher Sicherheits- und Compliance-Officer.
- **Prüfung der 4 unumstößlichen Risiko-Invarianten + News-Blackout:**
  1. **Drawdown Circuit Breaker:** Notfallstopp bei Überschreitung des Max-Drawdown-Limits.
  2. **Anti-Whipsaw Cooldown:** Zwangspause nach Verlustserien.
  3. **Portfolio Exposure Cap:** Begrenzung des maximal im Markt gebundenen Kapitals.
  4. **Fractional Kelly Sizing:** Mathematisch optimierte Positionsgrößenbestimmung basierend auf Stop-Loss-Distanz.
  5. **Forex Factory Blackout Circuit-Breaker:** Absolutes Kaufverbot bei bevorstehenden High-Impact Events (±20 Min).
- **Protokoll:** `RiskGuardianProtocol`

### 4. Execution Officer (`ExecutionAgent`)
- **Rolle:** Transformiert autorisierte Signale in Markt- oder Limit-Aufträge.
- **Funktionen:** Slippage-Berechnung (bps), Limit-Offset-Steuerung, TWAP/VWAP Slicing, Anbindung an VirtualExchange / Broker.
- **Protokoll:** `ExecutionRoutingProtocol`

### 5. Quant Evaluator & Cache (`QuantEvaluatorAgent` — Cache \( C \))
- **Rolle:** Zustandsüberwachung, Fixpunkt-Tracking (\( \Delta(X, X') \)), Berechnung von Sharpe/Sortino und Idempotenz-Optimierung.
- **Protokoll:** `QuantEvaluatorProtocol`

---

## III. PROTOKOLL-PROFILE

1. **`CAPITAL_SHIELD` (Defensiv):**
   - 0.5% Risiko je Trade, 2.0% Circuit-Breaker, 35% max. Exposure, 75% Mindest-Konfluenz.
   - *Strategien:* `COLLAR_CYLINDER`, `CPPI_CAPITAL_FLOOR`, `VWAP_VALUE`, `DCA_ACCUMULATION`, `MOMENTUM_BREAKOUT`.
2. **`BALANCED_ALPHA` (Standard):**
   - 1.2% Risiko je Trade, 5.0% Circuit-Breaker, 60% max. Exposure, dynamischer Regime-Wechsel.
   - *Strategien:* `MOMENTUM_BREAKOUT`, `TURTLE_BREAKOUT`, `BOLLINGER_ZSCORE`, `COLLAR_CYLINDER`, `MEAN_REVERSION_GRID`.
3. **`HIGH_VELOCITY_GRID` (Aggressiv):**
   - 2.0% Risiko je Trade, 8.0% Circuit-Breaker, 80% max. Exposure, enge Gitterlinien.
   - *Strategien:* `MEAN_REVERSION_GRID`, `SUPERTREND_VOLATILITY`, `STRADDLE_VOLATILITY`, `RSI_CONNORS_REVERSAL`, `ORB_BREAKOUT`.
