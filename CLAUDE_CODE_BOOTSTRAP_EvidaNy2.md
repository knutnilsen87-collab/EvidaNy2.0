# Oppdrag: sett opp `EvidaNy2.0`

Du skal etablere et nytt repo på `F:\prosjekter_MAIN\EvidaNy2.0` som samler en eksisterende, fungerende Spring Boot-backend med en ny frontend bygget etter en ferdig UI/UX-spesifikasjon og en fungerende prototype.

Dette er **ikke** en greenfield-oppgave. Det meste av backenden finnes allerede. Jobben er å flytte den, koble en ny frontend til den, og bygge de fem tingene som mangler — uten å påstå at noe fungerer før det er verifisert.

---

## 0. Harde regler for hele oppdraget

Disse gjelder i hver fase. Brudd på dem er en feil, ikke et skjønnsspørsmål.

1. **Verifiser, aldri anta.** Denne prompten beskriver den gamle kodebasen basert på et arkitekturdokument, ikke basert på lesing av koden. Hvis noe her ikke stemmer med det du faktisk finner på disk, er koden fasit. Rapporter avviket og stopp.
2. **Ingen parallell autoritet.** Det skal finnes nøyaktig én backend som eier auth, tenant, policy, audit og provider-routing. Ingen ny FastAPI-kjerne, ingen Node-BFF som tar autorisasjonsbeslutninger, ingen frontend-state som er sannhet.
3. **Flyway V001–V012 er frosset historikk.** Filene skal flyttes byte-identisk. Aldri redigere, renummerere eller slå sammen. Nye tabeller kommer i V013 og oppover, alltid additivt.
4. **UUID-er overlever.** Ingen rename av `cases` til `matters` i denne runden. UI kan si «sak», API kan si `/cases`.
5. **Ingen stille degradering (I-07).** Dette gjelder også UI-et. En skjerm som viser prototypens demodata uten at det står at den er en demonstrasjon, er et brudd på produktets kjerneløfte. Se Vedlegg B for hvilke skjermer som er reelle og hvilke som ikke er det.
6. **Fasegater.** Hver fase avsluttes med en verifikasjon og en rapport. Du går ikke videre til neste fase før brukeren har sagt ifra. Skriv rapporten til `docs/progress/PHASE_<n>_REPORT.md` og oppsummer i chatten.
7. **Ingen fabrikerte testresultater.** Hvis en test ikke er kjørt, skriv at den ikke er kjørt. `BUILD SUCCESS` skal komme fra faktisk output, aldri fra antakelse.

---

## 1. Kilder du må lese før du skriver én linje kode

Les disse i denne rekkefølgen. Ikke hopp over noen.

**GAMMELT REPO — kilde, lesetilgang.** Rot: `F:\prosjekter_MAIN\EVIDA`

```
F:\prosjekter_MAIN\EVIDA\EVIDA_DEVELOPER_DIRECTIVE.md
F:\prosjekter_MAIN\EVIDA\ARCHITECTURE.md
F:\prosjekter_MAIN\EVIDA\SECURITY.md
F:\prosjekter_MAIN\EVIDA\DECISIONS\ADR-001-backend-ownership.md
F:\prosjekter_MAIN\EVIDA\docs\first-user\PRODUCT_INVARIANTS.md
F:\prosjekter_MAIN\EVIDA\docs\first-user\FIRST_USER_READINESS_MATRIX.md
F:\prosjekter_MAIN\EVIDA\artifacts\first-user\status_bundle.first_user.final.json
F:\prosjekter_MAIN\EVIDA\evida-core\services\saksrom-api\                       (hele treet)
F:\prosjekter_MAIN\EVIDA\evida-core\services\saksrom-api\src\main\resources\db\migration\   (V001–V012)
F:\prosjekter_MAIN\EVIDA\apps\web\                                             (les, ikke kopier)
```

Disse stiene er antatt ut fra arkitekturdokumentet, ikke ut fra lesing av disken. Finner du dem ikke der, søk i treet og rapporter faktisk plassering i fase 0.

**NYTT REPO — mål, skrivetilgang.** Rot: `F:\prosjekter_MAIN\EvidaNy2.0`

Brukeren legger disse på plass før du starter:

```
F:\prosjekter_MAIN\EvidaNy2.0\docs\spec\EVIDA_Backend_Architecture_v2_0_1.md
F:\prosjekter_MAIN\EvidaNy2.0\docs\spec\EVIDA_UI_UX_Specification.md
F:\prosjekter_MAIN\EvidaNy2.0\docs\spec\CTO-handoff-Backend-v1.md
F:\prosjekter_MAIN\EvidaNy2.0\docs\spec\prototype\                             (utpakket Kirkerud_mot_Ås_prototype.zip)
```

Alle relative stier senere i dokumentet er relative til `F:\prosjekter_MAIN\EvidaNy2.0` med mindre noe annet står eksplisitt.

Prototypen inneholder `EVIDA Prototype.dc.html` med rundt 170 000 tegn React-logikk, `Canvas.dc.html`, og skjermbilder. **Denne prototypen er designbriefen.** Den er ikke et utgangspunkt du skal forbedre.

Ved konflikt mellom denne prompten og dokumentene i `docs/spec/`, gjelder dokumentene. Ved konflikt mellom dokumentene og faktisk kode, gjelder koden.

---

## 2. Låste arkitekturbeslutninger

Disse er avgjort. Ikke foreslå alternativer.

| # | Beslutning |
|---|---|
| A-1 | `saksrom-api` (Java 21 / Spring Boot 3.3.7) er eneste autoritative backend og policy enforcement point. Ligger i dag på `F:\prosjekter_MAIN\EVIDA\evida-core\services\saksrom-api`, og etter fase 2 på `F:\prosjekter_MAIN\EvidaNy2.0\backend\saksrom-api` |
| A-2 | Python er tillatt bak typede worker-kontrakter for OCR, ekstraksjon og evaluering. Aldri som Core API |
| A-3 | PostgreSQL 16 beholdes. Oppgradering til 18 er et eget prosjekt med restore-test |
| A-4 | Temporal innføres **ikke** nå. Eksisterende `ingestion_jobs` med heartbeat og stale recovery beholdes |
| A-5 | pgvector innføres **ikke** i denne runden. Gjenfinning forblir applikasjonsstyrt søk over kildeklare sideenheter |
| A-6 | Ingen Legal Authority Graph, ingen issues, arguments eller agenter i denne runden |
| A-7 | Rettssalen får ingen egne tabeller. Den leser konflikter og hull, og skriver kun forslag |
| A-8 | `case_canvases` (JSON) får tegne lerretet. Den får aldri avgjøre om en eksport er klar |
| A-9 | RLS aktiveres på alle nye tabeller fra og med V013, selv om V001–V012 ikke har det |
| A-10 | Frontenden samler alle HTTP-kall i én modul, `src/api/client.ts`. Da er senere rename av ruter en enkeltfil |

---

## 3. Målstruktur

```
F:\prosjekter_MAIN\EvidaNy2.0\
├─ README.md
├─ CLAUDE.md                          ← arbeidsregler for fremtidige Claude Code-økter
├─ .gitignore
├─ docs/
│  ├─ ADR/
│  │  ├─ ADR-001-backend-ownership.md          (flyttet, uendret)
│  │  ├─ ADR-002-repo-consolidation.md         (ny, se fase 1)
│  │  ├─ ADR-003-no-temporal-no-pgvector-v1.md (ny)
│  │  └─ ADR-004-rls-from-v013.md              (ny)
│  ├─ INVARIANTS.md                   (I-01 … I-12, flyttet)
│  ├─ INVENTORY.md                    (fase 0)
│  ├─ SCREEN_MATRIX.md                (Vedlegg B, utfylt med faktiske ruter)
│  ├─ STATUS_PROJECTION.md            (Vedlegg A)
│  ├─ EXPORT_PREDICATES.md            (Vedlegg C)
│  ├─ progress/
│  └─ spec/                           (legges inn av bruker før start)
├─ backend/
│  └─ saksrom-api/                    (flyttet fra evida-core/services/saksrom-api)
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ api/
│     │  ├─ client.ts                 ← eneste sted som kjenner HTTP
│     │  ├─ types.ts                  ← generert/avledet fra OpenAPI
│     │  └─ sse.ts
│     ├─ design/
│     │  ├─ tokens.css                ← ekstrahert fra prototypen, se fase 3
│     │  └─ typography.css
│     ├─ components/                  ← delt bibliotek
│     ├─ screens/                     ← én mappe per flate
│     ├─ domain/
│     │  └─ statusProjection.ts       ← Vedlegg A, ren funksjon
│     └─ lib/
├─ scripts/
│  ├─ verify-migration.ps1
│  └─ dev-up.ps1
└─ docker-compose.dev.yml             (flyttet: Postgres, ClamAV, nginx, oauth2-proxy)
```

---

# FASE 0 — Inventar

**Ikke skriv noen filer i `EvidaNy2.0` i denne fasen, bortsett fra `docs/INVENTORY.md`.**

Les `F:\prosjekter_MAIN\EVIDA` og produser `docs/INVENTORY.md` som svarer på:

1. Nøyaktig sti til Spring-tjenesten, dens Java-versjon og Spring Boot-versjon fra `pom.xml`.
2. Fullstendig liste over Flyway-migrasjoner med filnavn og en linjes beskrivelse av hva hver oppretter.
3. Alle tabeller som finnes etter V012, med kolonner. Marker hvilke som har `firm_id`/`tenant_id`.
4. Alle HTTP-endepunkter som er implementert, gruppert etter controller, med metode, sti og en linjes formål. Dette er fasit for skjermmatrisen — ikke bruk listen i Vedlegg B ukritisk.
5. Faktisk testantall og resultat fra `mvnw.cmd test`. Kjør den. Rapporter tallet du får, ikke tallet denne prompten nevner.
6. Hvilke av disse som faktisk finnes i koden: ClamAV-adapter, SHA-256-verifisering, duplikatkontroll, OCR-confidence-gating, audit-hashkjede, provider kill switch, source-coverage, `case_canvases`, SSE/NDJSON-strøm.
7. Om `apps/web` har noe gjenbrukbart (auth-håndtering, SSE-klient, filopplasting) eller om frontenden bygges fra bunn.
8. Alt i denne prompten som **ikke** stemmer med det du fant.

**Gate:** rapporter og stopp. Ikke gå videre uten klarsignal.

---

# FASE 1 — Skjelett og styringsdokumenter

1. `git init` i `EvidaNy2.0`.
2. Opprett mappestrukturen over (tomme mapper får `.gitkeep`).
3. Flytt `ADR-001`, `PRODUCT_INVARIANTS.md` og readiness-matrisen fra gammelt repo. Uendret innhold.
4. Skriv `ADR-002-repo-consolidation.md`: hvorfor repoet konsolideres, at `F:\prosjekter_MAIN\EVIDA` blir arkiv og lesestøtte, og at ingen commits skal skje der etter cutover.
5. Skriv `ADR-003` og `ADR-004` som dokumenterer A-4, A-5 og A-9 med begrunnelse.
6. Skriv `CLAUDE.md` med arbeidsreglene fra seksjon 0, listen over låste beslutninger, og PR-malen i Vedlegg D.
7. Legg `ARCHIVED.md` i `F:\prosjekter_MAIN\EVIDA` som peker på det nye repoet og angir cutover-dato.

**Gate:** vis strukturen og ADR-ene. Stopp.

---

# FASE 2 — Backend-transplantasjon

Målet er at backenden kjører identisk fra sin nye plassering. Ingen funksjonell endring.

1. Kopier
   `F:\prosjekter_MAIN\EVIDA\evida-core\services\saksrom-api\`
   til
   `F:\prosjekter_MAIN\EvidaNy2.0\backend\saksrom-api\`.
   Behold pakkenavn `no.saksrom.api` — ikke reorganiser.
2. Kopier `...\src\main\resources\db\migration\V001–V012` byte-identisk. Verifiser med SHA-256 på hver fil før og etter.
3. Flytt `docker-compose`-oppsettet for Postgres, ClamAV, nginx og oauth2-proxy til `F:\prosjekter_MAIN\EvidaNy2.0\docker-compose.dev.yml`. Kildens plassering fastslås i fase 0 — den er ikke oppgitt her.
4. Juster kun stier som må justeres. Ingen refaktorering, ingen versjonsløft, ingen opprydding.
5. Kjør `backend\saksrom-api\mvnw.cmd test`.
6. Start stacken med `scripts/dev-up.ps1` og verifiser at `/api/auth/me` og en dokumentopplasting fungerer mot lokal Postgres.

**Gate:** testene skal gi samme resultat som i fase 0. Avvik på én test er en blokkering, ikke støy. Rapporter faktisk output.

---

# FASE 3 — Designsystem, ekstrahert fra prototypen

Dette er fasen som avgjør om produktet føles som handoffen.

**Ikke design noe.** Prototypen er briefen. Din jobb er ekstraksjon, ikke tolkning.

1. Åpne `F:\prosjekter_MAIN\EvidaNy2.0\docs\spec\prototype\EVIDA Prototype.dc.html` og `Canvas.dc.html` i samme mappe. Trekk ut alle faktiske hex-verdier, font-familier, font-størrelser, letter-spacing, line-height, border-radius, spacing-verdier og skygger som faktisk brukes.
2. Skriv dem til `frontend/src/design/tokens.css` som CSS custom properties, gruppert: farge, typografi, spacing, radius, elevasjon, motion.
3. Skriv `docs/DESIGN_TOKENS.md` som lister hver token, dens verdi, og hvor i prototypen den ble funnet (filnavn + omtrentlig kontekst). Dette gjør det etterprøvbart at ingen verdi er oppfunnet.

**Viktig:** prototypen bruker flere ting som generelt regnes som svake designvalg — versaler med utvidet sperring på småetiketter, metastrenger skilt med midtpunkt, monospace på datafelt. De skal beholdes nøyaktig som de er. Briefen vinner. Ikke «forbedre» dem, ikke moderniser dem, ikke erstatt dem med noe du synes er penere.

4. Bygg komponentbiblioteket i `frontend/src/components/`. Utled hver komponent fra prototypen, ikke fra et generisk designsystem. Minimum:

```
AppShell           venstre navigasjon, toppbar, aktiv-sak-kort nederst
SourcePill         «Bilag 5, s. 31» — klikkbar, åpner leser på riktig side
StatusChip         de fire tilstandene fra Vedlegg A
ConflictCard       «MOTSTRID · TIDSPUNKT» med to sider og handlingsknapper
DocumentReader     sidevisning med markering og sidenavigasjon
StreamPanel        strøm av funn under indeksering
DraftBasket        Fakta / Anførsler / Motsvar
ReadinessLights    de fire lysene i leveranse-rommet
IntentCard         de fire leveranseintensjonene, med av/på-tilstand
Timeline           kronologisk liste med ankere
EmptyState         se punkt 5
```

5. `EmptyState` er ikke pynt. Den brukes på hver skjerm som ikke har backend ennå, og teksten skal si hva som mangler og hva brukeren kan gjøre i stedet. Aldri prototypens Kirkerud-data i en flate som ikke er koblet.

**Gate:** vis `tokens.css`, `DESIGN_TOKENS.md` og en Storybook-lignende oversiktsside med alle komponentene. Stopp.

---

# FASE 4 — API-klient og de reelle skjermene

1. Generer `frontend/src/api/types.ts` fra backendens OpenAPI. Ikke skriv typene for hånd.
2. Skriv `frontend/src/api/client.ts` som eneste sted i frontenden som kjenner HTTP, ruter og headere. Alt annet kaller funksjoner herfra.
3. Implementer `frontend/src/api/sse.ts` med resume via event-ID. Se Vedlegg C for eventnavn.
4. Bygg skjermene som er merket `KOBLET` i Vedlegg B mot faktiske ruter fra fase 0.
5. Bygg skjermene merket `TOM` med `EmptyState`. De skal finnes i navigasjonen, men si ærlig at de ikke er klare.
6. Implementer `frontend/src/domain/statusProjection.ts` etter Vedlegg A, med enhetstester på hver gren.

**Gate:** demonstrer full sløyfe — logg inn, opprett sak, last opp PDF, se strøm mens den indekseres, still spørsmål i saksrommet, klikk en kildepille og lande på riktig side i riktig dokument. Stopp.

---

# FASE 5 — Nye migrasjoner og endepunkter

Alle nye tabeller får `firm_id uuid not null`, `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY` og en policy etter mønsteret i v2.0.1 kapittel 67.3. Applikasjonsrollen skal ikke eie tabellene og ikke ha `BYPASSRLS`.

```
V013  source_disclosure_status        CLEARED | REDACTED | WITHHELD + reason_code
V014  draft_basket_item               peker på eksisterende source_unit/source_ref
V015  observation, conflict, conflict_member
V016  deliverable, export_job, matter_snapshot
V017  case_event                      (kronologi — eller utsett flaten helt)
```

**Om `observation` i V015:** en motstrid mellom to sideområder er en modellmening. En motstrid mellom to normaliserte verdier er en regel. `observation` trenger bare `structured_value jsonb`, `canonical_text`, ankerreferanse og `extractor`. Det er dette som gjør at «rundt åtte» kan normaliseres til 08:00 ± 30 min og at `MOTSTRID · TIDSPUNKT` blir deterministisk i stedet for gjettet.

Tre endepunkter:

```
GET  /api/v1/cases/{id}/export-readiness      → de fire lysene
GET  /api/v1/cases/{id}/draft-basket
POST /api/v1/cases/{id}/draft-basket
POST /api/v1/deliverables/{id}/export         → kjører predikatene; ingen fil ved rød
```

Eksportpredikatene P-INT, P-PRV, P-GRD, P-CNF og P-ACL implementeres i Spring som policy-motor på samme sted som auth. Se Vedlegg C. Worker får lage DOCX først etter at tilstanden er `RENDERING`, aldri fra `BLOCKED`.

**Gate:** vis at en eksport med en ugrunnet påstand eller en `WITHHELD`-kilde faktisk blir avvist, og at ingen fil produseres.

---

# FASE 6 — Grounding-gate i `ask`

Dette er et filter i eksisterende `ask`-løp, ikke en ny tjeneste.

En setning som presenteres som dokumentert faktum må passere tre deterministiske kontroller. Ingen av dem krever et modellkall:

1. **Referanse finnes.** `source_ref` peker på en levende, aktiv `source_unit` i samme sak, som ikke er superseded, rejected, deleted eller withheld for formålet.
2. **Sitatet forekommer.** Den siterte teksten finnes ordrett i den enheten.
3. **Hash stemmer.** Hash av sitatteksten matcher lagret hash.

Setninger som feiler noen av disse sendes som `unsupported`-event, ikke som prosa.

Grunnen til at det må være tre og ikke bare den første: en modell som dikter et sitat, dikter som regel også en plausibel kildehenvisning. Kontroll 1 alene ville sluppet den gjennom med grønt merke — verre enn ingen kontroll, fordi det ser verifisert ut.

**Gate:** adversarial fixture med oppdiktet sitat mot ekte bilagsnummer skal bli `unsupported`.

---

# Vedlegg A — Statusprojeksjonen

UI viser fire tilstander. Backend har flere dimensjoner. Avbildningen skal være én ren funksjon, testet, brukt både av lerret og eksport. Rekkefølgen er strengest først.

```ts
type UiState = 'RETTSKLAR' | 'KILDEKLAR' | 'MANGLER_KILDE' | 'INTERN';
type Intent  = 'RETTEN' | 'KLIENT' | 'INTERNT' | 'KONTROLL';

function projectStatus(claim: Claim, intent: Intent): UiState {
  // 1. Privilegium slår alt. En withheld kilde kan ikke ut av huset.
  if (claim.sources.some(s => s.disclosure === 'WITHHELD') && intent !== 'INTERNT')
    return 'INTERN';

  // 2. Uten gyldig anker finnes påstanden ikke som dokumentert.
  if (claim.anchors.length === 0 || !claim.anchorsValid)
    return 'MANGLER_KILDE';

  // 3. Uavklart motstrid gjør påstanden ubrukelig utad, uansett anker.
  if (claim.conflicts.some(c => c.status === 'UNRESOLVED'))
    return 'MANGLER_KILDE';

  // 4. Slutninger og anførsler blir aldri rettsklare, uansett godkjenning.
  if (['INFERRED', 'ALLEGED', 'UNKNOWN'].includes(claim.epistemicStatus))
    return 'KILDEKLAR';

  // 5. Kilde finnes, men ingen har signert på den.
  if (claim.reviewStatus !== 'HUMAN_VERIFIED')
    return 'KILDEKLAR';

  return 'RETTSKLAR';
}
```

Regelen er bevisst pessimistisk: manglende metadata evalueres som `false`, aldri som implisitt tillatelse.

---

# Vedlegg B — Skjermmatrise

`KOBLET` = bygges mot ekte backend nå. `TOM` = finnes i navigasjonen med `EmptyState`. **Verifiser hver rute mot fase 0 før du bygger.**

| Skjerm | Status | Backend |
|---|---|---|
| Innlogging | KOBLET | OAuth2/JWT, `/api/auth/me` |
| Hjem / sakslister | KOBLET | `/api/v1/cases` |
| Opplasting | KOBLET | karantene-upload, `ingestion_jobs`, SSE |
| Dokumentleser | KOBLET | `source-units/window` |
| Kildedekning | KOBLET | `/api/saksrom/source-coverage` |
| Saksrom (chat) | KOBLET | `/api/saksrom/ask` + `/ask/sse` |
| Innstillinger | KOBLET | provider-policy, kill switch |
| Source Audit | KOBLET | `/api/v1/audit/verify` |
| Kilderapport | KOBLET | `/api/v1/exports/cases/{id}/source-report` |
| Sakslerret | KOBLET (tegneflate) | `case_canvases` — leses som projeksjon, aldri som eksportsannhet |
| Leveranse-rom | TOM → fase 5 | V016 + export-readiness |
| Utkastkurv | TOM → fase 5 | V014 |
| Risiko / motstrid | TOM → fase 5 | V015 |
| Kronologi | TOM → fase 5 | V017 |
| Unntakslogg | TOM → fase 5 | V013 |
| Rettssalen | TOM, ikke planlagt | leser konflikter og hull når de finnes; skriver kun forslag |

---

# Vedlegg C — Eventnavn og eksportpredikater

**SSE-eventer** (bruk navnene prototypen allerede viser, ikke nye):

```
source.page_extracted
finding
conflict.detected
unsupported
done
error
```

Hvert event har monoton sekvens, type, run-ID og resume-cursor. Intern chain-of-thought sendes aldri.

**Eksportpredikater**, evaluert i denne rekkefølgen ved `POST /deliverables/{id}/export`:

| Kode | Kontroll | Ved brudd |
|---|---|---|
| P-ACL | Header-firm = token-firm, og bruker har eksportrettighet på saken | 403, ingen detaljer |
| P-PRV | Ingen `WITHHELD`-kilde siteres i ekstern leveranse | BLOCKED |
| P-GRD | Ingen material påstand er `unsupported` | BLOCKED |
| P-CNF | Ingen sitert påstand er medlem av uavklart motstrid | BLOCKED |
| P-INT | Leveranseintensjonens regelsett er oppfylt (`RETTEN` er strengest) | BLOCKED |

P-ACL først og bevisst: leveranse-rommet er det eneste endepunktet som aggregerer på tvers av dokumenter i en sak, og derfor det første stedet en IDOR ville blitt synlig. `X-Evida-Tenant-ID` er en klientpåstand, aldri selvstendig autorisasjonsbevis — ved avvik fra token-firm skal kallet feile stengt.

Ingen fil skrives ved noen BLOCKED. Tilstanden `RENDERING` er eneste inngang til DOCX-worker.

---

# Vedlegg D — PR-mal

Hver PR som påvirker readiness skal inneholde:

```markdown
## First User Readiness Impact
- Scope:
- P0/P1/P2:
- Tests added/updated:
- Manual smoke:
- Artifacts:
- Invariants affected:
- Residual risk:
- Rollback path:
```

En feature er ikke ferdig før den har: autorisasjonstest, cross-tenant-test, audit-event, observability, API-schema, idempotens der relevant, definert feil-UX, og migrasjonsrollback.

---

# Startinstruksjon

Sesjonen skal være startet med `F:\prosjekter_MAIN\EvidaNy2.0` som arbeidsmappe og `F:\prosjekter_MAIN\EVIDA` lagt til som ekstra katalog:

```
cd F:\prosjekter_MAIN\EvidaNy2.0
claude --add-dir F:\prosjekter_MAIN\EVIDA
```

Hvis du ikke har lesetilgang til `F:\prosjekter_MAIN\EVIDA`, si ifra i stedet for å gjette på innholdet.

Begynn med **fase 0**. Les kildene i seksjon 1, produser `docs/INVENTORY.md`, kjør backend-testene, og rapporter alt i denne prompten som ikke stemmer med koden. Skriv ingen andre filer før du har fått klarsignal.
