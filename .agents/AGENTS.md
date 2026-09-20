# MONETARIUM — NEXUS Master-Spezifikation & System-Operator Protokolle

Dieses Dokument dient als zentrale Single Source of Truth (SSOT) für alle Agenten-Aktivitäten, System-Operationen, rechtlichen Compliance-Prüfungen, visuellen Standards und architektonischen Richtlinien des Projekts **Monetarium**.

---

## I. DIE KERN-MATHEMATIK (System-Operator & Stabilität)

### 1. Semantischer Zustandsraum
Jeder Zustand im System ist definiert als:
\[ X = (i, o, r, p) \]
mit:
*   \( i \in I \): Input-Semantik (Prompt-Kontext und Rohdaten)
*   \( o \in O \): Output-Semantik (Generierter Inhalt / Code / UI)
*   \( r \in R \): Regelzustand (Konformitätsstatus bezüglich DECORUM & Legislative)
*   \( p \in \{0, 1\} \): Proof-State (Validierungsstatus durch Judikative)

### 2. System-Operator
MONETARIUM operiert unter dem NEXUS-Operator \( T: X \to X \):
\[ T = C \circ P_J \circ D_L \circ F \]
wobei:
*   \( F \): Probabilistischer LLM-Generator-Operator (erzeugt semantische Kandidaten)
*   \( D_L \): Legislative DECORUM-Projektionsoperator (setzt regulatorische, branchenspezifische & stilistische Constraints durch)
*   \( P_J \): Judicative Proof-Validator-Operator (verifiziert Konformität gegen Fakten & Verbotskataloge)
*   \( C \): Idempotenter Cache-Operator (stabilisiert und versiegelt den verifizierten Zustand)

#### Stabilitätsbedingungen & Fixpunkt:
*   Ein Zustand \( X^* \) ist ein stabiler Systemfixpunkt, wenn gilt:
    \[ T(X^*) = X^* \]
*   **Lemma 1 (DECORUM Idempotenz):** Wenn keine Regelverletzungen existieren (\( \Phi(X) = \emptyset \)), gilt \( D_L(X) = X \) und \( D_L(D_L(X)) = D_L(X) \).
*   **Lemma 2 (Cache Idempotenz):** \( C(C(X)) = C(X) \).
*   **Theorem (Konvergenzsatz):** Wenn \( D_L \) eine kontraktive Projektion ist, konvergiert die Iteration \( X_{t+1} = T(X_t) \) gegen einen eindeutigen Fixpunkt \( X^* \).
*   **Theorem (Cache-Stabilität):** Wenn \( P_J(X_t) = 1 \land P_J(X_{t+k}) = 1 \) und \( \Delta(X_t, X_{t+k}) \le \epsilon \), dann \( C(X_{t+k}) = C(X_t) \).
*   **Theorem (Energie-Reduktion):** Für Cache-Hitrate \( h \to 1 \) konvergiert der Rechenaufwand gegen die Cache-Komplexität \( O(C) \), wodurch redundante LLM-Inferenzaufrufe asymptotisch irrelevant werden:
    \[ E[T] \to O(C) \]

### 3. Search Visibility & Attention Alpha-Gleichung (SVI-Faktor)
Die Suchsichtbarkeit (Search Volume Index / Web- & Google-Search-Trends) ist **kein Kriterium für die Web-App selbst**, sondern dient ausschließlich als **quantitativer Alpha-Faktor im Handelsmodell**:
\[ V_{\text{Attention}}(A) = \left[ \sum_{i} (SVI_i \cdot w_i) \right] \cdot \Phi_{\text{regime}}(\text{PriceAction}, \Delta SVI) \]
wobei:
*   \( SVI_i \in [0, 100] \): Normalisierter Search Volume Index (Google Trends, Ticker-Suche, Krypto- & News-Suchintensität).
*   \( w_i \): Asset- und zeithorizontspezifische Gewichtung.
*   \( \Delta SVI \): 24h- / 7d-Veränderungsrate des Suchinteresses (Momentum).
*   \( \Phi_{\text{regime}} \): Regimespezifischer Übertragungsoperator:
    - **Trend-Bestätigung (Momentum Confirmation):** Technischer Breakout begleitet von steigendem Suchvolumen (\( \Delta SVI > +30\% \)) erhöht die Allokations-Konfidenz (\( \times 1.2 \)).
    - **Retail-Euphorie / Blow-Off Top Detector:** Extremes Suchvolumen (\( SVI > 90 \)) bei stark überkauftem RSI (> 75) signalisiert Überhitzung / Retail-FOMO. Das System blockiert neue Longs und zieht Trailing-Stops nach.
    - **Akkumulations-Divergenz:** Stille Kursakkumulation bei explodierendem Suchinteresse signalisiert bevorstehende Volatilitätsexpansion.

---

## II. QUANTITATIVE RISIKO- & PORTFOLIO-MATHEMATIK

### 1. Risikoadjustierte Performance & Drawdown-Metriken
Jeder Trading-Zyklus, Backtest und Bot wird kontinuierlich an institutionellen Risikokennzahlen gemessen:
*   **Sharpe Ratio:** Risikoadjustierte Überrendite pro Volatilitätseinheit:
    \[ \text{Sharpe} = \frac{E[R_p - R_f]}{\sigma_p} \]
*   **Sortino Ratio:** Bestrafung ausschließlich von Abwärtsvolatilität (Downside Deviation):
    \[ \text{Sortino} = \frac{E[R_p - R_f]}{\sigma_{\text{down}}} \]
*   **Value at Risk (\( \text{VaR}_{99\%} \)) & Expected Shortfall (\( \text{CVaR} \)):** Maximaler erwarteter Verlust über einen Zeithorizont bei gegebenem Konfidenzniveau.
*   **Maximum Drawdown (MDD) & Calmar Ratio:** Spitzen-zu-Tal-Verlustverhältnis zur Begrenzung von Ruin-Risiken.

### 2. Position Sizing & Kelly-Kriterium
Die optimale Positionsgröße wird nicht statisch geschätzt, sondern dynamisch nach Volatilität (ATR) und Kelly-Kapitalwachstum skaliert:
\[ f^* = \frac{p \cdot b - q}{b} \]
mit Fraktions-Dämpfung (\( f_{\text{safe}} = 0.25 \cdot f^* \)) zur Vermeidung von Volatility-Drag.

### 3. Kognitive Ergonomie im Trading-Terminal
*   **System 1 (Visuelle Reibungslosigkeit):** Sofortige Erfassbarkeit kritischer Marktzustände durch strikte Farbkodierung (Emerald = Buy/Gain, Rose = Sell/Loss, Sky/Amber = Regime/Attention).
*   **System 2 (Analytische Tiefe):** Vollständige Offenlegung von Slippage, Orderbuch-Tiefe, Gebührenstruktur und mathematischem Audit-Trail bei jeder Orderplatzierung.

---

## III. ENTWICKLUNGS- & ARCHITEKTURGESETZE

1.  **Das Protokoll IST der Agent:** Verhaltensweisen und Parameter werden deklarativ in Protokollen gesteuert; Code ist ein schlanker, typsicherer Executor.
2.  **DTO-Driven Component Pattern:** Layout-Komponenten sind Presentational Dumb Components unter `src/components/`. Geschäftslogik und Datenaufbereitung erfolgen vorab in DTO-Buildern.
3.  **Client-Isomorphismus:** Node.js-Module (`fs`, `dns`, `path`, `child_process`) dürfen niemals in clientseitig importierten Modulen aufgerufen werden.
4.  **Zero-Byte Protection:** Zentrale Stylesheets und Assets dürfen niemals überschrieben oder geleert werden.
5.  **Task Hygiene & Active Process Cleanup:** Alle Hintergrund-Prozesse, Daemons und temporären Worker müssen nach getaner Arbeit unverzüglich terminiert werden (`manage_task kill`).
6.  **Strikte Repository-Isolation:** Monetarium ist ein eigenständiges Finanzmarkt- und Quant-Projekt. Keine Übernahme von Landingpage-SEO-, AWG- oder Webseiten-Qualitätsmetriken.

---

## V. DAS GESAMTBÖRSENMARKT-PRINZIP (Global Market Radar & Intermarket Confluence)

### 1. Ganzheitlicher Markt-Zustandsraum
Monetarium operiert nicht in einer isolierten Insel einzelner Symbole, sondern betrachtet den gesamten globalen Börsen- und Finanzmarkt:
\[ M_{\text{global}} = \left( \mathcal{I}_{\text{equities}}, \mathcal{I}_{\text{indices}}, \mathcal{I}_{\text{commodities}}, \mathcal{I}_{\text{yields}}, \mathcal{I}_{\text{fx}}, \mathcal{I}_{\text{crypto}} \right) \]
*   **Globale Leitindizes:** S&P 500, Nasdaq 100, DAX 40, Dow Jones, Nikkei 225.
*   **Volatilitäts- & Risiko-Anker:** CBOE Volatility Index (VIX), US 10-Year Treasury Yields (^TNX), Dollar-Index (DXY).
*   **Rohstoff-Fundament:** Gold (XAU), WTI/Brent Crude Oil.
*   **Krypto-Makro:** Bitcoin (BTC) Dominanz und Spot-Nettozuflüsse.

### 2. Intermarket Macro-Operator \( \Omega_{\text{Macro}} \)
Der Alpha-Hypothesen-Generator \( F \) bettet jedes Einzelsignal in den Makro-Operator ein:
\[ F_{\text{signal}}(s) = f_{\text{local}}(s) \times \Omega_{\text{Macro}}(M_{\text{global}}) \]
wobei:
*   \( \Omega_{\text{Macro}} \in [-1, +1] \) das globale Marktregime quantifiziert:
    - **Risk-On (\( \Omega > +0.3 \)):** S&P 500 / Nasdaq im Aufwärtstrend, VIX < 18, fallende/stabile Renditen. Begünstigt Trendfolge- und Momentum-Strategien.
    - **Risk-Off (\( \Omega < -0.3 \)):** S&P 500 im Abwärtstrend, VIX > 22, Flucht in Gold/Anleihen. Drosselt Long-Exposures, aktiviert Hedging (`COLLAR_CYLINDER`, `CPPI_CAPITAL_FLOOR`).
    - **Volatility Expansion (\( \text{VIX} > 28 \)):** Notfall-Blackout oder zwingende Reversion-Gitter (`STRADDLE_VOLATILITY`, `MEAN_REVERSION_GRID`).

### 3. Offenes Asset-Universum & Universal Discovery
Kein Asset auf Monetarium ist statisch limitiert. Jeder liquide Titel der weltweiten Börsenmärkte kann über die einheitlichen Routing-Engines (CCXT, Alpaca, VirtualExchange) dynamisch gesucht, analysiert und beordert werden.

---

## VI. DAS REAL-DATA SENTINEL PRINZIP (Datenintegritäts-Operator \( \mathcal{D}_{\text{real}} \))

### 1. Datenintegritäts-Mandat
Kein externes Marktdatum (Binance, CCXT, Alpaca, Forex Factory CDN) darf unvalidiert in die Analyse- oder Trading-Engines gelangen. Der **Data Sentinel Agent** (`DataIntegrityAgent`) setzt den vorgeschalteten Operator \( \mathcal{D}_{\text{real}} \) durch:
\[ \mathcal{D}_{\text{real}}: \mathcal{S}_{\text{raw}} \longrightarrow \mathcal{S}_{\text{verified}} \]
wobei jede Zeitreihe \( \mathcal{S}_{\text{verified}} \) die 4 unumstößlichen Daten-Invarianten erfüllt:
1. **Geometrische Konsistenz:** \( H \ge \max(O, C) \land L \le \min(O, C) \land L > 0 \land V \ge 0 \).
2. **Monotonie & Lückenlosigkeit:** Strikte Zeitchronologie \( t_k > t_{k-1} \) ohne Duplikate mit automatischer Gap-Reparatur.
3. **Bad-Tick & Flash-Spike Filter:** Isolierung von Datenartefakten und API-Glitsches (\( |\Delta P| > 25\% \)).
4. **Stale Data Veto & Auto-Failover:** Latenzüberwachung und sofortiger Umschaltmechanismus (Binance $\to$ CCXT $\to$ Resilient Mirror).

