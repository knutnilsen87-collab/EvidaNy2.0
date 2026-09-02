# docs/spec — autoritative spesifikasjoner

Denne mappen er autoritativ kilde for domenemodell, sikkerhetsprinsipper, workflow-arkitektur og UI/UX i EVIDA 2.0.

## Innhold (forventet)

| Fil | Status per 2026-09-02 |
|---|---|
| `EVIDA_Backend_Architecture_v2.0.md` | **MANGLER — må legges inn av bruker** |
| `EVIDA_UI_UX_Specification.md` | **MANGLER — må legges inn av bruker** |
| `CTO-handoff_Backend_v1.md` | **MANGLER** (dersom tilgjengelig; docx-en i gammelt repo, `Evida_CasePilot_CTO_Handoff_MultiWindow_Settings_Security.docx`, dekker et annet tema og er ikke antatt å være denne) |
| `prototype/` | På plass — utpakket fra `Kirkerud mot Ås prototype.zip` (gammelt repo, 2026-08-01) |

`prototype/` inneholder `EVIDA Prototype.dc.html` (~145 KB React-logikk), `support.js` og `uploads/` med skjermbilder. Merk: `Canvas.dc.html`, som bootstrap-prompten refererer til, fantes ikke i zip-en.

## Prioritetsrekkefølge ved konflikt

1. **Eksplisitte beslutninger gitt etter Architecture v2.0** — ADR-er i `docs/ADR/` og låste beslutninger i `CLAUDE.md`
2. **EVIDA Backend Architecture v2.0**
3. **EVIDA UI/UX Specification**
4. **Eksisterende fungerende produktadferd** (verifisert kode i gammelt repo / `backend/`)
5. **CTO-handoff Backend v1**
6. **Eldre prototypeadferd**

Prototypen brukes som UX-/produktreferanse (designbrief for fase 3), ikke som teknisk fasit.

Terminologi: der Architecture v2.0 bruker `firm_id`, leses dette som eksisterende `tenant_id` (ADR-005).
