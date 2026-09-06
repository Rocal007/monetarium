---
trigger: always_on
---

# MONETARIUM Entwicklungsregeln & System-Mandate

Du agierst als Senior Developer und System-Operator für Monetarium. Alle Implementierungen bleiben legacy-frei, strikt typsicher und protokollgesteuert.

## KRITISCHE ENTWICKLUNGS- & BETRIEBSMANDATE

1. **DTO-DRIVEN COMPONENT ARCHITEKTUR (PRESENTER-MUSTER)**:
   Layout-Komponenten sind modulare, reine *Presentational Dumb Components* unter `src/components/`. Komponenten dürfen niemals Inline-Geschäftslogik, Datenbankabfragen oder komplexe Transformationen durchführen. Sämtliche Daten werden vorab in DTO-Buildern zu typsicheren DTOs aggregiert.

2. **CLIENT-ISOMORPHISMUS & NODE-MODULE SCHUTZ**:
   Node.js Built-in Module (`fs`, `dns`, `path`, `child_process`, `net`, `tls`, `os`) dürfen NIEMALS in Modulen importiert werden, die direkt oder transitiv von React Client-Komponenten (`'use client'`) oder Shared-Libraries genutzt werden. Hilfsfunktionen müssen 100% browser-safe und isomorph sein.

3. **TASK HYGIENE & PROAKTIVES PROCESS-CLEANUP MANDAT**:
   Alle Hintergrund-Tasks, Prozesse und temporären Worker, die ihren Zweck erfüllt haben oder nicht mehr benötigt werden, MÜSSEN vom Agenten ausnahmslos, unverzüglich und proaktiv beendet bzw. terminiert werden (`manage_task kill`). Es dürfen niemals verwaiste oder hängende Node-, Dev-Server- oder Terminal-Prozesse im Hintergrund verbleiben, um Speicherlecks, Dateisperren (`EBUSY`) und Port-Konflikte auszuschließen.

4. **STYLESHEET & ZERO-BYTE SCHUTZ**:
   Modifiziere oder überschreibe NIEMALS zentrale CSS-Dateien wie `globals.css` automatisiert ohne explizite Anweisung. Leere 0-Byte-Dateien zerstören Builds lautlos.

5. **BUILD-BLOCKADEN & CACHE-RESET**:
   Wenn Builds mit "process already running" oder Cache-Inkonsistenzen abbrechen, beende hängende Prozesse und bereinige den Build-Cache (`rimraf .next` / `out`) vor dem Neustart.

6. **PRE-DEPLOY & QUALITY AUDIT MANDAT**:
   Vor jedem Release oder Deployment muss ein vollständiger Qualitäts-Check durchgeführt werden:
   - TypeScript Typprüfung: 0 Fehler.
   - Compliance & Judikative: Keine verbotenen Werbefloskeln oder unzulässigen Garantieversprechen.
   - Neurodidaktik (VFB-Check): Klare Lesehierarchie, verständliche Dekodierung, keine Textwüsten.
