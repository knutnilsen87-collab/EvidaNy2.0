# ADR-003 Ingen Temporal, ingen pgvector i v1

Status: accepted

Dato: 2026-09-02

## Kontekst

EVIDA Backend Architecture v2.0 beskriver Temporal som target durable workflow engine og vektorbasert gjenfinning som mulige byggeklosser. Eksisterende backend har allerede:

- **Asynkron ingestion** via `ingestion_jobs`-tabellen (V009): PENDING-kø, claim med `locked_by`/`locked_at`, heartbeat gjennom sidefremdrift, `attempt_count`, og en `@Scheduled` stale-RUNNING-recovery som betinget resetter jobber med heartbeat eldre enn konfigurerbar terskel (default 900 s). Verifisert av tester (fase 0).
- **Applikasjonsstyrt gjenfinning** over kildeklare sideenheter (`document_source_units`) med tekstsøk, kildedekning og kildebundne svar. Ingen embeddings.

## Beslutning

1. **Temporal innføres ikke i denne runden (A-4).** Eksisterende `ingestion_jobs`-mekanisme beholdes som den er. Adopsjon av Temporal utredes separat i ADR-006 (utkast) og besluttes først når kartleggingen der er godkjent — og da inkrementelt, aldri som big-bang rewrite.
2. **pgvector innføres ikke i denne runden (A-5).** Gjenfinning forblir applikasjonsstyrt søk over kildeklare sideenheter.

## Begrunnelse

- Den eksisterende job-mekanismen er moden, testet og dekker dagens eneste durable flow (ingestion) med heartbeat og recovery. Å bytte den mot Temporal nå gir ingen funksjonell gevinst, men betydelig risiko og driftskompleksitet (ny infrastruktur, nye feilmodi) midt i en repo-transplantasjon.
- Kildebundethet er EVIDAs kjerneløfte. Applikasjonsstyrt søk over sideenheter er deterministisk og etterprøvbart; vektorsøk introduserer en ikke-deterministisk gjenfinningskomponent som ville svekket etterprøvbarheten uten at noen flate i fase 3–6 krever den.
- Prinsippet fra klarsignalet for fase 1: en moden, testet implementasjon som oppfyller arkitekturkravet (durable execution, gjenfinning) beholdes fremfor et teknologispesifikt forslag; avviket dokumenteres — det er denne ADR-en.

## Konsekvenser

- Nye workflows i fase 5–6 (eksport-predikater, grounding-gate) bygger på synkron Spring-logikk pluss `ingestion_jobs`-mønsteret der asynkronitet trengs.
- Dersom fremtidige flows faktisk krever durable multi-steg-orkestrering (kompensasjon, langvarige timere, menneskelige godkjenningssteg), reises det via ADR-006, ikke ad hoc.
- `docs/architecture/ASYNC_WORKFLOWS.md` dokumenterer dagens mekanismer og er grunnlag for vurderingen.
