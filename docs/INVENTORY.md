# INVENTORY — Fase 0

Produsert 2026-09-02 ved lesing av `F:\prosjekter_MAIN\EVIDA` (gammelt repo, branch `codex/web-real-client-readiness`, HEAD `9db7358`).
Alle funn under er verifisert mot faktisk kode og faktisk testkjøring, ikke mot dokumentasjon alene.

---

## 1. Spring-tjenesten

- **Sti:** `F:\prosjekter_MAIN\EVIDA\evida-core\services\saksrom-api` — nøyaktig som antatt i bootstrap-prompten.
- **Artifact:** `no.saksrom:evida-api:0.1.0` («Enterprise control plane for Evida»)
- **Java:** 21 (`<java.version>21</java.version>`)
- **Spring Boot:** 3.3.7 (parent `spring-boot-starter-parent:3.3.7`)
- **Nøkkelavhengigheter:** Flyway (+ postgresql-modul), PostgreSQL-driver, H2 (runtime/test), OAuth2 resource server, PDFBox 3.0.3, Tika 2.9.2, Tess4J 5.13.0 (OCR), Actuator.
- Pakkenavn er `no.saksrom.api` gjennomgående.

## 2. Flyway-migrasjoner (V001–V012)

Alle ligger i `src\main\resources\db\migration\`. 275 linjer SQL totalt.

| Fil | Oppretter/endrer |
|---|---|
| `V001__init.sql` | `tenants`, `users`, `cases`, `documents`, `source_refs`, `audit_events` + indekser |
| `V002__policies_devices_licenses.sql` | `tenant_policies`, `devices`, `licenses` |
| `V003__document_quarantine_status.sql` | `documents`: + `status` (default `'QUARANTINE'`), `file_hash`, `storage_path`, `updated_at` |
| `V004__document_upload_storage_metadata.sql` | `documents`: `case_id` blir nullable, + `file_size` |
| `V005__document_lifecycle_status.sql` | `documents`: + `rejection_reason` + indeks |
| `V006__document_source_units.sql` | `documents`: + `ingestion_error`; ny tabell `document_source_units` |
| `V007__operative_summaries.sql` | `operative_summaries` (merk: `case_id` er **TEXT**, ikke UUID) |
| `V008__audit_event_payload_text.sql` | `audit_events.event_payload`: JSONB → TEXT |
| `V009__async_ingestion_jobs.sql` | `document_source_units`: + `parser_version`; ny tabell `ingestion_jobs` (heartbeat via `locked_by`/`locked_at`, `attempt_count`) |
| `V010__document_versioned_replacement.sql` | `documents`: versjonering (`version_number`, `version_root_id`, `supersedes_document_id`, `superseded_by_document_id`, `active_version`) + unik aktiv versjon |
| `V011__provider_policy_authority.sql` | `provider_policies` (PK = `tenant_id`, `external_provider_approved`, `change_ticket`, optimistisk `version`) |
| `V012__case_canvas_authority.sql` | `case_canvases` (`canvas_json` TEXT, `version` BIGINT, unik per tenant+case) |

## 3. Tabeller etter V012

Alle tabeller unntatt `tenants` har `tenant_id UUID NOT NULL` (FK til `tenants`). Kolonnenavnet er **`tenant_id` overalt — `firm_id` finnes ikke i skjemaet.** Ingen tabell har RLS.

| Tabell | tenant_id | Kolonner (etter V012) |
|---|---|---|
| `tenants` | — (er tenanten) | id, name, status, created_at |
| `users` | ✓ | id, tenant_id, email, display_name, role, status, created_at; UNIQUE(tenant_id, email) |
| `cases` | ✓ | id, tenant_id, case_number, title, status, local_first, created_by, created_at, updated_at |
| `documents` | ✓ | id, tenant_id, case_id (nullable), filename, original_filename, mime_type, page_count, sha256, bates_start, bates_end, storage_policy, created_by, created_at, status, file_hash, storage_path, updated_at, file_size, rejection_reason, ingestion_error, version_number, version_root_id, supersedes_document_id, superseded_by_document_id, active_version; UNIQUE(case_id, sha256); unik aktiv versjon per (tenant_id, version_root_id) |
| `source_refs` | ✓ | id, tenant_id, case_id, document_id, page_number, bates, text_excerpt, excerpt_sha256, ocr_quality, created_at |
| `audit_events` | ✓ | id, tenant_id, case_id, actor_user_id, event_type, entity_type, entity_id, event_payload (TEXT), previous_event_hash, event_hash, created_at |
| `tenant_policies` | ✓ | id, tenant_id, policy_key, policy_value (JSONB), created_at, updated_at; UNIQUE(tenant_id, policy_key) |
| `devices` | ✓ | id, tenant_id, user_id, device_name, device_fingerprint_hash, status, activated_at, last_seen_at |
| `licenses` | ✓ | id, tenant_id, plan, status, seats, valid_until, created_at |
| `document_source_units` | ✓ | id, tenant_id, case_id, document_id, source_unit_id (TEXT), page_number, unit_type, text_content, char_start, char_end, bbox_json, extraction_confidence, parser_version, created_at, updated_at; UNIQUE(document_id, source_unit_id) og (document_id, page_number, parser_version) |
| `operative_summaries` | ✓ | id, tenant_id, case_id (**TEXT**), analysis_status, summary_json, error_message, created_at, updated_at; UNIQUE(tenant_id, case_id) |
| `ingestion_jobs` | ✓ | id, tenant_id, case_id, document_id, status, pages_processed, pages_total, error_message, attempt_count, locked_by, locked_at, finished_at, parser_version, created_at, updated_at |
| `provider_policies` | ✓ (PK) | tenant_id (PK), external_provider_approved, change_ticket, updated_by, updated_at, version |
| `case_canvases` | ✓ | id, tenant_id, case_id, canvas_json (TEXT), version, created_by, updated_by, created_at, updated_at; UNIQUE(tenant_id, case_id) |

## 4. HTTP-endepunkter (implementert i kode)

**AuthController** — `/api/auth`
- `GET /api/auth/me` — autentisert bruker (id, e-post, tenant, roller)

**CaseFileController** — `/api/v1/cases`
- `POST /api/v1/cases` — opprett sak
- `GET /api/v1/cases` — list saker
- `DELETE /api/v1/cases/{caseId}` — slett sak (204)

**DocumentController** — `/api/v1/documents` **og alias `/api/documents`**
- `POST .../hash` — beregn SHA-256 av opplastet fil
- `POST .../upload` — karantene-opplasting
- `POST .../{documentId}/replace` — versjonert erstatning (supersede)
- `GET .../` — list dokumenter
- `GET .../exists` — finnes hash allerede
- `POST .../check-duplicates` — duplikatkontroll i batch
- `GET .../{documentId}` — hent metadata
- `GET .../{documentId}/download` — last ned fil
- `POST .../{documentId}/approve-ingestion` — godkjenn for indeksering
- `POST .../ingestion/start-batch` — start batch-indeksering
- `POST .../{documentId}/reject` — avvis
- `POST .../{documentId}/archive` — arkiver
- `DELETE .../{documentId}` — slett
- `POST .../{documentId}/ingest` — synkron indeksering (LargeDocumentIngestionService)
- `GET .../{documentId}/source-units` — alle sideenheter
- `GET .../{documentId}/source-units/window` — vindu av sideenheter (leser-flaten)

**IngestionJobController** — `/api`
- `POST /api/documents/{documentId}/approve` — opprett asynkron ingestion-jobb
- `GET /api/ingestion-jobs/{jobId}` — jobbstatus
- `GET /api/ingestion-jobs` — list jobber
- `POST /api/ingestion-jobs/{jobId}/retry` — retry

**SaksromController** — `/api`
- `GET /api/source-units/search` — søk i sideenheter
- `GET /api/saksrom/source-coverage` — kildedekning
- `POST /api/saksrom/ask` — kildebundet spørsmål/svar
- `POST /api/saksrom/summary` — kildebundet sammendrag
- `POST /api/saksrom/summary/stream` — NDJSON-strøm
- `POST /api/saksrom/summary/sse` — SSE-strøm
- `POST /api/saksrom/ask/sse` — SSE-strøm for ask

**CourtEngineController** — `/api` *(ikke nevnt i bootstrap-promptens Vedlegg B)*
- `POST /api/files/upload` — filopplasting (court engine-løp)
- `POST /api/analysis/start` — start analyse
- `GET /api/cases/{caseId}/summary` — operativt sammendrag

**PolicyController**
- `GET /api/v1/policy/effective` — effektiv policy
- `PUT /api/v1/policy/ai-provider` — muter provider-policy (audited)

**AuditController** — `/api/v1/audit`
- `POST /api/v1/audit/verify` — verifiser hashkjede
- `POST /api/v1/audit/client-event` — registrer klienthendelse

**CaseCanvasController** — `/api/v1/cases/{caseId}/canvas`
- `GET` — hent lerret
- `PUT` — lagre lerret (optimistisk versjon)

**CaseExportController** — `/api/v1/exports`
- `GET /api/v1/exports/cases/{caseId}/source-report` — kilderapport

**EnterpriseController** — `/api/v1/enterprise` *(ikke i Vedlegg B)*
- `GET /api/v1/enterprise/readiness`
- `POST /api/v1/enterprise/devices/evaluate`
- `POST /api/v1/enterprise/licenses/evaluate`

## 5. Testkjøring (faktisk, 2026-09-02)

`mvnw.cmd test` kjørt fra `evida-core\services\saksrom-api`:

```
Tests run: 179, Failures: 0, Errors: 0, Skipped: 3
BUILD SUCCESS  (Total time: 15.450 s)
```

De 3 hoppede er miljøavhengige (2 i `PdfBoxDocumentParserTest`, 1 annen), i tråd med readiness-matrisens notat om «3 intentional environment-dependent skips». Bootstrap-prompten oppga ikke noe tall, så det er ingen konflikt — men matrisen nevner både 175 og 179 i ulike avsnitt; **179 er dagens faktiske tall.**

## 6. Funksjonssjekk

| Funksjon | Finnes? | Belegg |
|---|---|---|
| ClamAV-adapter | **Ja** | `ClamAvMalwareScanner` + `DevBypassMalwareScanner` + clamav-tjeneste i `deploy/pilot/docker-compose.yml` |
| SHA-256-verifisering | **Ja** | `documents.sha256`/`file_hash`, `POST /documents/hash`, `source_refs.excerpt_sha256`, UNIQUE(case_id, sha256) |
| Duplikatkontroll | **Ja** | `GET /documents/exists`, `POST /documents/check-duplicates` + unik-constraint |
| OCR-confidence-gating | **Delvis** | `OcrEngine.OcrResult(text, confidence)` og `extraction_confidence` lagres per sideenhet; `SOURCE_READY`/`PARTIAL_SOURCE_READY`-tilstander håndheves. Men readiness-matrisen (FU-064) markerer OCR enhancement/retry/confidence-gating som **BLOCKED** — full gating er ikke verifisert |
| Audit-hashkjede | **Ja** | `AuditHash`, `previous_event_hash`/`event_hash`, `POST /api/v1/audit/verify` |
| Provider kill switch | **Ja** | `ProviderPolicyService`: global kill switch (`GLOBAL_PROVIDER_KILL_SWITCH_CLOSED`) + tenant-godkjenning, audited mutasjon |
| Source-coverage | **Ja** | `SourceCoverageService`, `GET /api/saksrom/source-coverage` |
| `case_canvases` | **Ja** | V012 + `canvas`-pakken (GET/PUT med optimistisk versjon) |
| SSE/NDJSON-strøm | **Ja** | `SseAiStreamer` (resume-token), `/summary/stream` (NDJSON), `/summary/sse`, `/ask/sse` |

## 7. Gjenbruk fra `apps/web`

Betydelig gjenbruksverdi — frontenden trenger **ikke** bygges fra bunn på klientlogikk-siden:

- **Auth:** `src/lib/auth.ts` — JWT-håndtering, `X-Evida-Tenant-ID`-konstant, `/api/auth/me`-flyt. Testet.
- **SSE-klient:** `src/lib/aiStream.ts` (265 linjer) — SSE-parsing med frames, eksplisitte feilklasser (`AiStreamUnavailableError`, `AiStreamServerError`) og fallback til ikke-strøm. Testet.
- **Opplasting:** `uploadQueue.ts` (+ stress-test), `uploadPreparation.ts`, `uploadPolicy.ts`, `hashWorker.ts` — klient-side hashing og kø. Testet.
- **Kilder/sitater:** `CitationManager.ts` (jump-to-source), `sourceUnits.ts`. Testet.
- **Annet:** `canvasApi.ts`, `api.ts` (header-/UUID-hjelpere), `evidenceDraftStore.ts`.

UI-komponentene følger gammelt design («Legal Dark Shell») og skal **ikke** kopieres — ny frontend bygges etter prototypen. Men lib-laget over kan løftes inn i `frontend/src/api/` og `frontend/src/lib/` med små tilpasninger.

## 8. Avvik fra bootstrap-prompten

1. **Startmiljø:** Sesjonen kjører med `F:\prosjekter_MAIN\EVIDA` som arbeidsmappe, ikke `EvidaNy2.0` med `--add-dir EVIDA` slik startinstruksjonen krever. Lesetilgang til begge er verifisert, så fase 0 lot seg gjennomføre — men senere faser bør startes slik prompten angir.
2. **`docs/spec/` mangler helt i `EvidaNy2.0`.** Repoet inneholder kun bootstrap-filen og noen installer-exe-er. Ingen av de fire kildene brukeren skulle legge inn finnes: `EVIDA_Backend_Architecture_v2_0_1.md`, `EVIDA_UI_UX_Specification.md`, `CTO-handoff-Backend-v1.md`, `prototype/`-mappen. Merk: `Kirkerud mot Ås prototype.zip` ligger i det gamle repoet og kan trolig pakkes ut dit. **Dette blokkerer fase 3–6** (prototypen er designbriefen) og konfliktregelen «dokumentene i docs/spec gjelder».
3. **`firm_id` finnes ikke — skjemaet bruker `tenant_id`.** Fase 5 og A-9 i prompten sier alle nye tabeller skal ha `firm_id uuid not null`. Eksisterende skjema, kode (`TenantContext`, `X-Evida-Tenant-ID`) og alle 13 tabeller bruker `tenant_id`. Koden er fasit: nye tabeller bør bruke `tenant_id`, eller så må navnevalget besluttes eksplisitt før V013.
4. **SSE-eventnavnene i Vedlegg C matcher ikke koden.** Koden emitterer i dag: `meta`, `stage`, `token`, `section_start`, `text_delta`, `citation`, `finding`, `warning`, `complete`, `done`, `error`. Vedlegg C krever `source.page_extracted`, `conflict.detected`, `unsupported` — ingen av disse finnes. Kun `finding`, `done`, `error` overlapper. Vedlegg C sier «bruk navnene prototypen allerede viser» — kan ikke verifiseres siden prototypen mangler (avvik 2).
5. **docker-compose-plassering (fase 2 punkt 3):** Full stack ligger i `deploy\pilot\docker-compose.yml` — tjenester: `gateway` (nginx:1.28-alpine, med `deploy\pilot\nginx.conf`), `oauth2-proxy` (v7.15.2), `web`, `api`, `postgres` (16.14-alpine3.23), `clamav` (stable). I tillegg finnes en minimal `evida-core\services\saksrom-api\docker-compose.yml` med kun Postgres 16.
6. **Vedlegg B er ufullstendig mot koden.** Koden har i tillegg CourtEngine-endepunkter (`/api/files/upload`, `/api/analysis/start`, `/api/cases/{id}/summary`) og Enterprise-endepunkter (readiness/devices/licenses) som ikke står i matrisen. `source-units/window` er dokument-skopet: `GET /api/v1/documents/{id}/source-units/window`. DocumentController svarer på både `/api/v1/documents` og `/api/documents`.
7. **`operative_summaries.case_id` er TEXT, ikke UUID** — avvik fra resten av skjemaet, relevant hvis V013+ skal referere den.
8. **Gammelt repo er ikke i ro:** branchen `codex/web-real-client-readiness` har et stort antall ukommitterte endringer (web-komponenter, `AuthorizationService`, pilotskript). Fase 2-kopiering bør skje fra en definert, kommittert tilstand — hvilken commit/branch som er cutover-kilde må avklares.
9. **Status bundle** (`status_bundle.first_user.final.json`, v4, oppdatert 2026-07-30): `status=blocked`, `first_user_allowed=false`, `real_client_data_allowed=false`. Gjenstående P0-blokkere er eksterne (storage-kryptering på mål-maskin, signering, managed-machine smoke, live OIDC/HTTPS, DPA/godkjenninger). Ingen konflikt med prompten, men verdt å vite: det gamle repoet var aldri klarert for reelle klientdata.

---

**Gate fase 0:** Inventar komplett. Venter på klarsignal før fase 1. Anbefalt før neste fase: legg inn `docs/spec/` (avvik 2) og avklar `tenant_id` vs `firm_id` (avvik 3) og cutover-commit (avvik 8).
