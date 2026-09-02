# Statusprojeksjonen

UI viser fire tilstander; backend har flere dimensjoner. Avbildningen er **én ren funksjon**, testet på hver gren, brukt av både lerret og eksport. Implementeres i fase 4 som `frontend/src/domain/statusProjection.ts`. Rekkefølgen er strengest først, og regelen er bevisst pessimistisk: manglende metadata evalueres som `false`, aldri som implisitt tillatelse.

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

## Krav til implementasjonen (fase 4)

- Ren funksjon uten I/O; all input kommer som `Claim` + `Intent`.
- Enhetstest per gren (minst 6: hver av de fem reglene + happy path), pluss tester for manglende metadata (undefined disclosure, tomme arrays, ukjent epistemicStatus → pessimistisk utfall).
- Samme funksjon konsumeres av lerret, leveranse-rom og eksport-readiness — ingen lokal kopi av logikken noe annet sted.
- Kobling til OCR-gaten (`docs/architecture/OCR_QUALITY_GATE.md`): når kvalitetsmerking finnes, skal et anker som kun peker på lav-confidence-enheter ikke regnes som `anchorsValid` for `RETTEN`-intensjonen.
