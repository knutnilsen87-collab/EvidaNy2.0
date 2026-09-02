# CLAUDE.md — arbeidsregler for EVIDA 2.0

Dette er arbeidsreglene for alle Claude Code-økter i dette repoet. De er bindende.

## Harde regler

1. **Verifiser, aldri anta.** Dokumentasjon kan avvike fra kode. Koden på disk er fasit. Rapporter avvik i stedet for å «rette» stille.
2. **Ingen parallell autoritet.** Nøyaktig én backend (`backend/saksrom-api`) eier auth, tenant, policy, audit og provider-routing. Ingen ny FastAPI-kjerne, ingen Node-BFF med autorisasjonsbeslutninger, ingen frontend-state som sannhet.
3. **Flyway V001–V012 er frosset historikk.** Byte-identiske. Aldri redigere, renummerere eller slå sammen. Nye tabeller i V013+, alltid additivt.
4. **UUID-er overlever.** Ingen rename av `cases` til `matters`. UI kan si «sak», API sier `/cases`.
5. **Ingen stille degradering (I-07).** En skjerm som viser demodata uten at det står at det er en demonstrasjon, er et produktbrudd. Ukoblede flater bruker `EmptyState` med ærlig tekst.
6. **Fasegater.** Hver fase avsluttes med verifikasjon og rapport i `docs/progress/PHASE_<n>_REPORT.md`. Ikke gå videre uten klarsignal fra brukeren.
7. **Ingen fabrikerte testresultater.** Ikke kjørt = skriv «ikke kjørt». `BUILD SUCCESS` kommer fra faktisk output.

## STATUS BUNDLE RULE

`status_bundle.txt` is the single source of truth for current operational project state.

Every material project change MUST update `status_bundle.txt` before the change is considered complete. No commit may knowingly leave `status_bundle.txt` stale.

Before beginning work:
1. read `status_bundle.txt`;
2. verify `git status`;
3. verify that the bundle matches the repository;
4. correct the bundle if stale before continuing.

`status_bundle.txt` does not override authoritative specifications or ADRs. If code and bundle disagree, the code/repo is the evidence — correct the bundle immediately; never adjust code to match a stale bundle. The bundle represents CURRENT STATE, not history (history belongs to git, ADRs and phase reports); keep it compact (~300–1000 lines).

## Git-commit-regel

Commits skal være små og semantiske (`docs:`, `chore:`, `feat(scope):`, `migration:`, `fix:`). Før commit: relevante tester → `git diff`-review → status_bundle-oppdatering → `git status` → commit. Aldri commit secrets, build-binaries eller `Claude Setup*.exe`.

## Låste beslutninger

| # | Beslutning |
|---|---|
| A-1 | `saksrom-api` (Java 21 / Spring Boot 3.3.7) er eneste autoritative backend og policy enforcement point. Etter fase 2: `backend/saksrom-api` |
| A-2 | Python tillatt kun bak typede worker-kontrakter (OCR, ekstraksjon, evaluering). Aldri som Core API |
| A-3 | PostgreSQL 16 beholdes. Oppgradering til 18 er eget prosjekt med restore-test |
| A-4 | Temporal innføres ikke nå. `ingestion_jobs` med heartbeat og stale recovery beholdes. Se ADR-003 og ADR-006 (utkast) |
| A-5 | pgvector innføres ikke i denne runden. Gjenfinning er applikasjonsstyrt søk over kildeklare sideenheter |
| A-6 | Ingen Legal Authority Graph, issues, arguments eller agenter i denne runden |
| A-7 | Rettssalen får ingen egne tabeller. Leser konflikter og hull, skriver kun forslag |
| A-8 | `case_canvases` (JSON) tegner lerretet. Avgjør aldri om en eksport er klar |
| A-9 | RLS aktiveres på alle nye tabeller fra V013, selv om V001–V012 ikke har det. Se ADR-004 |
| A-10 | Frontenden samler alle HTTP-kall i én modul: `frontend/src/api/client.ts` |
| A-11 | **`tenant_id` er kanonisk kolonnenavn.** Der Architecture v2.0 sier `firm_id`, betyr det samme domenekonsept. Nye tabeller bruker `tenant_id`. Ingen rename av eksisterende kolonner. Se ADR-005 |
| A-12 | Eksisterende Java/Spring-backend er teknologisk baseline. Arkitekturprinsipper fra Architecture v2.0 implementeres idiomatisk i Spring; moden, testet eksisterende implementasjon som oppfyller samme krav beholdes, og avvik dokumenteres med ADR |

## Autoritetsrekkefølge ved konflikt

1. Eksplisitte beslutninger gitt etter Architecture v2.0 (dette dokumentet + ADR-er)
2. `docs/spec/EVIDA_Backend_Architecture_v2.0.md`
3. `docs/spec/EVIDA_UI_UX_Specification.md`
4. Eksisterende fungerende produktadferd
5. `docs/spec/CTO-handoff_Backend_v1.md`
6. Eldre prototypeadferd

Prototypen er UX-/produktreferanse, ikke teknisk fasit. Ved konflikt mellom dokumenter og faktisk kode gjelder koden — rapporter avviket.

## Gammelt repo

`F:\prosjekter_MAIN\EVIDA` er READ-ONLY kilde frem til eksplisitt cutover (fase 2, krever oppgitt commit-SHA). Aldri kopier fra working tree, aldri anta HEAD.

## PR-mal (obligatorisk for alt som påvirker readiness)

```markdown
## First User Readiness Impact
- Scope:
- P0/P1/P2:
- Tests added/updated:
- Manual smoke:
- Artifacts:
- Invariants affected:
- Residual risk:
- Rollback path:
```

En feature er ikke ferdig før den har: autorisasjonstest, cross-tenant-test, audit-event, observability, API-schema, idempotens der relevant, definert feil-UX, og migrasjonsrollback.
