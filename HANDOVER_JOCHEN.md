# MONETARIUM — Autonomie- & Übergabe-Handbuch für Jochen

Stand: 24. September 2026  
Projekt: Monetarium Quantitative Trading Terminal  
Repository: `https://github.com/Rocal007/monetarium`

---

## 1. Grundsatz der vollständigen Unabhängigkeit

Dieses Softwarepaket versetzt dich in die Lage, das gesamte **Monetarium-Handelsterminal**, alle **15 quantitativen Handelsstrategien**, die **autonome Multi-Agenten-Flotte**, die **Risiko-Engines** sowie den **24/7 Hintergrund-Daemon** vollständig autark auf deinem eigenen Rechner (macOS, Linux oder Windows) zu betreiben, anzupassen und weiterzuentwickeln.

- **Keine Abhängigkeit von Vercel:** `monetarium.vercel.app` ist nur das Web-Hosting. Auf deinem Rechner läuft exakt dieselbe Software lokal.
- **Keine externen Zwangs-Abonnements:** Der Simulator (`Virtual Exchange`) läuft ab Werk ohne externe Kosten, mit vollwertigem Orderbuch, Gebühren- und Slippage-Modell.
- **Vollständiger Quellcode:** Sämtliche mathematischen Formeln, Indikatoren, Agenten-Prompts und UI-Komponenten liegen unverschlüsselt im Projekt.

---

## 2. System-Voraussetzungen

- **Node.js:** Version 18.x oder 20.x LTS (Download: [nodejs.org](https://nodejs.org))
- **Git:** (Optional, aber empfohlen für Versionsverwaltung)
- **Betriebssystem:** macOS, Linux oder Windows (WSL empfohlen)

---

## 3. Schnellstart in 4 Schritten (Unter 2 Minuten)

### Schritt 1: Projektordner öffnen
Entpacke das ZIP-Archiv oder klone das Repository:
```bash
git clone https://github.com/Rocal007/monetarium.git
cd monetarium
```

### Schritt 2: Abhängigkeiten installieren
```bash
npm install
```

### Schritt 3: Konfiguration anlegen
Kopiere die Vorlage `.env.example` in deine persönliche `.env.local`:
```bash
cp .env.example .env.local
```
*(Im Standardzustand ist bereits der sichere Simulator/Testnet-Modus aktiv. Du musst vorerst keine API-Schlüssel eintragen.)*

### Schritt 4: Lokales Terminal starten
```bash
npm run dev
```
Öffne nun deinen Browser unter:
👉 **`http://localhost:3000`**

Das Terminal ist sofort betriebsbereit.

---

## 4. Die Architektur: Wie das System aufgebaut ist

Monetarium ist strikt modular aufgebaut. UI, Geschäftslogik und Datenfeeds sind voneinander entkoppelt:

```
monetarium/
├── src/
│   ├── components/terminal/    # Visuelle Bedienoberfläche (React, Tailwind)
│   │   ├── ChartWidget.tsx             # Interaktive SVG-Charts & Multi-Timeframes
│   │   ├── OrderPanel.tsx              # Manuelle & algorithmische Order-Eingabe
│   │   ├── PositionTracker.tsx         # Live PnL, offene Positionen & Historie
│   │   ├── MacroHorizonInspector.tsx   # 6-Perioden-Matrix (1W bis 10 Jahre)
│   │   ├── GlobalMarketRadar.tsx       # Indizes, Zinsen (^TNX), VIX, Gold, Krypto
│   │   ├── CryptoAutoInvestModal.tsx   # 1-Klick Robo-Advisor Baskets
│   │   └── RiskPositionCalculator.tsx  # Kelly-Kriterium & Volatilitäts-Sizing
│   │
│   ├── lib/
│   │   ├── strategies/         # Die 15 quantitativen Handelsalgorithmen (SSOT)
│   │   ├── analytics/          # Sharpe, Sortino, VaR, Overfitting-Guards
│   │   ├── agents/             # Multi-Agenten-Flotte (Orchestrator, Risk Guardian)
│   │   ├── engines/            # Börsen-Konnektoren (CCXT, Alpaca, VirtualExchange)
│   │   └── data/               # Marktfeeds, Ticker & Forex Factory Kalender
│   │
│   └── scripts/
│       ├── headless-runner.ts          # 24/7 Hintergrund-Trading ohne Browser
│       └── backtest-alpha-turbo.ts     # Multi-Asset Backtest-Engine
│
├── .agents/                    # Mathematische Spezifikationen & Agenten-Protokolle
└── .env.example                # Vorlage für alle Broker- und Börsenschlüssel
```

---

## 5. Die 15 implementierten Quant-Strategien (`src/lib/strategies/`)

Jede Strategie ist als eigenständiges TypeScript-Modul implementiert und kann einzeln getestet, parametrisiert oder erweitert werden:

1. **Turtle Breakout (`turtle-strategy.ts`):** 20/55-Tage Donchian-Kanal mit ATR-Positionsgrößenanpassung nach Richard Dennis.
2. **Supertrend Momentum (`supertrend-strategy.ts`):** Volatilitätsadaptiver ATR-Trendfolger für Swings.
3. **Bollinger Mean Reversion (`bollinger-strategy.ts`):** Statistische Rückkehr zum Mittelwert bei $2\sigma$ / $2.5\sigma$ Extremwerten.
4. **Connors RSI Reversion (`rsi-connors-strategy.ts`):** Multi-Faktor-Reversion (RSI-2, Streak-Zähler, Rate of Change).
5. **Opening Range Breakout / ORB (`orb-strategy.ts`):** Eröffnungsbreakout der ersten 15–30 Minuten (Aktien/Indizes).
6. **Pairs Statistical Arbitrage (`pairs-strategy.ts`):** Kointegration und Z-Score-Trading korrelierter Paare (z. B. BTC/ETH, Gold/Silber).
7. **Collar Capital Protection (`collar-strategy.ts`):** Systematische Absicherung via Put-Optionen bei Call-Finanzierung.
8. **CPPI Capital Floor (`cppi-strategy.ts`):** Constant Proportion Portfolio Insurance mit partizipativem Kapitalschutz.
9. **Straddle Volatility Grid (`straddle-strategy.ts`):** Volatilitätsausbruch vor Zinsentscheiden und Earnings.
10. **TWAP Execution (`execution-twap-vwap.ts`):** Zeitgewichtete Order-Stückelung zur Minimierung des Market-Impacts.
11. **VWAP Execution (`execution-twap-vwap.ts`):** Volumengewichtete institutionelle Ausführung.
12. **Grid Trading (`grid-strategy.ts`):** Dynamisches Gitter in volatilen Seitwärtsmärkten.
13. **Dollar-Cost Averaging / DCA (`dca-strategy.ts`):** Zeit- und dip-basiertes Akkumulieren.
14. **Momentum Breakout (`momentum-strategy.ts`):** Trendfolge mit Moving-Average-Confluence.
15. **Attention Alpha Momentum (`search-attention-strategy.ts`):** Suchsichtbarkeits-Momentum (SVI) mit Retail-FOMO-Filter.

---

## 6. Eigene Strategien hinzufügen

Um eine eigene Strategie hinzuzufügen:
1. Erstelle eine neue Datei in `src/lib/strategies/meine-strategie.ts`.
2. Implementiere das Interface `Strategy` aus `src/lib/types/trading.ts`.
3. Registriere die Strategie in `src/lib/strategies/strategy-registry.ts`.
4. Führe den Test aus:
   ```bash
   npm run test:strategies
   ```

---

## 7. Broker-Anbindung: Vom Simulator zum Live-Handel

In deiner `.env.local` kannst du festlegen, über welche Engine Orders geroutet werden:

### A. Integrierter Simulator (Standard)
- `TRADING_MODE=TESTNET`
- Verwendet die `VirtualExchange`. Keine Registrierung, keine echten Gelder, realistische Spreads und Slippage.

### B. Krypto-Handel (Binance, Kraken, Bybit via CCXT)
1. Kostenlosen Binance Testnet-Account erstellen: [testnet.binance.vision](https://testnet.binance.vision/)
2. In `.env.local` eintragen:
   ```env
   BINANCE_API_KEY=dein_key
   BINANCE_API_SECRET=dein_secret
   BINANCE_SANDBOX=true
   ```

### C. US-Aktien & ETFs (Alpaca Markets)
1. Kostenlosen Paper-Trading-Account erstellen: [alpaca.markets](https://alpaca.markets)
2. In `.env.local` eintragen:
   ```env
   ALPACA_API_KEY=dein_alpaca_key
   ALPACA_API_SECRET=dein_alpaca_secret
   ALPACA_IS_PAPER=true
   ```

---

## 8. 24/7 Autonomer Trading-Daemon (Hintergrund-Betrieb)

Wenn du das System als eigenständigen Trading-Bot ohne geöffneten Browser laufen lassen möchtest:

```bash
npm run daemon
```

Der Daemon:
- Überwacht kontinuierlich die konfigurierten Markt-Feeds.
- Lässt den `TradingOrchestrator` und `RiskGuardian` im Intervall laufen.
- Bewertet Marktregimes (Risk-On / Risk-Off).
- Führt Signalprüfungen und Orderausführungen autonom durch.

---

## 9. Eigene Bedienung & Frontend anpassen

Da die Benutzeroberfläche strikt als Presenter-Schicht (`src/components/terminal/`) gebaut ist, kannst du:
- **Eigene Komponenten austauschen:** Beliebige React-Komponenten in `src/components/terminal/` ändern oder neue Panels einbauen.
- **Eigene REST-Endpoints ansprechen:** Unter `src/app/api/` findest du einsatzbereite API-Routen für Marktdaten, Portfolio-Status und Order-Routing.
- **Eigenes Interface aufsetzen (z. B. Python / C++ / Electron):** Die Algorithmen können über die REST-Endpoints von externen Programmen angesteuert werden.

---

## 10. Die wichtigsten Terminal-Befehle

| Befehl | Funktion |
| :--- | :--- |
| `npm run dev` | Startet das interaktive Webterminal auf `http://localhost:3000` |
| `npm run build` | Erstellt einen optimierten Produktions-Build |
| `npm run start` | Startet den Produktions-Server |
| `npm run typecheck` | Prüft alle TypeScript-Typen (strikte Typsicherheit) |
| `npm run test:strategies` | Führt alle 15 Strategie-Tests und Backtest-Hygiene durch |
| `npm run test:quant` | Berechnet Sharpe-, Sortino- und VaR-Kennzahlen |
| `npm run daemon` | Startet den 24/7 Hintergrund-Trading-Bot |
| `npm run backtest:turbo` | Führt einen schnellen Multi-Asset-Backtest aus |

---

*Für Fragen zur Systemarchitektur oder Erweiterungen siehe `.agents/AGENTS.md` und `MONETARIUM_SYSTEM_OVERVIEW.md` im Projekt-Root.*
