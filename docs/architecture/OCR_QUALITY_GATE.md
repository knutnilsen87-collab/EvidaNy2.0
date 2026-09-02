# OCR Quality Gate — target-modell

Fastsatt som dokumentasjon i fase 1 (2026-09-02). **Ikke implementert.** FU-064 i readiness-matrisen regnes fortsatt som BLOCKED/PARTIAL: at `extraction_confidence` lagres per sideenhet betyr ikke at OCR-kvalitetsgating er løst.

## Dagens tilstand (verifisert, fase 0)

- `OcrEngine.OcrResult(text, confidence)` — Tess4J returnerer confidence per kjøring.
- `document_source_units.extraction_confidence` lagres per side.
- Dokumentstatusene `SOURCE_READY` / `PARTIAL_SOURCE_READY` håndheves med krav om sideenheter og manglende sider.
- **Mangler:** terskler/policy for confidence, region-nivå, dokumentaggregat, human-review-tilstand og nedstrøms AI-varsling.

## Target-gate

En side/eit dokument passerer OCR-gaten først når alle seks elementer er på plass:

### 1. Page confidence
Per-side confidence lagres (finnes i dag) og evalueres mot policy. En side under terskel kan ikke bidra til `SOURCE_READY` uten eksplisitt behandling (retry/enhancement/human review).

### 2. Low-confidence regions
Confidence på regionsnivå (bbox) for sider med blandet kvalitet — småtekst, stempler, håndskrift. Lave regioner markeres i lesevisningen, slik at en side ikke er binært god/dårlig.

### 3. Document-level quality
Aggregat per dokument: andel sider under terskel, laveste side, andel OCR-baserte (vs. tekstlag-baserte) sider. Avgjør dokumentstatus og vises i UI (INV-DOC-004: brukeren skal se klar / feilet / OCR-trengs / ekskludert).

### 4. Threshold/policy
Tersklene er **policy, ikke hardkode**: konfigurerbare per tenant (tenant_policies), med fail-closed defaults. Manglende metadata evalueres som under terskel — aldri som implisitt tillatelse.

### 5. Human review state
Egen tilstand for sider/dokumenter der maskinell kvalitet er utilstrekkelig men innholdet trengs: `NEEDS_HUMAN_REVIEW` → menneskelig bekreftelse/transkripsjon → signert overstyring med audit-event. Uten signert review forblir enheten utenfor kildeklart materiale.

### 6. Downstream AI warning/degradation
Sideenheter med lav confidence som likevel er tillatt brukt, merkes slik at: (a) saksrom-svar bærer synlig kvalitetsadvarsel på sitater fra dem, (b) statusprojeksjonen aldri lar en påstand ankret kun i lav-confidence-enheter bli `RETTSKLAR`, (c) eksportpredikatene kan telle det som blokkerende for `RETTEN`-intensjonen.

## Kobling til øvrig arkitektur

- Evidence Compiler Level 3 («source-quality evaluation») konsumerer dokument-/sidekvalitet herfra.
- `source_refs.ocr_quality` (V001) er en eksisterende, ubrukt kolonne som kan bære kvalitetsmerket i eksisterende skjema; region-nivå krever nytt, additivt skjema (V013+ med RLS, jf. ADR-004).

## Implementasjonsstatus

Ingenting av target-gaten implementeres i fase 1. Implementasjon planlegges tidligst i fase 5/6-løpet eller som eget løp, med egne tester (enhancement/retry/confidence-gating) som lukker FU-064.
