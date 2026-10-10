# Source inventory — course 1MĐ

Audit date: 2026-10-10  
Scope: user Library inventory for DOCX/PPTX source files for lessons 1MĐ1–1MĐ10.  
Purpose: identify one canonical source filename per lesson before building runtime packages.

## Canonical filename rule

- For lesson x, the canonical DOCX is **exactly** `1.MĐx.docx`. Do not select `1MĐx.docx`, `1.MĐx(1).docx`, `1.MĐx (1).docx`, or any other numbered/parenthesized duplicate.
- For the corresponding slide deck, prefer the exact matching filename **`1.MĐx.pptx`**; exclude `1.MĐx(1).pptx` and other numbered variants from the canonical set.
- This is a selection rule for the project inventory and package manifests. It does **not** delete or alter copies in the user's Library.
- If the exact canonical filename is not found, mark the source missing; do not silently substitute another copy, even if its size or extracted text looks similar.
- File size alone does not prove version identity or content equivalence. Do not claim raw bytes/checksums have been verified in this Git repository unless the files have actually been imported and checksummed.

## Findings

- Exact canonical DOCX/PPTX filename candidates are listed below for 1MĐ1–1MĐ9 under `/DIGITAL LECTUER ENGINE/`.
- Copies under `/Trợ giảng Môn học 1MĐ/`, at Library root, or with parentheses/number suffixes are excluded from the canonical set.
- No exact `1.MĐ10.docx` or `1.MĐ10.pptx` was found in the returned Library inventory/search results. 1MĐ10 remains source-pending; do not synthesize its content from adjacent lessons.
- The Library inventory is not proof that raw source bytes are present in this Git repository.
- 1MĐ1 is protected/frozen as the golden regression lesson; do not modify its academic content or slide order.

## Canonical source set

| Lesson | Canonical DOCX | Canonical PPTX | Notes |
|---|---|---|---|
| 1MĐ1 | `/DIGITAL LECTUER ENGINE/1.MĐ1.docx` (40,559 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ1.pptx` (73,777,890 bytes) | Golden regression lesson; preserve content and slide order. |
| 1MĐ2 | `/DIGITAL LECTUER ENGINE/1.MĐ2.docx` (47,923 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ2.pptx` (142,588,629 bytes) | Ignore alternate copies under other Library paths and numbered variants. |
| 1MĐ3 | `/DIGITAL LECTUER ENGINE/1.MĐ3.docx` (40,417 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ3.pptx` (28,513,288 bytes) | Do not use `1.MĐ3(1).docx` or other alternate copies. |
| 1MĐ4 | `/DIGITAL LECTUER ENGINE/1.MĐ4.docx` (41,630 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ4.pptx` (31,712,751 bytes) | Ignore alternate DOCX copies under other Library paths. |
| 1MĐ5 | `/DIGITAL LECTUER ENGINE/1.MĐ5.docx` (60,751 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ5.pptx` (44,158,799 bytes) | Ignore alternate DOCX copies under other Library paths. |
| 1MĐ6 | `/DIGITAL LECTUER ENGINE/1.MĐ6.docx` (54,261 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ6.pptx` (52,405,154 bytes) | Ignore alternate DOCX copies under other Library paths. |
| 1MĐ7 | `/DIGITAL LECTUER ENGINE/1.MĐ7.docx` (53,532 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ7.pptx` (224,245,715 bytes) | Ignore alternate DOCX copies under other Library paths. |
| 1MĐ8 | `/DIGITAL LECTUER ENGINE/1.MĐ8.docx` (57,975 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ8.pptx` (66,635,845 bytes) | Existing manifest flags a title-slide metadata conflict; verify PPTX visually before approval. |
| 1MĐ9 | `/DIGITAL LECTUER ENGINE/1.MĐ9.docx` (62,719 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ9.pptx` (13,054,537 bytes) | Do not use `1.MĐ9(1).pptx` or alternate DOCX copies. |
| 1MĐ10 | **NOT FOUND** | **NOT FOUND** | Obtain the exact canonical `1.MĐ10.docx` and `1.MĐ10.pptx` from the source owner before constructing the content package. |

## Next steps before package approval

1. Apply this exact-name rule to source references and package manifests; never promote a numbered duplicate to canonical.
2. When raw bytes become available to the repository workflow, calculate checksums and record source filename, size, checksum, source ID, owner and approval status.
3. Keep source materials immutable. Runtime JSON and scripts are derivatives and must cite exact source IDs.
4. Do not mark any lesson runtime-ready until lecture package, grounded script, slide mapping, duration and local FREE VieNeu TTS are verified.
5. Keep 1MĐ10 blocked until the exact canonical source files are found.
