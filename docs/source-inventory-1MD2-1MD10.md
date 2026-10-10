# Source inventory — course 1MĐ

Audit date: 2026-10-10  
Scope: user Library inventory for DOCX/PPTX source files for lessons 1MĐ1–1MĐ10.  
Purpose: locate authoritative source candidates and duplicates before building runtime packages.

## Findings

- The Library contains paired DOCX/PPTX source candidates for lessons 1MĐ1–1MĐ9.
- The most consistently co-located source set is under `/DIGITAL LECTUER ENGINE/`.
- Additional copies exist under `/Trợ giảng Môn học 1MĐ/` and at the Library root. They must be treated as duplicates/candidates, not silently substituted.
- No file named `1.MĐ10.docx`, `1.MĐ10.pptx`, `1MĐ10.docx`, or `1MĐ10.pptx` was found in the returned Library inventory/search results. 1MĐ10 remains source-pending; do not synthesize its content from adjacent lessons.
- The Library inventory is not proof that raw source bytes are present in this Git repository. Do not mark repository source files as verified until bytes are intentionally imported and checksummed.
- 1MĐ1 is protected/frozen as the golden regression lesson; do not modify its academic content or slide order.

## Preferred source candidates

| Lesson | DOCX candidate | PPTX candidate | Notes |
|---|---|---|---|
| 1MĐ1 | `/DIGITAL LECTUER ENGINE/1.MĐ1.docx` (40,559 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ1.pptx` (73,777,890 bytes) | Also root and `/Trợ giảng Môn học 1MĐ/` copies; preserve golden package. |
| 1MĐ2 | `/DIGITAL LECTUER ENGINE/1.MĐ2.docx` (47,923 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ2.pptx` (142,588,629 bytes) | Another set under `/Trợ giảng Môn học 1MĐ/` has different sizes; compare versions before selecting. |
| 1MĐ3 | `/Trợ giảng Môn học 1MĐ/1.MĐ3(1).docx` (35,324 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ3.pptx` (28,513,288 bytes) | Also `/DIGITAL LECTUER ENGINE/1.MĐ3.docx` (40,417 bytes); reconcile DOCX variants before approval. |
| 1MĐ4 | `/DIGITAL LECTUER ENGINE/1.MĐ4.docx` (41,630 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ4.pptx` (31,712,751 bytes) | Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (39,137 bytes). |
| 1MĐ5 | `/DIGITAL LECTUER ENGINE/1.MĐ5.docx` (60,751 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ5.pptx` (44,158,799 bytes) | Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (57,394 bytes). |
| 1MĐ6 | `/DIGITAL LECTUER ENGINE/1.MĐ6.docx` (54,261 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ6.pptx` (52,405,154 bytes) | Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (49,851 bytes). |
| 1MĐ7 | `/DIGITAL LECTUER ENGINE/1.MĐ7.docx` (53,532 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ7.pptx` (224,245,715 bytes) | Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (49,229 bytes). |
| 1MĐ8 | `/DIGITAL LECTUER ENGINE/1.MĐ8.docx` (57,975 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ8.pptx` (66,635,845 bytes) | Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (55,792 bytes). Existing manifest flags title-slide metadata conflict: verify PPTX visually. |
| 1MĐ9 | `/DIGITAL LECTUER ENGINE/1.MĐ9.docx` (62,719 bytes) | `/DIGITAL LECTUER ENGINE/1.MĐ9.pptx` (13,054,537 bytes) | Also `/DIGITAL LECTUER ENGINE/1.MĐ9(1).pptx` (13,054,549 bytes); compare before approval. Alternate DOCX under `/Trợ giảng Môn học 1MĐ/` (59,577 bytes). |
| 1MĐ10 | **NOT FOUND** | **NOT FOUND** | Obtain the approved DOCX/PPTX from the source owner before constructing the content package. |

## Next steps before package approval

1. Compare duplicate candidates by actual content, revision/date, title page, source references and lesson duration; file size alone cannot select an authoritative version.
2. Record checksums when raw bytes are available; store a manifest with source filename, size, checksum, source ID, owner and approval status.
3. Keep source materials immutable. Runtime JSON and scripts are derivatives and must cite exact source IDs.
4. Do not mark any lesson runtime-ready until lecture package, grounded script, slide mapping, duration and local FREE VieNeu TTS are verified.
5. Keep 1MĐ10 blocked until the authoritative source files are found.
