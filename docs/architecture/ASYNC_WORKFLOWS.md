# Async- og workflow-mekanismer i eksisterende backend

Kartlagt 2026-09-02 fra kode i gammelt repo (`evida-core/services/saksrom-api`). Grunnlag for ADR-003 (ingen Temporal nå) og ADR-006 (Temporal-utkast).

## 1. Asynkron ingestion — `ingestion_jobs`

Den eneste durable workflowen i dag. Flyt:

```
POST /api/documents/{id}/approve
  → IngestionJobService oppretter jobb (status PENDING)

IngestionWorkerService.runScheduledTick()
  @Scheduled fixedDelay = evida.ingestion.worker-fixed-delay-ms (default 5000 ms)
  → henter inntil 2 PENDING-jobber (findTop2ByStatusOrderByCreatedAtAsc)
  → claim: betinget UPDATE som setter locked_by = "worker-<uuid>", locked_at = now()
  → prosesserer side for side; hver sidefremdrift oppdaterer pages_processed
    OG refresher locked_at (heartbeat)
  → complete: dokument → SOURCE_READY, eller PARTIAL_SOURCE_READY med begrunnelse
  → fail: error_message, attempt_count++

IngestionJobRecoveryService.recoverStaleRunningJobsTick()
  @Scheduled fixedDelay = evida.ingestion.stale-recovery-fixed-delay-ms (default 60000 ms)
  → finner inntil 50 RUNNING-jobber med locked_at < now() - stale-running-timeout-seconds (default 900 s)
  → betinget reset per jobb (resetStaleRunningJob sjekker status + heartbeat på nytt i UPDATE-en,
    så en worker som rakk å refreshe heartbeat etter kandidatuttrekket blir ikke resatt)
  → logger stale_running_ingestion_job_reset med jobb-/tenant-/fremdriftsdata
```

Durabilitetsegenskaper:

- **Overlever restart:** all tilstand ligger i `ingestion_jobs` + `document_source_units`; en død worker etterlater en RUNNING-jobb som recovery resetter til PENDING.
- **Resumérbar per side:** unik indeks `(document_id, page_number, parser_version)` gjør re-prosessering idempotent.
- **Konkurranse-sikker claim:** betinget UPDATE, ikke SELECT-then-UPDATE.
- **Kjente begrensninger:** maks 2 jobber per tick per node; ingen prioritering; ingen kompensasjonssteg; retry er manuell (`POST /api/ingestion-jobs/{id}/retry`).

## 2. SSE-/NDJSON-strømming

- `SseAiStreamer`: SSE med `meta`-event (streamId + resumeFromToken), heartbeat hvert 15 s (`StreamingProperties.DEFAULT_HEARTBEAT_MILLIS`), monoton token-indeks og resume via event-ID.
- Endepunkter: `/api/saksrom/summary/sse`, `/api/saksrom/ask/sse` (SSE), `/api/saksrom/summary/stream` (NDJSON).
- **Ikke durable:** strømmen kan gjenopptas, men den underliggende beregningen er request-skopet. Frontenden (`apps/web/src/lib/aiStream.ts`) har testet fallback til ikke-strøm-endepunktet.

## 3. Synkron ingestion

`POST /api/v1/documents/{id}/ingest` → `LargeDocumentIngestionService`. Request-skopet, brukes for mindre dokumenter. Ingen durabilitet, ingen behov.

## 4. Scheduled-oversikt

| Komponent | Trigger | Konfig |
|---|---|---|
| `IngestionWorkerService.runScheduledTick` | fixedDelay 5 s | `evida.ingestion.worker-fixed-delay-ms` |
| `IngestionJobRecoveryService.recoverStaleRunningJobsTick` | fixedDelay 60 s | `evida.ingestion.stale-recovery-fixed-delay-ms` |
| Stale-terskel | — | `evida.ingestion.stale-running-timeout-seconds` (900) |

## 5. Vurdering mot durable-behov

| Flow | Trenger durable execution? | Dekket i dag? |
|---|---|---|
| Ingestion | Ja | **Ja** — mekanismen over |
| Eksport/DOCX (fase 5) | Ja (flersteg, worker) | Nei — planlagt `export_job` (V016) etter samme DB-mønster |
| Grounding-gate (fase 6) | Nei (deterministisk, request-skopet) | n/a |
| SSE-svar | Nei (resumérbar strøm holder) | n/a |

Konklusjon: ingen udekket durable-mangel i dag. Se ADR-006 for kriterier og inkrementell sti dersom Temporal senere vurderes.
