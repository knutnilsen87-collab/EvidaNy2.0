# CUTOVER RECOMMENDATION — fase 2-kilde fra legacy-repo

Dato: 2026-09-02. Basert på read-only-analyse av `F:\prosjekter_MAIN\EVIDA`. Ingen endringer er gjort i legacy-repoet.

## Sammendrag

```
Recommended source commit:  INGEN EKSISTERENDE COMMIT ER EGNET ALENE.
                            Anbefaling: én ny, scoped commit i legacy som
                            fanger canvas-funksjonen (8 filer, liste under),
                            deretter er den nye SHA-en cutover-kilde.
                            Krever eksplisitt godkjenning (legacy er read-only).

Fallback hvis ingen legacy-commit tillates:
                            HEAD 9db7358cb02470d60b9eeafec72d2b65036f20ff
                            + eksplisitt godkjent filliste (de samme 8 filene)
                            kopiert som navngitt unntak. Mindre ryddig sporbarhet.

Recommended source branch:  codex/web-real-client-readiness
Working tree clean:         NO — 46 modified + 75 untracked
Risk level:                 MEDIUM (LOW etter at test-run fra ren commit bekrefter 179/0/3)
```

## Nøkkelfunn: canvas-funksjonen er ukommittert (B-006)

HEAD `9db7358` inneholder **ikke** canvas: `V012__case_canvas_authority.sql` er untracked, hele `canvas/`-pakken (main + test) er untracked, og `Permission.java`/`AuthorizationService.java` er modifisert (nye `CASE_CANVAS_READ`/`CASE_CANVAS_WRITE` koblet inn i rollekartet). HEAD kompilerer uten canvas (ingen committed fil refererer permissions-ene), men:

- Fase 0-inventaret, testtallet (179) og skjermmatrisen («Sakslerret KOBLET») er basert på working tree **med** canvas.
- Migrasjonsplanen reserverer V013+ for nye tabeller — hvis V012 ikke blir med nå, oppstår nummereringskonflikt senere.
- Cutover fra working tree er forbudt (låst beslutning).

## Legacy-tilstand (verifisert)

```
Branch:            codex/web-real-client-readiness
HEAD:              9db7358cb02470d60b9eeafec72d2b65036f20ff  "Record candidate CI results [skip ci]"
Siste rene commit: HEAD selv er en ren commit; det finnes ingen commit som inneholder canvas
Status:            46 modified, 75 untracked
Diff-omfang:       46 filer, +2376/-1291 (nesten alt i apps/web)
```

## Klassifisering av ukommitterte endringer

### REQUIRED_FOR_CUTOVER — canvas-funksjonen (8 enheter)

| Fil | Type | Hva |
|---|---|---|
| `evida-core/.../db/migration/V012__case_canvas_authority.sql` | untracked | `case_canvases`-tabellen |
| `evida-core/.../api/canvas/` (CaseCanvas, CaseCanvasController, CaseCanvasDtos, CaseCanvasRepository, CaseCanvasService) | untracked | GET/PUT `/api/v1/cases/{id}/canvas` med optimistisk versjon |
| `evida-core/.../test/.../canvas/CaseCanvasServiceTest.java` | untracked | tester canvas-logikken |
| `evida-core/.../security/Permission.java` | M (+2) | `CASE_CANVAS_READ`, `CASE_CANVAS_WRITE` |
| `evida-core/.../security/AuthorizationService.java` | M (+13/-3) | kobler canvas-permissions inn i rollekartet (LAWYER/PARALEGAL/USER får read+write, READONLY får read) |

- **Hva endringen gjør:** komplett, selvstendig feature (A-8: lerret som JSON-projeksjon).
- **Testdekning:** `CaseCanvasServiceTest` + hele suiten grønn i working tree (179/0/3, fase 0). Rollekart-endringen dekkes indirekte (OWNER/ADMIN = allOf).
- **Samsvar med EVIDA 2.0:** ja — V012 og Sakslerret er eksplisitt del av planen (A-8, skjermmatrisen).
- **Risiko ved å ta med:** lav (additiv migrasjon, ingen endring av eksisterende adferd).
- **Risiko ved å utelate:** V012-hull i migrasjonshistorikken, Sakslerret-flaten mister backend, inventaret og testtallet blir ugyldig som fase 2-fasit.

### OPTIONAL — web-lib og verktøy (ikke nødvendig for backend-cutover)

| Filer | Vurdering |
|---|---|
| `apps/web/src/lib/auth.ts` (+8), `aiStream.ts` (+28), `auth.test.ts`, `package.json`/`lock` | Berører gjenbrukskilden for fase 4. Anbefaling: definér gjenbruks-snapshot = samme cutover-commit; da bør disse committes i legacy sammen med canvas ELLER aksepteres som at fase 4 henter lib-filene fra cutover-SHA uten disse forbedringene. Avgjøres senest før fase 4 — blokkerer ikke fase 2 |
| `scripts/pilot/start-evida-pilot.ps1/.test.ts` | Pilot-tooling; nytt repo får egne scripts. Blokkerer ingenting |
| `docs/first-user/FIRST_USER_READINESS_MATRIX.md` (+2 linjer) | Merk: kopien i nytt repo er tatt fra working tree og er dermed 2 linjer nyere enn HEAD-versjonen. Bevisst — kopien matcher evidenstilstanden |

### OBSOLETE — skal ikke med i cutover

- Alle `apps/web`-komponent-/CSS-endringer (StartupGateway, Sidebar, TopBar, m.fl., ~2000 linjer): UI-et erstattes; legacy-UI skal aldri migreres.
- `artifacts/*` (clamav_runtime_result, pilot_start_latest): generert evidens, regenereres av nye løp.
- `Start Evida.bat`: legacy-oppstart.
- De ~75 untracked rotfilene (løse dokumenter, `ny/`, `utvikler-mappe/`, bakgrunnsbilder, zip-er, `EVIDA_Codex_Imp*`): arkivmateriale, ikke kode.

### UNCERTAIN

Ingen ukommitterte endringer i kritisk backend-sti utover canvas-settet. (`test-fixtures/`, `status_bundle_upload_smoke.md` m.fl. er evidens-/verktøymateriale uten fase 2-relevans.)

## Anbefalt prosedyre (krever godkjenning)

1. **Godkjenn én scoped commit i legacy** som KUN inneholder de 8 canvas-enhetene over. Forslag: `feat(canvas): add case canvas authority (V012, endpoints, permissions)`. Alt annet forblir ukommittert/urørt.
2. Tag gjerne commiten: `evida2-cutover`.
3. **Kjør `mvnw.cmd test` fra den rene commiten** (stash/clean klone) — forventet 179/0/3. Avvik på én test = blokkering.
4. Den nye SHA-en oppgis som cutover-kilde; fase 2 kopierer backend + `deploy/pilot/`-compose + (senere, fase 4) web-lib-filene fra samme SHA.
5. Ved cutover skrives `ARCHIVED.md` i legacy (eget godkjenningspunkt, ADR-002).

## Required action before Phase 2

1. Brukergodkjenning av canvas-commit i legacy (eller eksplisitt beslutning om fallback/utsettelse av canvas).
2. Cutover-SHA/tag oppgis eksplisitt.
3. Ren test-run fra cutover-commiten med samme resultat som fase 0.
4. Beslutning om web-lib-endringene (OPTIONAL-tabellen) — kan utsettes til før fase 4.

## Compose-vurdering (fase 2-forberedelse, ikke migrert)

`deploy/pilot/docker-compose.yml` er **clean/committed ved HEAD** og bekreftes som kilde for `docker-compose.dev.yml`. Innhold: gateway (nginx:1.28-alpine, TLS-dir via env), oauth2-proxy v7.15.2 (OIDC, alle secrets via `${VAR:?}` — ingen hemmeligheter i fil), web (build `../../apps/web`), api (build `../../evida-core/services/saksrom-api`; fail-closed env: MFA, rolle-allowlist, ClamAV, kryptert datamount, AI-kall av), postgres 16.14-alpine3.23, clamav (named volume for signaturer), nett edge+internal.

Endringer som kreves etter cutover: api-build-context → `../backend/saksrom-api` (relativt til ny plassering), web-build-context → ny frontend (fase 3–4), og en forenklet dev-variant uten TLS/OIDC-proxy for lokal utvikling. Docker runtime er tilgjengelig lokalt (Docker 29.4.0, verifisert 2026-09-02).

Risk level samlet: **MEDIUM** — synker til LOW når punkt 3 (ren test-run) er bekreftet.
