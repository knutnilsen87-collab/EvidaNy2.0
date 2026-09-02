# Eksportpredikater

Target-kontrakt for `POST /api/v1/deliverables/{id}/export` (fase 5). Predikatene implementeres i Spring som policy-motor på samme sted som auth — aldri i frontend, aldri i worker.

## Evalueringsrekkefølge

| Kode | Kontroll | Ved brudd |
|---|---|---|
| P-ACL | Header-tenant = token-tenant, og bruker har eksportrettighet på saken | 403, ingen detaljer |
| P-PRV | Ingen `WITHHELD`-kilde siteres i ekstern leveranse | BLOCKED |
| P-GRD | Ingen material påstand er `unsupported` | BLOCKED |
| P-CNF | Ingen sitert påstand er medlem av uavklart motstrid | BLOCKED |
| P-INT | Leveranseintensjonens regelsett er oppfylt (`RETTEN` er strengest) | BLOCKED |

P-ACL først og bevisst: leveranse-rommet er det eneste endepunktet som aggregerer på tvers av dokumenter i en sak, og derfor det første stedet en IDOR ville blitt synlig. `X-Evida-Tenant-ID` er en klientpåstand, aldri selvstendig autorisasjonsbevis — ved avvik fra token-tenant skal kallet feile stengt. (Terminologi: `tenant`, jf. ADR-005.)

## Tilstandsregler

- Ingen fil skrives ved noen BLOCKED.
- Tilstanden `RENDERING` er eneste inngang til DOCX-worker. Worker får aldri starte fra `BLOCKED`.
- Eksport-readiness (`GET /api/v1/cases/{id}/export-readiness`, «de fire lysene») er en projeksjon av de samme predikatene — aldri en egen implementasjon.

## Kobling

- P-GRD konsumerer grounding-gaten (Evidence Compiler Level 1, fase 6) — se `docs/architecture/EVIDENCE_COMPILER_LEVELS.md`.
- P-CNF konsumerer conflict-modellen (V015).
- P-PRV konsumerer `source_disclosure_status` (V013).
- P-INT konsumerer statusprojeksjonen (`docs/STATUS_PROJECTION.md`) per intensjon.

## Gate-krav (fase 5)

Demonstrasjon: en eksport med en ugrunnet påstand eller en `WITHHELD`-kilde skal faktisk avvises, og ingen fil produseres. Autorisasjonstest + cross-tenant-test på P-ACL er obligatorisk (PR-malen i `CLAUDE.md`).
