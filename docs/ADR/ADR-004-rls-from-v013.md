# ADR-004 Row Level Security fra V013

Status: accepted

Dato: 2026-09-02

## Kontekst

Fase 0-inventaret bekreftet at ingen av tabellene i V001–V012 har Row Level Security. Tenant-isolasjon håndheves i dag utelukkende i applikasjonslaget (`TenantContextFilter`, `AuthorizationService`, tenant-skopede repositories). Det har fungert — cross-tenant-tester passerer — men gir ett enkelt forsvarsverk: én glemt tenant-filtrering i en ny query er en IDOR.

V001–V012 er frosset historikk (hard regel 3) og kan ikke endres for å legge på RLS retroaktivt i denne runden.

## Beslutning (A-9)

1. **Alle nye tabeller fra og med V013 opprettes med RLS aktivert:**
   - `tenant_id uuid not null` (kanonisk navn, se ADR-005)
   - `ENABLE ROW LEVEL SECURITY`
   - `FORCE ROW LEVEL SECURITY`
   - en tenant-policy etter mønsteret i Architecture v2.0 kapittel 67.3
2. **Applikasjonsrollen skal ikke eie de nye tabellene og skal ikke ha `BYPASSRLS`.** Tabellene eies av en migrasjonsrolle; applikasjonen får kun DML gjennom policyen.
3. Retrofitting av RLS på V001–V012-tabellene er et eget, senere prosjekt med egen test- og rollback-plan — ikke en del av denne runden.

## Begrunnelse

Forsvar i dybden: applikasjonslagets tenant-håndheving beholdes uendret, men nye tabeller — som fra fase 5 inneholder leveranser, konflikter og disclosure-status, dvs. det mest sensitive innholdet — får et databasehåndhevet gulv i tillegg. `FORCE` sikrer at selv tabelleier er underlagt policyen.

## Konsekvenser

- Migrasjonsmalen for V013+ inkluderer RLS-blokken; en ny tabell uten RLS er en reviewfeil, ikke et skjønnsspørsmål.
- Lokal utvikling og tester må kjøre med en sesjonsvariabel/rolle-oppsett som setter tenant-kontekst, ellers ser applikasjonen ingen rader (fail-closed — ønsket adferd).
- Blandingstilstanden (V001–V012 uten RLS, V013+ med) er dokumentert og akseptert; den fjernes først ved det separate retrofit-prosjektet.
