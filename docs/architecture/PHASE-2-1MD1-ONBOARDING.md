# Phase 2 — 1MĐ1 Source Onboarding Verification

## Scope
Pilot package: `LPKG-1MD1-001` in the independent `DIGITAL-LECTURER-ENGINE` repository.

The existing production application `DIGITAL-LECTURER-2026` was not modified.

## Source evidence
- Level 1 DOCX: `1.MĐ1.docx`, 41,330 bytes, SHA-256 `8dbc58d73bda58f526154a7e3ac354daee52c244e54f992596fc314f03a42192`.
- Level 3 PPTX: `1.MĐ1.pptx`, 73,779,028 bytes, SHA-256 `a2b609ea525583d6e1fb3be7ef84002664f06d51c61794053b0edc96853e3c0b`.

## Extraction verification
- DOCX: 287 non-empty paragraphs, 25,323 extracted characters.
- PPTX: exactly 52 slides.
- Visual-only slides detected by extraction: 5, 7, 52.
- Source files remain authoritative and are treated as read-only inputs.

## Operational mapping
The verified 1MĐ1 operational mapping is retained as package configuration only:
- 1–4 → TB-1MD1-001 → 5 min
- 5–10 → TB-1MD1-002 → 5 min
- 11–21 → TB-1MD1-003 → 30 min
- 22–26 → TB-1MD1-004 → 20 min
- 27–46 → TB-1MD1-005 → 90 min
- 47–50 → TB-1MD1-006 → 30 min
- 51–52 → TB-1MD1-007 → 5 min
- Total: 185 minutes / 11,100 seconds.

## Safety
No Word/PPTX binary or extracted academic body text is committed to the public repository. The repository stores source identity, checksums, structural metadata and operational mapping only.

## Gate
The pilot source pair is structurally verified. The next gate is runtime package build/QC using the source payload, followed by real lecture playback verification. Production remains frozen.
