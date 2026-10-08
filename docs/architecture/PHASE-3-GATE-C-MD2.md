# Phase 3 — Gate C: MĐ2 Grounded Script

## Scope
Package: `LPKG-1MD2-001` — Bài 2, Những phạm trù cơ bản của Mỹ học Mác - Lênin.

Flow:

`Teaching Block → Teaching Point → Grounded Script → Claim → Source → Unsupported-claim check → QC`

## Source policy
Gate C uses only the package's authoritative sources:

- `SRC-1MD2-L1` — `1.MĐ2.docx`
- `SRC-1MD2-L3` — `1.MĐ2.pptx`

No common-source content is used to replace package-primary content.

## Timing
Approved total: **180 minutes**.

The source document declares 175 minutes; the approved package records the explicit +5-minute adjustment for **Part I — Cái đẹp**. The package does not silently normalize other sections.

## Grounding QC
A Gate C result is blocked when:

- a Teaching Block has no Teaching Point;
- a Teaching Point has no Claim→Source evidence;
- a claim has no source reference;
- a claim references a non-primary/unregistered source;
- a claim is marked unsupported;
- Grounded Script timing differs from the approved package timing.

## Storage
**Google Drive is the application content source of truth and long-term storage.**

Repository responsibilities are limited to code, schemas, QC rules and test fixtures. Long-term lesson content must not depend on repository-local persistence.

The Drive folder/file identifiers are deliberately not hard-coded until runtime authorization/configuration is supplied. Credentials and OAuth tokens must never be committed.

## Verification command

`npm run test:phase3-gate-c`

CI must be observed before declaring Gate C runtime PASS.
