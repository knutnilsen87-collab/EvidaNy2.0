# SSE Event Map — dagens runtime vs. target-kontrakt

Vedlegg C i bootstrap-prompten er **target-kontrakt**, ikke dokumentasjon av dagens runtime. Dette dokumentet er den autoritative mappingen. Ingen eksisterende events renames uten at dette dokumentet og en compatibility-strategi er oppdatert først.

## Dagens eventnavn (verifisert i kode, fase 0)

Fra `SseAiStreamer` og `SaksromController` (`/summary/sse`, `/ask/sse`, `/summary/stream`):

| Event | Innhold | Kilde |
|---|---|---|
| `meta` | streamId, resumeFromToken | SseAiStreamer |
| `stage` | fase i prosesseringen | begge |
| `token` | token-delta med monoton indeks | SseAiStreamer |
| `section_start` | sectionId, title | SaksromController |
| `text_delta` | tekstbit per seksjon | SaksromController (NDJSON-løpet) |
| `citation` | kildehenvisning per seksjon | SaksromController |
| `finding` | funn | SaksromController |
| `warning` | code + tekst (f.eks. dekningsadvarsel) | SaksromController |
| `complete` | fullt sammendrag/svar | SaksromController |
| `done` | tokenCount | SseAiStreamer |
| `error` | safe message | begge |

Egenskaper i dag: monoton token-indeks og resume via event-ID i SSE-løpet; heartbeat hvert 15 s; intern chain-of-thought sendes aldri.

## Target-kontrakt (Vedlegg C)

```
source.page_extracted
finding
conflict.detected
unsupported
done
error
```

Krav: monoton sekvens, type, run-ID og resume-cursor på hvert event.

## Mapping

| Target-event | Dagens ekvivalent | Status |
|---|---|---|
| `source.page_extracted` | — (nærmest: `stage`-oppdateringer under indeksering; sidefremdrift finnes kun som polling på `ingestion_jobs`) | **MANGLER** — ny event, additivt, sendes fra ingestion-løpet |
| `finding` | `finding` | **FINNES** — navn beholdes |
| `conflict.detected` | — | **MANGLER** — forutsetter conflict-modellen (V015, fase 5) |
| `unsupported` | — (nærmest: `warning`, men den er dekningsadvarsel, ikke per-setning) | **MANGLER** — innføres av grounding-gaten (fase 6) |
| `done` | `done` | **FINNES** — navn beholdes |
| `error` | `error` | **FINNES** — navn beholdes |

Events i dag som **ikke** er i target-kontrakten: `meta`, `stage`, `token`, `section_start`, `text_delta`, `citation`, `warning`, `complete`.

## Compatibility-strategi

1. **Additivt først.** `source.page_extracted`, `conflict.detected` og `unsupported` legges til som nye events når deres respektive faser (5–6) bygges. Ingen eksisterende event fjernes eller renames i samme endring.
2. **Eksisterende events beholdes.** `meta`/`token`/`citation`/`section_start`/`complete` m.fl. er i aktiv bruk av testet klientkode (`aiStream.ts`) og beholdes. Ny frontend (`frontend/src/api/sse.ts`) skrives mot **unionen**, med target-navnene som primærkontrakt.
3. **Konvolutt-harmonisering som egen endring.** Kravet om run-ID + resume-cursor på *hvert* event (i dag: streamId i `meta`, resume via SSE event-ID) innføres som en additiv utvidelse av event-payloaden — felter legges til, ingen fjernes.
4. **Deprecation, ikke breaking.** Dersom `warning`/`complete` skal erstattes (f.eks. av `unsupported`/`done`-semantikk), merkes de deprecated i dette dokumentet minst én fase før fjerning, og fjerning skjer kun etter at både gammel og ny klient er verifisert mot ny kontrakt.
5. **Versjonering ved behov.** Hvis en ikke-additiv endring blir nødvendig, versjoneres kontrakten per endepunkt (`Accept`-forhandling eller `?contract=v2`) — ikke ved stille payload-endring.

## Verifikasjonsregel

Prototypen (`docs/spec/prototype/EVIDA Prototype.dc.html`) skal sjekkes for hvilke eventnavn den faktisk viser før fase 4-implementasjon; Vedlegg C hevder navnene kommer derfra, og det er foreløpig uverifisert.
