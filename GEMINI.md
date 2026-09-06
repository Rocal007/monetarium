# MONETARIUM — Agent Workspace

Dieses Projekt folgt den NEXUS-Spezifikationen und dem System-Operator-Modell.

## Architektur & Agenten-Referenzen
- **Master SSOT:** [.agents/AGENTS.md](file:///.agents/AGENTS.md)
- **Entwicklungsregeln:** [.agents/rules/programming.md](file:///.agents/rules/programming.md)
- **Workflows:** [.agents/workflows/audit.md](file:///.agents/workflows/audit.md)
- **Spezialisierte Agenten:**
  - [Orchestrator](file:///.agents/agents/orchestrator/AGENT.md)
  - [Trading Multi-Subagents](file:///.agents/agents/trading/AGENT.md)
  - [Judikative Officer](file:///.agents/agents/judikative/AGENT.md)
  - [Visium UI Agent](file:///.agents/agents/visium/AGENT.md)
  - [Content Architect](file:///.agents/agents/content-architect/AGENT.md)

## Globale Arbeitsrichtlinien
- **Systemoperator:** \( T = C \circ P_J \circ D_L \circ F \)
- **Task-Hygiene:** Beende alle Hintergrund-Tasks nach Ausführung (`manage_task kill`).
- **Strict Typing:** TypeScript strict, Presenter-DTO-Pattern, keine unbereinigten Prozesse.
