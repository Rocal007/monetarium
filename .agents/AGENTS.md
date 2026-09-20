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

### 3. Visibility Supremacy-Gleichung & Q_NEXUS
Die totale Sichtbarkeit (\( V_{\text{NEXUS}} \)) unter Wahrung radikaler Objektivität (RO):
\[ V_{\text{NEXUS}} = \left[ \sum_{i} (Sind_i \cdot Walg_i) \right] \cdot \lim_{\Delta_{\text{CoP}} \to 0} \left( \frac{\Omega_{\text{RO}}(L, J)}{\Delta_{\text{CoP}}(J) + \epsilon} \right) \]

#### Der Q_NEXUS Qualitäts-Score:
Jeder Build- und Generierungsprozess berechnet diesen Score:
\[ Q_{NEXUS} = w_1 \cdot S + w_2 \cdot V + w_3 \cdot L + w_4 \cdot (S \cdot V \cdot L) \]
mit \( \sum w_i = 1 \)
*   **S (Syntax-Hülle-Score):** Technische Perfektion (JSON-LD, semantisches HTML5, Web Vitals) [0, 1].
*   **V (Verifikations-Score):** Einhaltung rechtlicher Guardrails (Null Fehler in AXIOM & Judikative) [0, 1].
*   **L (Lupos-Score):** Neurodidaktik und Lesbarkeit (Flesch-Reading-Ease) [0, 1].
*   **\( S \cdot V \cdot L \):** Interaktions-Synergie-Term zur Belohnung ganzheitlicher Exzellenz.

---

## II. NEURODIDAKTIK & COMMUNICATIONS KYBERNETIK

### 1. Vera F. Birkenbihl-Gleichung (VFB-System-Modell)
Gehirngerechte Informationsverarbeitung im UX- und Text-Design:
\[ \mathbf{W_{\text{aktiv}} = \left( \sum_{i=1}^{n} (V_i \times A_i) \right) \cdot \left[ \frac{\text{Dekodierung}}{\text{Pauken} \to 0} \right] \cdot \eta_{\text{Spiel}}} \]
*   \( \mathbf{W_{\text{aktiv}}} \): Aktives Wissens-Netz im Langzeitgedächtnis des Nutzers.
*   \( V_i \times A_i \): Assoziations-Matrix aus Vorwissen (\( V \)) und Impulsen (\( A \)).
*   \( \frac{\text{Dekodierung}}{\text{Pauken} \to 0} \): Lern-Effizienz-Quotient (intuitives Verständnis statt kognitiver Überlastung).
*   \( \eta_{\text{Spiel}} \): Wirkungsgrad des Spieltriebs (interaktive Rechner, Gamification, Dopamin).

### 2. Kognitives Dualitätsmodell
*   **System 1 (Cognitive Fluency):** Reibungslose, blitzschnelle Orientierung durch visuelle Hierarchie, klare Affordance und Null Ladezeit.
*   **System 2 (Rationaler Wächter):** Analytische Prüfung. Wird durch hohle Werbefloskeln („innovativ“, „einzigartig“) alarmiert und durch unbestechliche Sachlichkeit (\( \Omega_{\text{RO}} \)) beruhigt.

### 3. Der 4D-Kommunikationsvektor
\[ \vec{M} = \begin{pmatrix} M_{\text{Sach}} \\ M_{\text{Beziehung}} \\ M_{\text{Selbstoffenbarung}} \\ M_{\text{Appell}} \end{pmatrix} \]
*   **Sachebene (\( M_{\text{Sach}} \)):** Reine Fakten, transparente Parameter (Radical Objectivity).
*   **Beziehungsebene (\( M_{\text{Beziehung}} \)):** Lokale und fachliche Nähe (LINGUA-LOCA).
*   **Selbstoffenbarung (\( M_{\text{Selbstoffenbarung}} \)):** Souveräne Autorität ohne defensive Floskeln.
*   **Appellebene (\( M_{\text{Appell}} \)):** Klarer, logischer und barrierefreier Handlungsaufruf.

### 4. Cicero-7Q-Vektor (7Q-Completeness-Check)
Jede Inhalts- und UI-Komponente befüllt die 7 Säulen:
*   **QUIS (Wer):** Entität, Verifizierung, Autorität, E-E-A-T.
*   **QUID (Was):** Der exakte Gegenstand / Service ohne Verzierung.
*   **UBI (Wo):** Räumliche oder situative Präzision.
*   **QUIBUS AUXILIIS (Womit):** Verwendete Werkzeuge, Standards, Zertifikate.
*   **CUR (Warum):** Logischer Handlungsdruck / Sachgrund.
*   **QUOMODO (Wie):** Transparenter, nachvollziehbarer Ablauf.
*   **QUANDO (Wann):** Zeitfenster, Gültigkeit, Aktualität.

---

## III. REGIONAL-LINGUISTIC ADAPTATION (LINGUA-LOCA)

Der regionale Anpassungsoperator \( \Lambda_{\text{local}} \):
\[ \Lambda_{\text{local}}(T_{\text{src}}, g) = \left[ (T_{\text{src}} \setminus F_{\text{sterile}}) \otimes M_{\text{vocab}}(g) \right] + \vec{S}_{\text{syntax}}(g) \cdot \eta_{\text{tonality}}(g) \]

*   **Vermeidung steriler Floskeln:** Elimination von unpassenden Standardphrasen (\( F_{\text{sterile}} \)).
*   **Branchenspezifisches Routing:** Angepasste Rollenbegriffe und Tonalität je nach Fachgebiet.
*   **Rechtskonforme Transformation:** Vor dem Fixieren im Cache (\( C \)) zwingende Überprüfung durch Legislative (\( L \)) und Judikative (\( J \)):
    \[ T_{\text{compliant}} = P_J \left( D_L \left( \Lambda_{\text{local}}(T_{\text{src}}, g) \right) \right) \]

---

## IV. ENTWICKLUNGS- & ARCHITEKTURGESETZE

1.  **Das Protokoll IST der Agent:** Verhaltensweisen und Parameter werden deklarativ in Protokollen gesteuert; Code ist ein schlanker, typsicherer Executor.
2.  **DTO-Driven Component Pattern:** Layout-Komponenten sind Presentational Dumb Components unter `src/components/`. Geschäftslogik und Datenaufbereitung erfolgen vorab in DTO-Buildern.
3.  **Client-Isomorphismus:** Node.js-Module (`fs`, `dns`, `path`, `child_process`) dürfen niemals in clientseitig importierten Modulen aufgerufen werden.
4.  **Zero-Byte Protection:** Zentrale Stylesheets und Assets dürfen niemals überschrieben oder geleert werden.
5.  **Task Hygiene & Active Process Cleanup:** Alle Hintergrund-Prozesse, Daemons und temporären Worker müssen nach getaner Arbeit unverzüglich terminiert werden (`manage_task kill`).
6.  **Core-System Integration:** Verknüpfung mit den zentralen Nexus-Core-Definitionen (`E:\Nexus-app\nexus`).

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
