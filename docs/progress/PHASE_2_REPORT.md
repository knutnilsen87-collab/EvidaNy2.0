# PHASE 2 REPORT — Kontrollert repository-cutover

Dato: 2026-09-03. Status: **PASS** (med B-001/B-002 fortsatt åpne — de blokkerer fase 3, ikke fase 2).

## Cutover-kilde

- **Legacy-commit:** `d92aef0876444a4ce1174bf1529eab081c5ae54d`
- **Tag:** `evida-v2-cutover` (branch `codex/web-real-client-readiness`)
- Fryse-commiten («chore: freeze EVIDA legacy cutover snapshot») inneholder nøyaktig 24 filer: canvas-settet (V012, `canvas/`-pakken main+test, `Permission.java`, `AuthorizationService.java`) og godkjent frontend-infrastruktur (`auth.ts` hardened, `aiStream.ts`, `streaming/` (7 filer), `canvasApi.ts` + test, `domain/` (3 filer)). Ingen UI, artifacts eller urelaterte endringer.
- Klassifiseringen var entydig (ingen UNCERTAIN-filer), så cutover-punktet ble etablert uten stopp, i tråd med BESLUTNING 2.

## Canvas-beslutning

**INKLUDERT.** Verifisert konsistent: importerer kun committed pakker + de to permission-filene; alle repository-queries er tenant-skopet (`findByTenantIdAndCaseId`, kilde-validering per tenant); controller krever `CASE_CANVAS_READ`/`CASE_CANVAS_WRITE` via `AuthorizationService`; lagring auditeres (`CASE_CANVAS_SAVED`). Ingen ny vei rundt autorisasjon.

## Migrert

| Hva | Til | Commit |
|---|---|---|
| `saksrom-api` (via `git archive` fra taggen — ingen untracked støy) | `backend/saksrom-api` | `06852e2` |
| Klientinfrastruktur: lib (auth, api, aiStream+streaming, uploadQueue/-Preparation/-Policy, hashWorker, CitationManager, sourceUnits, canvasApi) + domain (caseCanvas, sourceUnitRef) + alle tester | `frontend/src/{api,lib,domain}` | `0d2cbc1` |
| `deploy/pilot/docker-compose.yml` + `nginx.conf` + README | `docker-compose.dev.yml` + `deploy/` | `20e0995` |

Nye filer: `frontend/src/api/client.ts` (eneste HTTP-transportmodul, A-10 — `api.ts`, `auth.ts`, `aiStream.ts`, `canvasApi.ts` refaktorert til å rute all transport gjennom den, semantikk bevart); `frontend/src/lib/features.ts` (gjenskapt — legacy-filen var untracked og utenfor fryse-settet; kun `EVIDA_STREAM_MODE` som de migrerte libene bruker); scaffold (`package.json`, `tsconfig.json`, `vitest.config.ts`). Ingen legacy-UI migrert.

## Verifikasjoner (faktisk output)

1. **V001–V012 byte-identisk:** SHA-256 per fil matcher taggen — 12/12 OK.
2. **Backend-tester** (`mvnw.cmd test` fra `backend/saksrom-api`): **179 tester, 0 feil, 4 skipped, BUILD SUCCESS.**
   - Skip-avvik mot fase 0 (3→4), analysert: `PdfBoxDocumentParserTest` har to tester som `assumeTrue`-skipper hvis den manuelle, ukommitterte fixturen `..\..\..\testpakker\Masterdoc_001_Kompleks_Saksbehandling.pdf` mangler. Stien løses relativt fra modulmappen: i legacy traff den `EVIDA\testpakker\` (finnes), fra ny plassering `F:\prosjekter_MAIN\testpakker\` (finnes ikke) → én ekstra skip. Miljøbetinget, ingen regresjon; samme 179 tester, 0 feil.
3. **Database:** Flyway-kjeden kjørt mot **tom** PostgreSQL 16 i Docker (`postgres:16-alpine`, flyway-maven-plugin 10.10.0): 12/12 `success=t` i riktig rekkefølge, 14 domene-tabeller opprettet inkl. `case_canvases`. Container revet ned. V013 er IKKE opprettet.
4. **Security-regresjon:** Alle relevante testklasser grønne fra ny plassering: TenantContextFilter (3), AuthorizationService (3), CurrentUserService (5), AuthController (1), Audit* (4), CaseCanvasService (4), Policy/ProviderPolicy (5), DocumentQuarantine (9), LocalDocumentStorage (9), ClamAv (2+1 skip), upload-/hash-dekning i DocumentController-suitene. Canvas: tenant-skopet + permission-gatet + auditert (kodegjennomgang, over). **Ingen regresjon funnet.** Gap notert som tech debt: ingen dedikert cross-tenant-integrasjonstest for canvas-endepunktene.
5. **Frontend-libs:** `vitest run` — **63/63 tester i 13 filer PASS**; `tsc --noEmit` clean.
6. **Compose:** `docker compose config` validerer. Alle seks tjenester bevart; kun sti-/navneendringer. `web`-tjenesten kan ikke bygges før ny frontend har Dockerfile (fase 3–4) — dokumentert i filen.
7. **Hygiene:** ingen secrets, `.env`, binaries, build-artifacts eller absolutte stier i det som ble committet; `Claude Setup*.exe` og `node_modules`/`target/` ignorert.

## Arkivmarkør

`ARCHIVED.md` skrevet i legacy-rot med dato, cutover-SHA/tag, nytt repo-path og beskjed om at repoet ikke er aktiv utviklingskilde. Filen er bevisst **ikke committet** i legacy — fryse-commiten var den eneste autoriserte; si ifra hvis den skal committes. Ingenting slettet.

## Definition of Done

- [x] explicit cutover source exists (`d92aef0` / `evida-v2-cutover`)
- [x] Canvas inclusion resolved (inkludert, verifisert)
- [x] backend migrated
- [x] V001–V012 verified (SHA-256 + ren kjede mot tom Postgres)
- [x] backend tests pass (179/0/4, avvik forklart)
- [x] security regression checks pass
- [x] selected frontend libs migrated
- [x] old UI not migrated
- [x] client.ts rule satisfied (ingen direkte fetch utenfor client.ts/tester)
- [x] compose migrated
- [x] legacy archive marker created after successful cutover
- [x] no secrets/binaries committed
- [x] status_bundle.txt current
- [x] EvidaNy2.0 worktree clean (etter docs-commit)
- [x] Phase 2 report (denne)

## Gjenstående blockers

B-001/B-002 (specs mangler — HARD for fase 3–6), B-003 (CTO-handoff, SOFT), B-005 (Canvas.dc.html, MEDIUM for fase 3-lerretstokens).

**Fase 3 starter ikke uten specs + eksplisitt klarsignal.**
