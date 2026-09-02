# PHASE 1 REPORT — Skjelett og styringsdokumenter

Dato: 2026-09-02. Utført etter klarsignal for fase 1 med de elleve autoritative beslutningene (arbeidsmappe, tenant_id, Java-baseline, docs/spec-prioritet, cutover-krav, Temporal-kartlegging, Evidence Compiler-nivåer, SSE-target, OCR-gate, ingen ny UI, kun fase 1).

## 1. Filer opprettet/endret

**Rot:** `README.md`, `CLAUDE.md`, `.gitignore`

**docs/:** `INVARIANTS.md` (byte-identisk kopi av `PRODUCT_INVARIANTS.md`, SHA-256 verifisert: `dde80569…`), `FIRST_USER_READINESS_MATRIX.md` (byte-identisk, `a83b3faf…`), `SCREEN_MATRIX.md` (Vedlegg B utfylt med verifiserte ruter fra fase 0), `STATUS_PROJECTION.md` (Vedlegg A), `EXPORT_PREDICATES.md` (Vedlegg C, terminologi justert til tenant), `INVENTORY.md` (fra fase 0, uendret)

**docs/ADR/:** ADR-001 (byte-identisk kopi, `e3ba6f90…`), ADR-002–ADR-006 (nye, se under)

**docs/architecture/:** `ASYNC_WORKFLOWS.md`, `SSE_EVENT_MAP.md`, `EVIDENCE_COMPILER_LEVELS.md`, `OCR_QUALITY_GATE.md`

**docs/spec/:** `README.md` (prioritetsrekkefølge) + `prototype/` (utpakket fra `Kirkerud mot Ås prototype.zip`: `EVIDA Prototype.dc.html` 145 KB, `support.js`, `uploads/` med 15 bilder, `.thumbnail`)

**Struktur:** `backend/`, `frontend/src/{api,design,components,screens,domain,lib}`, `scripts/`, `docs/progress/` — tomme med `.gitkeep`

**Gammelt repo:** uendret (read-only respektert). `ARCHIVED.md` er bevisst IKKE skrevet dit — utsatt til cutover i fase 2, jf. ADR-002 pkt. 4.

## 2. ADR-er

| ADR | Status | Innhold |
|---|---|---|
| ADR-001 backend-ownership | accepted (kopiert uendret) | Spring Boot eier kontrollplanet |
| ADR-002 repo-consolidation | accepted | Nytt repo; gammelt repo read-only → arkiv; cutover krever eksplisitt SHA; ARCHIVED.md ved cutover |
| ADR-003 no-temporal-no-pgvector-v1 | accepted | A-4 + A-5 med begrunnelse |
| ADR-004 rls-from-v013 | accepted | A-9: RLS + FORCE + policy på alle nye tabeller; app-rollen eier ikke og har ikke BYPASSRLS |
| ADR-005 tenant-id-canonical | accepted | `firm_id` i spec ≡ eksisterende `tenant_id`; nye tabeller bruker `tenant_id` |
| ADR-006 temporal-adoption | **draft** | Kartlegging, adopsjonskriterier, inkrementell 3-fase migrasjonssti; ingen implementasjon |

## 3. Avvik gammel backend vs. Architecture v2.0

Architecture v2.0-dokumentet er fortsatt ikke tilgjengelig (mangler i docs/spec), så avvikene under er mot det som er referert i bootstrap-prompten og klarsignalet:

1. `firm_id` (spec) vs. `tenant_id` (kode) — løst ved ADR-005, kode vinner.
2. Temporal (spec target) vs. `ingestion_jobs`-mekanisme (kode) — løst ved ADR-003/006: moden implementasjon beholdes, adopsjon kun etter kriterier.
3. SSE-eventnavn (Vedlegg C target) vs. faktiske events — mappet i `SSE_EVENT_MAP.md`; kun `finding`/`done`/`error` overlapper; tre target-events mangler og innføres additivt i fase 5–6.
4. Grounding: spec-nivåene (Evidence Compiler 1–4) finnes ikke i koden; fase 6 bygger kun Level 1, dokumentert i `EVIDENCE_COMPILER_LEVELS.md`.
5. OCR-gating: confidence lagres, men target-gaten (6 elementer) mangler — `OCR_QUALITY_GATE.md`; FU-064 forblir BLOCKED/PARTIAL.
6. RLS: finnes ikke i V001–V012; innføres fra V013 (ADR-004), retrofit er eget prosjekt.

## 4. Kan gjenbrukes direkte (fase 2/4)

- Hele `saksrom-api` (kopieres uendret i fase 2 fra cutover-SHA; 179 tester grønne per fase 0).
- Flyway V001–V012 byte-identisk (SHA-256-verifikasjon per fil er fase 2-krav).
- `deploy/pilot/docker-compose.yml` + `nginx.conf` (gateway, oauth2-proxy, web, api, postgres 16.14, clamav) som utgangspunkt for `docker-compose.dev.yml`.
- Fra `apps/web/src/lib`: `auth.ts`, `aiStream.ts` (+ `streaming/`), `uploadQueue.ts`, `uploadPreparation.ts`, `uploadPolicy.ts`, `hashWorker.ts`, `CitationManager.ts`, `sourceUnits.ts`, `canvasApi.ts`, `api.ts` — alle med tester.

## 5. Må migreres/tilpasses (ikke kopieres blindt)

- Web-lib-filene over: import-stier, env-navn (`VITE_EVIDA_API_BASE_URL`), og omskriving til å konsumere `frontend/src/api/client.ts` som eneste HTTP-punkt (A-10).
- SSE-klienten: utvides til target-kontraktens events per `SSE_EVENT_MAP.md` (additivt).
- Docker-compose: stier, image-referanser for web (ny frontend), volumer.
- UI-komponenter i `apps/web/src/components`: skal IKKE migreres — ny UI bygges fra prototypen/UI/UX-spec i fase 3.
- CourtEngine-/Enterprise-endepunktene: følger med backend-kopien, men får ingen skjermer uten egen beslutning (`SCREEN_MATRIX.md`).

## 6. Nye blockers

| # | Blocker | Blokkerer |
|---|---|---|
| B-1 | `EVIDA_Backend_Architecture_v2.0.md` mangler i docs/spec | Fase 3–6-implementasjon; kap. 67.3-mønsteret for RLS-policy (ADR-004) kan ikke verifiseres |
| B-2 | `EVIDA_UI_UX_Specification.md` mangler i docs/spec | Fase 3 (designsystem) |
| B-3 | `CTO-handoff_Backend_v1.md` mangler (docx i gammelt repo dekker annet tema) | Lav — prioritet 5 i konfliktrekkefølgen |
| B-4 | Cutover-SHA/tag ikke valgt | Fase 2 |
| B-5 | `Canvas.dc.html` fantes ikke i prototype-zip-en | Fase 3-tokenekstraksjon fra lerretsflaten; enten finnes filen et annet sted, eller så ekstraheres lerretet fra hovedprototypen |

## 7. Nøyaktig hva som kreves for fase 2

1. **Cutover-commit:** eksplisitt SHA eller tag i gammelt repo som er kilden for kopiering. Merk fra fase 0: branchen `codex/web-real-client-readiness` har mange ukommitterte endringer, bl.a. i `AuthorizationService.java` og `Permission.java` — det må avgjøres om disse skal committes først (og inngå) eller utelates. Jeg kopierer ikke fra working tree.
2. Bekreftelse på at `deploy/pilot/docker-compose.yml` (fra samme SHA) er kilden for `docker-compose.dev.yml`.
3. Klarsignal for å skrive `ARCHIVED.md` i gammelt repo ved cutover (opphever read-only for akkurat den filen).
4. Lokalt miljø for fase 2-verifikasjon: Docker (Postgres/ClamAV) tilgjengelig, JDK 21 (bekreftet — testene kjørte i fase 0).

## 8. Git-status

Se terminaloutput i chatrapporten. Repo initialisert (`git init`), alle filer over er untracked — **ingen commit er gjort**; venter på godkjenning av fase 1-innholdet.

## 9. Teststatus

Ingen produksjonskode berørt i fase 1 (kun dokumentasjon, struktur og kopier). Ingen tester kjørt i denne fasen; siste verifiserte backend-status er fase 0: 179 tester, 0 feil, 3 miljøavhengige skip, BUILD SUCCESS.
