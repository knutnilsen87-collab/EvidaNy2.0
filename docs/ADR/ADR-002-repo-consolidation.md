# ADR-002 Repo-konsolidering

Status: accepted

Dato: 2026-09-02

## Kontekst

EVIDA-utviklingen har levd i `F:\prosjekter_MAIN\EVIDA` — et repo som over tid har samlet backend (`evida-core/services/saksrom-api`), web-frontend (`apps/web`), en deprecated FastAPI-prototype, en Tauri-desktopapp, pilotskript, readiness-artefakter og en stor mengde løse dokumenter og arkiver i rot. Fase 0-inventaret (`docs/INVENTORY.md`) bekreftet at backenden er moden og testet (179 tester, BUILD SUCCESS), men at repoet som helhet er uegnet som base for EVIDA 2.0: uklar rotstruktur, ukommitterte endringer på aktiv branch, og en frontend som skal erstattes av ny UI bygget etter UI/UX-spesifikasjonen.

## Beslutning

1. `F:\prosjekter_MAIN\EvidaNy2.0` er det nye, konsoliderte repoet for all videre EVIDA-utvikling.
2. `F:\prosjekter_MAIN\EVIDA` er **READ-ONLY kilde** frem til cutover, og **arkiv og lesestøtte** etterpå. Ingen commits skal skje der etter cutover.
3. Cutover skjer i fase 2 ved kopiering av `saksrom-api` (inkl. byte-identiske Flyway-migrasjoner V001–V012) fra en **eksplisitt oppgitt commit-SHA eller tag** — aldri fra working tree, aldri fra antatt HEAD. Cutover-SHA er per denne datoen **ikke valgt**; fase 2 kan ikke starte før den er oppgitt.
4. Ved cutover legges `ARCHIVED.md` i det gamle repoets rot med peker til det nye repoet og cutover-dato. (Opprinnelig planlagt i fase 1, utsatt fordi det gamle repoet er read-only frem til cutover.)
5. Gjenbrukbar klientlogikk fra `apps/web` (auth, SSE-klient, upload-kø, klient-hashing, CitationManager) løftes inn i ny frontend som kilde — UI-komponentene gjør det ikke.

## Konsekvenser

- Alt nytt arbeid skjer med `F:\prosjekter_MAIN\EvidaNy2.0` som workspace-rot.
- Historikken i gammelt repo følger ikke med; sporbarhet ivaretas ved at cutover-SHA dokumenteres i fase 2-rapporten og i `ARCHIVED.md`.
- Readiness-artefakter i gammelt repo forblir gyldige som historisk evidens, men nye readiness-løp kjøres fra nytt repo.
