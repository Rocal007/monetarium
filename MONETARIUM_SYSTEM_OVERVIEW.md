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
- **Backtest Inspector (`BacktestInspector.tsx`):** Historische Validierung mit Performance-Graphen.
- **Cicero 7Q & Birkenbihl Playground (`Cicero7QInspector.tsx`, `BirkenbihlPlayground.tsx`):** Systematische neurodidaktische Qualitätsprüfung aller Signale und UI-Zustände.
