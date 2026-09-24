# MONETARIUM – Aufgaben & Entwicklungsstatus (TASKS)

Dieses Dokument wird automatisch aktualisiert, wenn neue Aufgaben oder Änderungswünsche über WhatsApp (`#monetarium`, `#mon`, `#terminal`, `#trade`, `#bot`) oder System-Reviews eintreffen.

---

## 🎯 Aktuelle Meilensteine & Roadmap

### 1. Global Market Radar & Screener
- [x] Globales Börsenmarkt-Mandat etabliert (Aktien, Indizes S&P 500 / DAX / Nikkei, Rohstoffe Gold & Öl, FX, Krypto)
- [x] Makro-Anker: CBOE VIX, US 10Y Yields (^TNX), Dollar-Index (DXY)
- [x] Universeller Multi-Asset Screener im Terminal integriert

### 2. Quantitative Strategien & Execution
- [x] 10 Trading-Strategien implementiert (Turtle, Supertrend, Bollinger, Connors RSI, Grid, ORB, Statistical Arbitrage, Collar, CPPI, Straddle)
- [x] Institutionelle Execution Engines (TWAP & VWAP Orderzerlegung)
- [x] Multi-Broker Routing (CCXT, Alpaca, Virtual Exchange Paper Trading)

### 3. Autonome Multi-Agenten-Flotte
- [x] Orchestrator, Alpha Strategy, Market Intelligence, Risk Guardian, Execution, Quant Evaluator
- [x] Regime-Erkennung (Risk-On / Risk-Off) mit dynamischer Risikoskalierung

### 4. Live-Deployment & Schnittstellen
- [x] Vercel Live-Deployment aktiv (https://monetarium.vercel.app)
- [x] GitHub Repository öffentlich/synchronisiert (https://github.com/Rocal007/monetarium)
- [x] WhatsApp Task-Integration via `#monetarium` / `#mon` aktiviert

### 5. Speed-Trader Arcade & Market Game Engine
- [x] Gamifizierte High-Speed Marktsimulation mit bis zu 20x Tick-Beschleunigung
- [x] 5 interaktive Spielmodi (Bull Run, Flash Crash, Whale Whiplash, AI-Duell gegen Alpha-Bot, Bar-by-Bar Replay)
- [x] Degen-Hebel bis 50x mit automatischer Liquidations-Physik
- [x] Integrierter autarker 8-Bit Web-Audio-Synthesizer für Soundeffekte
- [x] 1-Klick-Start im Terminal-Header & Hotkeys (L, S, Space)

### 6. Crash-Resilienz & SQLite State-Persistenz (Schritt 3 Roadmap)
- [x] Transaktionssicherer `SQLiteStateStore` via Node 22 `node:sqlite` (`data/monetarium.db`)
- [x] Vollständige Persistierung von Portfolio-Snapshots, Positionen, Trade-Logs und Orchestrator-Audit-Zyklen
- [x] 100% Client-Isomorphismus gewahrt (`PortfolioManager` bleibt browser-safe mit REST-Anbindung via `/api/portfolio/state`)
- [x] Automatische State-Wiederherstellung im 24/7 Headless-Daemon (`headless-runner.ts`) nach Restarts/Crashes
- [x] Eigener automatisierter Unit-Test `npm run test:storage` (5/5 Tests bestanden)
- [x] Zero-Downtime Next.js Build- und Typprüfung (0 Fehler)

### 7. Pilot & Copilot Grundeinstellungen & Autopilot-Einsatzsteuerung
- [x] Grundeinstellung „Copilot“: Assistierter Modus, Nutzer entscheidet bei jedem Signal mit (1-Klick-Freigabe oder Verwerfen)
- [x] Grundeinstellung „Pilot“: Vollautomatischer Modus, autonome Orderausführung ohne manuelle Rückfragen
- [x] Autopilot-Einsatzsteuerung: Schnellauswahl-Pills (100 €, 250 €, 500 €, 1.000 €, 2.500 €), %-Cash (5%, 10%), Kelly Quant & freies Euro-Eingabefeld
- [x] 1-Klick Autopilot-Start: Dynamischer Start-Button zeigt den aktiven Einsatz (`Pilot Starten mit 500 € Einsatz`), danach agiert die App 100% autonom
- [x] Risikowächter-Validierung (Invariante D): Exakte Allokationsberechnung nach Wunsch-Einsatz, Cash-Cap und Mindestorder-Invarianten
### 8. Krypto Auto-Invest & Omni-Market Sektor-Flotten Allokator
- [x] Krypto Auto-Invest Engine (`src/lib/crypto/crypto-allocator.ts`) mit 4 Strategien (Bluechip, Momentum, Attention-Alpha, Dip-Accumulator)
- [x] KI-Vollautonomie: Regime-basierte Krypto-Allokation (VIX, Trend, RSI, SVI) & fraktionales Kelly-Sizing ($f_{safe} = 0.25$)
- [x] Terminal UI: Krypto Auto-Invest Modal (`CryptoAutoInvestModal.tsx`) mit 1-Klick-Autonomie & Schnellzugriff im OrderPanel
- [x] Omni-Market & Sektor-Flotten Allokator (`omni-market-allocator.ts`): Diversifikation über 20 Assets (Makro-Indizes SPY/QQQ, Rohstoffe GLD/USO, Krypto, Defense, AI Compute, Automotive, Robotics)
- [x] Sofortige Ausführung & SQLite-Verbuchung: 8.006,48 € in 20 Positionen investiert, 1.985,51 € Cash-Puffer, persistent in `data/monetarium.db`
- [x] 1-Klick Button `[⚡ In alle Märkte & Sektor-Flotte investieren]` im Sektor-Flotten-Panel verankert
- [x] TypeScript Strict & Zero-Error Build (`npm run build` erfolgreich)

### 9. Responsives Terminal-Design & Header-Kopfzeilen-Architektur
- [x] Header Re-Architektur: 2-stufiges institutional Layout (Top-Row für Brand, Ticker & Guthaben; Command-Bar für Engines, Pilot/Copilot, Sentinel, Arcade, Krypto Auto-Invest & Ticker-Suche)
- [x] Beseitigung des Header-Abschneide-Bugs: Flex-Wrapping (`flex-wrap gap-2`) und fluid skalierende Suchelemente verhindern das Verschwinden von Buttons bei schmalem Browserfenster
- [x] Vollständige Breiten-Skalierung des Inhalts: Entfernung von starren Mindestbreiten und Ergänzung von `min-w-0 max-w-full overflow-hidden` in `page.tsx`, `WorldNewsBar` und `ChartWidget`
- [x] Verifikation mit Headless-Chrome CDP: 0 Overflow-Pixel bei 1440px, 1200px, 1024px, 768px und 480px Viewport-Breite

### 10. Multi-Perioden & Zeithorizont-Ansicht (Woche, Monat, Quartal, Jahr, 5 Jahre, 10 Jahre)
- [x] Zeithorizont-Typisierung (`timeframe.ts`) & Multi-Perioden Analytics Engine (`horizon-analytics.ts`)
- [x] Erweiterte Timeframe-Toolbar im `ChartWidget` mit getrennten Gruppen für Intraday (`1m`, `15m`, `1h`, `4h`, `1d`) und Makro-Horizonte (`1W`, `1M`, `1Q`, `1Y`, `5Y`, `10Y`)
- [x] X-Achsen-Zeitskala im SVG-Chart mit adaptiven Datums- und Jahresmarkern (z. B. 2016-2026 bei 10J)
- [x] Dediziertes `MacroHorizonInspector`-Panel mit 6 interaktiven Periodenkarten, Sparklines und institutioneller Matrix-Tabelle
- [x] 3-Wege Ansichtsmodus im Terminal: `Kombi (Chart & Horizonte)`, `Nur Chart` und `Nur Zeithorizonte`
- [x] Daten-Pipeline & Data Sentinel erweitert für Makro-Kerzengenerierung bis 10 Jahre Historie

---


## 📥 Eingehende WhatsApp-Aufgaben & Feedback
*(Neue Aufgaben mit `#monetarium`, `#mon`, `#trade`, `#terminal` werden hier automatisch erfasst)*

- [ ] **[21.9.2026, 15:48:04]** [TASK] Von Roland: Damit Jochen (+43 650 4542261) jederzeit Zugriff auf den Status, die Trades und die Performance hat, während die Ausführung und die SQLite-Datenbank sicher auf deinem lokalen PC laufen, gibt es drei bewährte Wege:

Mermaid diagram
Weg 1: Über WhatsApp (Der schnellste & mobilste Weg)
Jochen muss weder eine App installieren noch sich irgendwo einloggen. Das Monetarium-Terminal ist bereits an die WhatsApp-Pipeline angebunden:

Status-Abfrage: Jochen schreibt dir auf WhatsApp z. B.  status oder .
Automatischer Bot-Report: Das System liest die Daten aus deiner lokalen data/monetarium.db und antwortet ihm in Sekunden mit:
Aktuellem Kontostand & Tages-PnL
Offenen Positionen (z. B. BTC, SPY)
Letzten ausgeführten Trades & aktivem Risikoprofil (z. B. QUANT_TURBO)
Push-Alarme: Sobald der Daemon einen Trade ausführt oder ein Circuit-Breaker greift, kann Jochen automatisch benachrichtigt werden.
Weg 2: Hybrid-Sync auf Vercel (Das eleganteste Web-Dashboard)
Jochen nutzt einfach den bestehenden Link: https://monetarium.vercel.app.

Funktionsweise:
Dein lokaler PC führt die Orders aus und verwaltet die SQLite-Datenbank.
Nach jedem Trade oder alle 30 Sekunden sendet dein lokaler Daemon einen verschlüsselten Snapshot (Positionen, Cash, PnL) an die Vercel-API.
Jochen öffnet Vercel im Browser und sieht in Echtzeit das vollständige Terminal-UI mit Charts und Kennzahlen, ohne dass Vercel selbst eine Datenbank hosten muss.
Vorteil: Keine Portfreigaben nötig, 100% Ausfallsicherheit für das UI.
Weg 3: Cloudflare Tunnel (Vollwertiges Web-Terminal direkt auf deinem PC)
Möchtest du, dass Jochen nicht nur zusieht, sondern aktiv im Web-Terminal auf deinem Rechner mitklickt:

Über einen kostenlosen Cloudflare Tunnel (cloudflared) wird dein lokaler Port 3000 über eine sichere HTTPS-URL nach außen freigegeben (z. B. https://monetarium-preview.deinedomain.com oder temporärer Quick-Tunnel).
Zugangsschutz: Jochen erhält Zugriff über eine E-Mail-PIN an joachim.nauen@gmail.com oder ein Passwort.
Vorteil: Er bedient 1:1 dein lokales Next.js-Terminal mit allen Funktionen (Arcade, Order-Panel, Screener).

- [ ] **[21.9.2026, 16:00:30]** [TASK] Von Roland: Damit Jochen (+43 650 4542261) jederzeit Zugriff auf den Status, die Trades und die Performance hat, während die Ausführung und die SQLite-Datenbank sicher auf deinem lokalen PC laufen, gibt es drei bewährte Wege:

Mermaid diagram
Weg 1: Über WhatsApp (Der schnellste & mobilste Weg)
Jochen muss weder eine App installieren noch sich irgendwo einloggen. Das Monetarium-Terminal ist bereits an die WhatsApp-Pipeline angebunden:

Status-Abfrage: Jochen schreibt dir auf WhatsApp z. B.  status oder .
Automatischer Bot-Report: Das System liest die Daten aus deiner lokalen data/monetarium.db und antwortet ihm in Sekunden mit:
Aktuellem Kontostand & Tages-PnL
Offenen Positionen (z. B. BTC, SPY)
Letzten ausgeführten Trades & aktivem Risikoprofil (z. B. QUANT_TURBO)
Push-Alarme: Sobald der Daemon einen Trade ausführt oder ein Circuit-Breaker greift, kann Jochen automatisch benachrichtigt werden.
Weg 2: Hybrid-Sync auf Vercel (Das eleganteste Web-Dashboard)
Jochen nutzt einfach den bestehenden Link: https://monetarium.vercel.app.

Funktionsweise:
Dein lokaler PC führt die Orders aus und verwaltet die SQLite-Datenbank.
Nach jedem Trade oder alle 30 Sekunden sendet dein lokaler Daemon einen verschlüsselten Snapshot (Positionen, Cash, PnL) an die Vercel-API.
Jochen öffnet Vercel im Browser und sieht in Echtzeit das vollständige Terminal-UI mit Charts und Kennzahlen, ohne dass Vercel selbst eine Datenbank hosten muss.
Vorteil: Keine Portfreigaben nötig, 100% Ausfallsicherheit für das UI.
Weg 3: Cloudflare Tunnel (Vollwertiges Web-Terminal direkt auf deinem PC)
Möchtest du, dass Jochen nicht nur zusieht, sondern aktiv im Web-Terminal auf deinem Rechner mitklickt:

Über einen kostenlosen Cloudflare Tunnel (cloudflared) wird dein lokaler Port 3000 über eine sichere HTTPS-URL nach außen freigegeben (z. B. https://monetarium-preview.deinedomain.com oder temporärer Quick-Tunnel).
Zugangsschutz: Jochen erhält Zugriff über eine E-Mail-PIN an joachim.nauen@gmail.com oder ein Passwort.
Vorteil: Er bedient 1:1 dein lokales Next.js-Terminal mit allen Funktionen (Arcade, Order-Panel, Screener).

- [ ] **[21.9.2026, 16:51:22]** [TASK] Von Roland: Damit Jochen (+43 650 4542261) jederzeit Zugriff auf den Status, die Trades und die Performance hat, während die Ausführung und die SQLite-Datenbank sicher auf deinem lokalen PC laufen, gibt es drei bewährte Wege:

Mermaid diagram
Weg 1: Über WhatsApp (Der schnellste & mobilste Weg)
Jochen muss weder eine App installieren noch sich irgendwo einloggen. Das Monetarium-Terminal ist bereits an die WhatsApp-Pipeline angebunden:

Status-Abfrage: Jochen schreibt dir auf WhatsApp z. B.  status oder .
Automatischer Bot-Report: Das System liest die Daten aus deiner lokalen data/monetarium.db und antwortet ihm in Sekunden mit:
Aktuellem Kontostand & Tages-PnL
Offenen Positionen (z. B. BTC, SPY)
Letzten ausgeführten Trades & aktivem Risikoprofil (z. B. QUANT_TURBO)
Push-Alarme: Sobald der Daemon einen Trade ausführt oder ein Circuit-Breaker greift, kann Jochen automatisch benachrichtigt werden.
Weg 2: Hybrid-Sync auf Vercel (Das eleganteste Web-Dashboard)
Jochen nutzt einfach den bestehenden Link: https://monetarium.vercel.app.

Funktionsweise:
Dein lokaler PC führt die Orders aus und verwaltet die SQLite-Datenbank.
Nach jedem Trade oder alle 30 Sekunden sendet dein lokaler Daemon einen verschlüsselten Snapshot (Positionen, Cash, PnL) an die Vercel-API.
Jochen öffnet Vercel im Browser und sieht in Echtzeit das vollständige Terminal-UI mit Charts und Kennzahlen, ohne dass Vercel selbst eine Datenbank hosten muss.
Vorteil: Keine Portfreigaben nötig, 100% Ausfallsicherheit für das UI.
Weg 3: Cloudflare Tunnel (Vollwertiges Web-Terminal direkt auf deinem PC)
Möchtest du, dass Jochen nicht nur zusieht, sondern aktiv im Web-Terminal auf deinem Rechner mitklickt:

Über einen kostenlosen Cloudflare Tunnel (cloudflared) wird dein lokaler Port 3000 über eine sichere HTTPS-URL nach außen freigegeben (z. B. https://monetarium-preview.deinedomain.com oder temporärer Quick-Tunnel).
Zugangsschutz: Jochen erhält Zugriff über eine E-Mail-PIN an joachim.nauen@gmail.com oder ein Passwort.
Vorteil: Er bedient 1:1 dein lokales Next.js-Terminal mit allen Funktionen (Arcade, Order-Panel, Screener).

- [ ] **[21.9.2026, 17:41:31]** [TASK] Von Roland: Damit Jochen (+43 650 4542261) jederzeit Zugriff auf den Status, die Trades und die Performance hat, während die Ausführung und die SQLite-Datenbank sicher auf deinem lokalen PC laufen, gibt es drei bewährte Wege:

Mermaid diagram
Weg 1: Über WhatsApp (Der schnellste & mobilste Weg)
Jochen muss weder eine App installieren noch sich irgendwo einloggen. Das Monetarium-Terminal ist bereits an die WhatsApp-Pipeline angebunden:

Status-Abfrage: Jochen schreibt dir auf WhatsApp z. B.  status oder .
Automatischer Bot-Report: Das System liest die Daten aus deiner lokalen data/monetarium.db und antwortet ihm in Sekunden mit:
Aktuellem Kontostand & Tages-PnL
Offenen Positionen (z. B. BTC, SPY)
Letzten ausgeführten Trades & aktivem Risikoprofil (z. B. QUANT_TURBO)
Push-Alarme: Sobald der Daemon einen Trade ausführt oder ein Circuit-Breaker greift, kann Jochen automatisch benachrichtigt werden.
Weg 2: Hybrid-Sync auf Vercel (Das eleganteste Web-Dashboard)
Jochen nutzt einfach den bestehenden Link: https://monetarium.vercel.app.

Funktionsweise:
Dein lokaler PC führt die Orders aus und verwaltet die SQLite-Datenbank.
Nach jedem Trade oder alle 30 Sekunden sendet dein lokaler Daemon einen verschlüsselten Snapshot (Positionen, Cash, PnL) an die Vercel-API.
Jochen öffnet Vercel im Browser und sieht in Echtzeit das vollständige Terminal-UI mit Charts und Kennzahlen, ohne dass Vercel selbst eine Datenbank hosten muss.
Vorteil: Keine Portfreigaben nötig, 100% Ausfallsicherheit für das UI.
Weg 3: Cloudflare Tunnel (Vollwertiges Web-Terminal direkt auf deinem PC)
Möchtest du, dass Jochen nicht nur zusieht, sondern aktiv im Web-Terminal auf deinem Rechner mitklickt:

Über einen kostenlosen Cloudflare Tunnel (cloudflared) wird dein lokaler Port 3000 über eine sichere HTTPS-URL nach außen freigegeben (z. B. https://monetarium-preview.deinedomain.com oder temporärer Quick-Tunnel).
Zugangsschutz: Jochen erhält Zugriff über eine E-Mail-PIN an joachim.nauen@gmail.com oder ein Passwort.
Vorteil: Er bedient 1:1 dein lokales Next.js-Terminal mit allen Funktionen (Arcade, Order-Panel, Screener).
