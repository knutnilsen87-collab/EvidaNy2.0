# Evidence Compiler — nivåmodell

Autoritativ nivåmodell for EVIDAs grounding-arkitektur. Fastsatt ved klarsignal for fase 1 (2026-09-02).

**Viktig ramme:** Grounding-gaten som bygges i fase 6 er **Level 1 alene**. Den skal aldri omtales eller presenteres som et ferdig grounding-system. Level 1 er nødvendig, men ikke tilstrekkelig.

## EVIDENCE COMPILER — LEVEL 1: SOURCE INTEGRITY

Deterministiske kontroller uten modellkall. Dette er fase 6-scopet:

| Kontroll | Innhold |
|---|---|
| Immutable source/version | `source_ref` peker på en levende, aktiv `source_unit` i samme sak — ikke superseded, rejected, deleted eller withheld for formålet |
| Valid anchor | Ankerreferansen (dokument, side, enhet) eksisterer og er gyldig |
| Valid quote | Den siterte teksten forekommer ordrett i enheten |
| Hash integrity | Hash av sitatteksten matcher lagret hash |

Setninger som feiler sendes som `unsupported`-event, aldri som prosa. Begrunnelsen for tre-ikke-én: en modell som dikter et sitat, dikter som regel også en plausibel kildehenvisning — referansesjekk alene ville gitt falsk grønt merke, verre enn ingen kontroll.

**Hva Level 1 IKKE fanger:** et korrekt sitert utsagn som ikke støtter påstanden det er festet til; tall- eller datoavvik mellom påstand og kilde; motbevis andre steder i saken; ugyldig rettskilde.

## LEVEL 2: CLAIM SUPPORT

Støtter kilden faktisk påstanden?

- Claim segmentation — dele svar i atomære påstander
- Citation presence — hver material påstand har henvisning
- Semantic entailment — kilden impliserer påstanden (krever modell/NLI)
- Entity consistency — samme personer/parter/objekter i påstand og kilde
- Numeric consistency — beløp, prosenter, mål stemmer
- Temporal consistency — datoer/tidspunkter stemmer (inkl. normalisering à la «rundt åtte» → 08:00 ± 30 min via `observation.structured_value`, V015)

## LEVEL 3: ADVERSARIAL VERIFICATION

Finnes det grunner til å ikke tro på påstanden?

- Contradiction search — aktivt søk etter motstrid i sakens kilder
- Conflicting evidence — kobling mot conflict-modellen (V015)
- Alternative interpretation — tåler sitatet en annen rimelig lesning?
- Source-quality evaluation — OCR-kvalitet, dokumentstatus, kildens art

## LEVEL 4: LEGAL AUTHORITY VERIFICATION

Holder rettskildebruken?

- Authority validity — kilden er en reell, gyldig rettskilde
- Jurisdiction — riktig jurisdiksjon
- Temporal validity — regelen gjaldt på faktumtidspunktet
- Proposition-to-authority support — kilden støtter det juridiske utsagnet
- Outdated/overruled detection — opphevet/fraveket autoritet flagges

Avhenger av Legal Authority Graph — eksplisitt utenfor denne runden (A-6).

## Status og veikart

| Nivå | Status | Planlagt |
|---|---|---|
| Level 1 | Ikke bygget; alle byggeklosser (source_units, hasher, statuser) finnes | Fase 6 |
| Level 2 | Ikke bygget; `observation` (V015) legger datagrunnlag for numeric/temporal | Delvis grunnlag i fase 5; resten senere runde |
| Level 3 | Ikke bygget; conflict-modellen (V015) legger grunnlag | Grunnlag i fase 5; resten senere runde |
| Level 4 | Ikke bygget; krever Legal Authority Graph | Utenfor denne runden (A-6) |

## Språkregel

I UI, dokumentasjon og rapporter: et svar som kun har passert Level 1 omtales som **«kildeintegritet verifisert»** — aldri «verifisert», «grounded» eller «rettsklar» uten kvalifikasjon. Statusprojeksjonen (Vedlegg A / `docs/STATUS_PROJECTION.md`) er eneste avbildning til UI-tilstander.
