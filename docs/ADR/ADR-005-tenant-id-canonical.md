# ADR-005 `tenant_id` er kanonisk

Status: accepted

Dato: 2026-09-02

## Kontekst

EVIDA Backend Architecture v2.0 bruker begrepet `firm_id` for eierskapskolonnen som isolerer data per advokatfirma. Eksisterende backend bruker `tenant_id` konsekvent: alle 13 tabeller etter V012, `TenantContext`, `TenantContextFilter`, headeren `X-Evida-Tenant-ID`, og all autorisasjonslogikk. Fase 0 bekreftet at `firm_id` ikke forekommer noe sted i skjema eller kode.

## Beslutning

1. **`tenant_id` er kanonisk kolonnenavn og domenebegrep i kode og skjema.**
2. Der Architecture v2.0 (eller annet spec-materiale) skriver `firm_id`, leses dette som **samme domenekonsept** som eksisterende `tenant_id`. Det er en terminologisk mapping, ikke to begreper.
3. Eksisterende `tenant_id`-kolonner renames **ikke**.
4. **Nye tabeller og migrasjoner (V013+) bruker `tenant_id`**, slik at skjemaet forblir konsistent.
5. `X-Evida-Tenant-ID`-headeren beholder navnet. Den forblir en klientpåstand som må matche token-tenant — aldri selvstendig autorisasjonsbevis.

## Begrunnelse

Ett domenekonsept med to navn i samme skjema er en varig kilde til feil i queries, RLS-policyer og reviews. Koden er fasit (hard regel 1), og kostnaden ved rename av 13 tabeller pluss all kode er ren risiko uten funksjonell gevinst. Spec-lesning med en eksplisitt mappingregel er billigere og trygg.

## Konsekvenser

- RLS-policy-malen i ADR-004 bruker `tenant_id`.
- `docs/spec/README.md` dokumenterer mappingen for alle som leser Architecture v2.0.
- Eventuell fremtidig produktbeslutning om å eksponere «firma» som UI-begrep er en ren presentasjonssak og berører ikke skjemaet.
