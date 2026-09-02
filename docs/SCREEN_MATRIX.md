# Skjermmatrise

`KOBLET` = bygges mot ekte backend i fase 4. `TOM` = finnes i navigasjonen med `EmptyState` som ærlig sier hva som mangler. Rutene under er verifisert mot faktisk kode i fase 0 (`docs/INVENTORY.md` seksjon 4) — der Vedlegg B i bootstrap-prompten var upresis, gjelder kolonnen «Verifisert rute».

| Skjerm | Status | Verifisert rute / backend |
|---|---|---|
| Innlogging | KOBLET | OAuth2/JWT, `GET /api/auth/me` |
| Hjem / sakslister | KOBLET | `GET/POST /api/v1/cases`, `DELETE /api/v1/cases/{caseId}` |
| Opplasting | KOBLET | `POST /api/v1/documents/upload` (karantene), `POST /api/documents/{id}/approve` → `ingestion_jobs`, `GET /api/ingestion-jobs*`; strøm: se SSE_EVENT_MAP |
| Dokumentleser | KOBLET | `GET /api/v1/documents/{id}/source-units/window` (dokument-skopet, ikke global rute) |
| Kildedekning | KOBLET | `GET /api/saksrom/source-coverage` |
| Saksrom (chat) | KOBLET | `POST /api/saksrom/ask` + `POST /api/saksrom/ask/sse` |
| Innstillinger | KOBLET | `GET /api/v1/policy/effective`, `PUT /api/v1/policy/ai-provider` (kill switch) |
| Source Audit | KOBLET | `POST /api/v1/audit/verify` |
| Kilderapport | KOBLET | `GET /api/v1/exports/cases/{caseId}/source-report` |
| Sakslerret | KOBLET (tegneflate) | `GET/PUT /api/v1/cases/{caseId}/canvas` — leses som projeksjon, aldri som eksportsannhet (A-8) |
| Leveranse-rom | TOM → fase 5 | V016 + export-readiness |
| Utkastkurv | TOM → fase 5 | V014 |
| Risiko / motstrid | TOM → fase 5 | V015 |
| Kronologi | TOM → fase 5 | V017 |
| Unntakslogg | TOM → fase 5 | V013 |
| Rettssalen | TOM, ikke planlagt | leser konflikter og hull når de finnes; skriver kun forslag (A-7) |

## Endepunkter i koden uten skjerm i matrisen

Fase 0 fant disse implementerte endepunktene som Vedlegg B ikke nevner. De skal **ikke** få skjermer uten egen beslutning, men dokumenteres her så de ikke «gjenoppdages»:

- CourtEngine: `POST /api/files/upload`, `POST /api/analysis/start`, `GET /api/cases/{caseId}/summary`
- Enterprise: `GET /api/v1/enterprise/readiness`, `POST /api/v1/enterprise/devices/evaluate`, `POST /api/v1/enterprise/licenses/evaluate`
- Saksrom: `GET /api/source-units/search`, `POST /api/saksrom/summary` (+ `/stream`, `/sse`)
- Dokument: hash/exists/check-duplicates/replace/reject/archive/download m.fl. — brukes av opplastings- og leserflatene ved behov
- Audit: `POST /api/v1/audit/client-event`

Merk: `DocumentController` svarer på både `/api/v1/documents` og alias `/api/documents`. Ny frontend (`client.ts`) skal bruke `/api/v1/documents`.
