# EVIDA 2.0

Konsolidert repo for EVIDA — juridisk kommandosenter med kildebundet AI.

Dette repoet samler den eksisterende, testede Spring Boot-backenden (`backend/saksrom-api`, flyttes inn i fase 2) med en ny frontend (`frontend/`) bygget etter EVIDA UI/UX-spesifikasjonen og Kirkerud mot Ås-prototypen.

Det gamle repoet `F:\prosjekter_MAIN\EVIDA` er lesekilde frem til cutover og arkiv etterpå. Se `docs/ADR/ADR-002-repo-consolidation.md`.

## Struktur

```
docs/            styringsdokumenter, ADR-er, arkitektur, spesifikasjoner
docs/spec/       autoritative spesifikasjoner + prototype (se docs/spec/README.md)
backend/         saksrom-api (Java 21 / Spring Boot 3.3.7) — fylles i fase 2
frontend/        ny React/Vite/TS-frontend — bygges i fase 3–4
scripts/         dev-up, verifikasjon
```

## Arbeidsregler

Se `CLAUDE.md`. Kort versjon: verifiser, aldri anta; én autoritativ backend; Flyway V001–V012 er frosset; ingen stille degradering; fasegater med rapport og stopp.

## Fasestatus

| Fase | Status | Rapport |
|---|---|---|
| 0 — Inventar | Ferdig | `docs/INVENTORY.md` |
| 1 — Skjelett og styringsdokumenter | Ferdig | `docs/progress/PHASE_1_REPORT.md` |
| 2 — Backend-transplantasjon | Venter på cutover-SHA | — |
| 3 — Designsystem | Ikke startet | — |
| 4 — API-klient og skjermer | Ikke startet | — |
| 5 — Nye migrasjoner/endepunkter | Ikke startet | — |
| 6 — Grounding-gate | Ikke startet | — |
