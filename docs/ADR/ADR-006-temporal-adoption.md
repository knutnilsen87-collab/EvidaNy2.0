# ADR-006 Temporal-adopsjon (UTKAST)

Status: **draft** — ikke besluttet. Skal ikke implementeres før denne ADR-en er akseptert eksplisitt.

Dato: 2026-09-02

## Kontekst

Architecture v2.0 beskriver Temporal som target durable workflow engine. ADR-003 slår fast at Temporal ikke innføres i v1. Denne ADR-en kartlegger hva en eventuell senere adopsjon må forholde seg til, slik klarsignalet for fase 1 krever. Full teknisk kartlegging av dagens mekanismer ligger i `docs/architecture/ASYNC_WORKFLOWS.md`.

## Dagens async-/workflow-mekanismer (oppsummert)

| Mekanisme | Durabilitet i dag |
|---|---|
| `ingestion_jobs` (V009): DB-kø med claim (`locked_by`/`locked_at`), heartbeat via sidefremdrift, `attempt_count`, `@Scheduled` worker-tick (5 s) og stale-RUNNING-recovery (terskel 900 s, sweep 60 s) | Durable: overlever prosessrestart, resumér per side via `pages_processed` og unik `(document_id, page_number, parser_version)` |
| SSE-/NDJSON-strømmer (`SseAiStreamer`, resume-token, heartbeat 15 s) | Ikke durable — gjenopptakbar strøm, men beregningen bak er request-skopet |
| Synkron ingestion (`POST /documents/{id}/ingest`) | Ikke durable — request-skopet |
| `@Scheduled`-jobber (worker-tick, stale-recovery) | Stateless ticks over durable DB-tilstand |

## Flows som faktisk vil kreve durable execution

Vurdert mot fase 5–6-planene:

1. **Ingestion** — krever det allerede, og **har** det via `ingestion_jobs`. Ingen udekket mangel.
2. **Eksport/DOCX-rendering (fase 5)** — flersteg (predikatevaluering → `RENDERING` → worker-produksjon → artefakt): reell kandidat for durable orkestrering. Kan i v1 dekkes av samme DB-jobbmønster som ingestion (`export_job`-tabell i V016 er allerede planlagt).
3. **Grounding-gate (fase 6)** — deterministiske kontroller i eksisterende `ask`-løp; request-skopet, trenger ikke durabilitet.
4. **Fremtidig: langvarige analyser med menneskelige godkjenningssteg, kompensasjon eller timere over dager** — det er først her Temporal gir reell gevinst over DB-jobbmønsteret.

## Foreslått beslutning (til senere avgjørelse)

Temporal adopteres **kun dersom** en konkret flow oppfyller minst ett av: (a) multi-steg med kompensasjonsbehov, (b) timere/ventetider utover prosesslevetid som ikke uttrykkes naturlig som DB-tilstand, (c) menneskelige steg inne i maskinell orkestrering. Målet er durable workflows — ikke Temporal for Temporal sin skyld.

## Inkrementell migrasjonssti (dersom akseptert)

1. **Fase A — sidestilt:** Temporal-server i dev-compose; én ny, lavrisiko flow (f.eks. eksport-rendering) implementeres som Temporal-workflow bak samme API-kontrakt. `ingestion_jobs` røres ikke.
2. **Fase B — adapter:** `IngestionJobService`-kontrakten (claim/heartbeat/complete/fail) reimplementeres som Temporal-activities bak samme interface; `ingestion_jobs`-tabellen beholdes som projeksjon for UI/audit slik at API og skjermer er uendret.
3. **Fase C — cutover per flow:** worker-tick og stale-recovery skrus av per flow først når Temporal-varianten har kjørt parallelt og produsert identisk resultat på fixtures. Rollback = skru tick på igjen.
4. Aldri big-bang: hver fase er en egen PR med readiness-avsnitt, og DB-mønsteret forblir fallback til fase C er verifisert.

## Konsekvenser av utkast-status

Ingen. Ingen Temporal-avhengighet, -infrastruktur eller -kode innføres så lenge denne ADR-en er draft.
