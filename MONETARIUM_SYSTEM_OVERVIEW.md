# MONETARIUM — System- & Komponenten-Übersicht

Stand: 20. September 2026

Dieses Dokument bietet eine lückenlose Gesamtübersicht über alle vorhandenen und neu implementierten Komponenten, Strategien, Multi-Agenten und Daten-Engines des Monetarium-Handelsterminals.

---

## 1. Global Market Radar & Screener (Gesamtbörsenmarkt-Mandat)
- **Global Market Radar (`GlobalMarketRadar.tsx` & `global-market-feed.ts`):**
  - Echtzeit-Tracking weltweiter Leitindizes: S&P 500, Nasdaq 100, DAX 40, Dow Jones, Nikkei 225.
  - Risiko- und Volatilitätsanker: CBOE Volatility Index (VIX), US 10-Year Treasury Yields (^TNX), Dollar-Index (DXY).
  - Rohstoff- und Devisenmärkte: Gold (XAU), WTI/Brent Öl, EUR/USD, GBP/USD.
  - Krypto-Leitmärkte: Bitcoin (BTC), Ethereum (ETH) inkl. Dominanz- und Regimetracking.
- **Global Market Screener (`GlobalMarketScreener.tsx`):**
  - Dynamischer Filter nach Anlageklassen, Relative-Strength, Volatilität und 24h-Performance.
  - Direktes Aufrufen und Beordern jedes weltweiten Assets im Terminal.

---

## 2. Die 10+ Quantitativen Handelsstrategien (`src/lib/strategies/`)
1. **Turtle Breakout (`turtle-strategy.ts`):** Donchian-Kanal-Trendfolge nach Richard Dennis (20/55-Tage Breakouts mit ATR-Position Sizing).
2. **Supertrend Momentum (`supertrend-strategy.ts`):** Volatilitätsadaptiver ATR-Trendfolger für mittelfristige Swing-Bewegungen.
3. **Bollinger Mean Reversion (`bollinger-strategy.ts`):** Statistische Rückkehr zum Mittelwert bei Extremabweichungen (2σ / 2.5σ Bänder).
4. **Connors RSI Reversion (`rsi-connors-strategy.ts`):** Aggressive Multi-Faktor-Reversion (RSI(3), Streak-Dauer, RoC).
5. **Opening Range Breakout / ORB (`orb-strategy.ts`):** Institutionelle Eröffnungs-Breakout-Strategie für Index- & Equity-Sessions (erste 15–30 Min.).
6. **Pairs Statistical Arbitrage (`pairs-strategy.ts`):** Kointegration und Z-Score Spread-Trading korrelierter Assets (z.B. Gold vs. Silber, BTC vs. ETH).
7. **Collar Capital Protection (`collar-strategy.ts`):** Systematisches Absichern von Positionen durch Puts bei gleichzeitiger Finanzierung über Calls.
8. **CPPI Capital Floor (`cppi-strategy.ts`):** Constant Proportion Portfolio Insurance zur garantierten Wahrung eines Kapital-Unterbodens.
9. **Straddle Volatility Grid (`straddle-strategy.ts`):** Volatilitäts-Gitter vor binären Events (Zinsentscheide, Quartalszahlen).
10. **TWAP / VWAP Execution Engine (`execution-twap-vwap.ts`):** Institutionelle Order-Zerlegung zur Minimierung von Market-Impact und Slippage.
11. **Klassisches Grid- & DCA-Trading (`grid-strategy.ts`, `dca-strategy.ts`):** Kontinuierlicher Positionsaufbau und Rebalancing.

---

## 3. Autonome Multi-Agenten-Flotte (`src/lib/agents/`)
- **Trading Orchestrator (`trading-orchestrator.ts`):** Zentrale Instanz zur Überwachung des Marktregimes (Risk-On / Risk-Off) und Koordination aller Subagenten.
- **Alpha Strategy Agent (`alpha-strategy-agent.ts`):** Generiert fortlaufend Handelshypothesen basierend auf den quantitativen Modellen.
- **Market Intelligence Agent (`market-intelligence-agent.ts`):** Aggregiert Makrodaten, Zinsumfeld und Sentiment.
- **Risk Guardian Agent (`risk-guardian-agent.ts`):** Überwacht Portfoliorisiko, Value-at-Risk (VaR), Drawdown-Limits und Hebelsperren.
- **Execution Agent (`execution-agent.ts`):** Führt Orders über intelligente Routing-Algorithmen (TWAP/VWAP) aus.
- **Quant Evaluator Agent (`quant-evaluator-agent.ts`):** Bewertet Backtest-Metriken (Sharpe Ratio, Sortino Ratio, Calmar Ratio, Win Rate).

---

## 4. Live-Makrodaten & Broker-Routing (`src/lib/engines/` & `src/lib/news/`)
- **Forex Factory Client (`forex-factory-client.ts`, `/api/news/forex-factory`):**
  - Direkte Einbindung des Forex Factory Wirtschaftskalenders.
  - Vorfilterung nach High-Impact Events (Non-Farm Payrolls, FOMC Zinsentscheide, CPI/Inflation).
- **World News Bar (`WorldNewsBar.tsx`):**
  - Live-Newsfeed im oberen Terminalbereich mit Dringlichkeits-Badges.
- **Multi-Broker Routing Engine:**
  - **CCXT Connector (`ccxt-connector.ts`):** Anbindung an Krypto-Spot & Perpetual Börsen.
  - **Alpaca Connector (`alpaca-connector.ts`):** US-Aktien- und ETF-Trading via Alpaca Broker API.
  - **Virtual Exchange (`virtual-exchange.ts`):** High-Fidelity Simulator mit Orderbuch, Slippage-Modell (`slippage-model.ts`) und Fee-Struktur (`fee-structure.ts`).

---

## 5. Terminal-UI & Inspektion (`src/components/terminal/`)
- **Trading-Chart (`ChartWidget.tsx`):** Multi-Timeframe Candlestick-Charts.
- **Order Panel & Position Tracker (`OrderPanel.tsx`, `PositionTracker.tsx`):** Ausführung und lückenlose PnL-Überwachung.
- **Sector Fleet Panel (`SectorFleetPanel.tsx`):** Übersicht der Allokation über Tech, Energie, Finanzen und Krypto.
- **Search Visibility Radar & Attention Inspector (`SearchVisibilityRadar.tsx`):** Echtzeit-Überwachung von Web- und Google-Trends Suchsichtbarkeit (SVI), Momentum-Bestätigung und Retail-Euphorie-Filter.
- **Risk & Position Sizing Calculator (`RiskPositionCalculator.tsx`):** Mathematische Positionsgrößen- und CRV-Berechnung nach Volatilität und Kelly-Kriterium.

---

## 6. Krypto Auto-Invest & Robo-Advisor Engine (`src/lib/crypto/` & `CryptoAutoInvestModal.tsx`)
- **Autonome Krypto-Auswahl & Risikoprofile:**
  - **Core Bluechip (Konservativ):** 60% BTC, 30% ETH, 10% SOL (Fokus auf ETF-Nettozuflüsse, maximale Liquidität).
  - **Smart Momentum Basket (Ausgewogen):** Dynamische relative Stärke, 24h-Dynamik und EMA 9/21 Trend-Confluence.
  - **Attention Alpha (Chancenorientiert):** Search-Volume-Index (SVI) Momentum bei Layer-1 & DeFi-Werten mit Retail-FOMO-Schutz.
  - **Dip Accumulator (Contrarian):** Erkennt überverkaufte Qualitätstoken (RSI < 35, statistische Korrekturen).
- **1-Klick Basket-Ausführung:**
  - Berechnet exakte Token-Stückzahlen, EUR-Allokationen, Slippage und Gebühren.
  - Führt alle Orders simultan über die aktive Engine aus und aktualisiert das Portfolio in Echtzeit.
  - Zugänglich über den Navigations-Button `[⚡ Krypto Auto-Invest]` und direkt aus dem Order-Panel.

---

## 7. Multi-Perioden & Zeithorizont-Matrix (`src/components/terminal/MacroHorizonInspector.tsx`)
- **Ganzheitliche 6-Perioden-Analyse:**
  - **Woche (1W):** 7-Tage Dynamik & Kurzfrist-Momentum.
  - **Monat (1M):** 30-Tage Swing & Konsolidierungs-Tracking.
  - **Quartal (1Q):** 90-Tage Quartals- und Earnings-Zyklen.
  - **Jahr (1J / 1Y):** 365-Tage Performance & 52-Wochen-Range.
  - **5 Jahre (5J / 5Y):** Mittelfristige Halving- & Konjunkturzyklen.
  - **10 Jahre (10J / 10Y):** Säkulare Megatrends & langfristige Asset-Expansion.
- **Features:**
  - Umschaltbar zwischen interaktiven Karten mit Sparklines und einer institutionellen Matrix-Tabelle (inkl. CAGR und Max Drawdown).
  - Vollständige Synchronisation mit dem interaktiven SVG-Chart und adaptiver X-Achsen-Zeitskala (von Minuten bis zu 10-Jahres-Markern 2016–2026).


