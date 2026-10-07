# Source Inventory — 1MĐ2 → 1MĐ9

**Date:** 2026-10-07  
**Course:** COURSE-1MD / 1MĐ  
**Policy:** SOURCE_AUTHORITATIVE_READ_ONLY  
**Bài 1:** Golden Reference / regression baseline — unchanged.

## Source completeness

| Package | Level 1 DOCX | Level 3 PPTX | Slides | Lesson time | State |
|---|---|---|---:|---:|---|
| 1MĐ2 | 1.MĐ2.docx | 1.MĐ2.pptx | 55 | 4 tiết | PILOT / QC_PENDING |
| 1MĐ3 | 1.MĐ3.docx | 1.MĐ3.pptx | 30 | 2 tiết | CONTENT_READY |
| 1MĐ4 | 1.MĐ4.docx | 1.MĐ4.pptx | 46 | 2 tiết | CONTENT_READY |
| 1MĐ5 | 1.MĐ5.docx | 1.MĐ5.pptx | 58 | 4 tiết | CONTENT_READY |
| 1MĐ6 | 1.MĐ6.docx | 1.MĐ6.pptx | 62 | 4 tiết | CONTENT_READY |
| 1MĐ7 | 1.MĐ7.docx | 1.MĐ7.pptx | 58 | 4 tiết | CONTENT_READY |
| 1MĐ8 | 1.MĐ8.docx | 1.MĐ8.pptx | 73 | 6 tiết | QC_PENDING |
| 1MĐ9 | 1.MĐ9.docx | 1.MĐ9.pptx | 63 | 4 tiết | CONTENT_READY |

All eight packages have both required authoritative source types. Source files remain external to the repository; the repository stores compact manifests and provenance metadata to avoid inflating the codebase.

## Package isolation

Each authoritative pair is assigned its own package ownership:

- LPKG-1MD2-001 → 1.MĐ2.docx + 1.MĐ2.pptx
- LPKG-1MD3-001 → 1.MĐ3.docx + 1.MĐ3.pptx
- LPKG-1MD4-001 → 1.MĐ4.docx + 1.MĐ4.pptx
- LPKG-1MD5-001 → 1.MĐ5.docx + 1.MĐ5.pptx
- LPKG-1MD6-001 → 1.MĐ6.docx + 1.MĐ6.pptx
- LPKG-1MD7-001 → 1.MĐ7.docx + 1.MĐ7.pptx
- LPKG-1MD8-001 → 1.MĐ8.docx + 1.MĐ8.pptx
- LPKG-1MD9-001 → 1.MĐ9.docx + 1.MĐ9.pptx

The authoritative source registry rejects a source whose metadata.packageId does not match the target package.

## MĐ2 pilot evidence

The DOCX defines the five core sections as Cái đẹp, Cái cao cả, Cái hùng, Cái bi and Cái hài, with 4 tiết total and trọng tâm phần 1, 2, 3. The PPTX contains 55 slides and the same five-section structure.

The pilot mapping currently covers:

- slides 1–10: thủ tục + mở đầu
- slides 11–31: I. Cái đẹp
- slides 32–40: II. Cái cao cả
- slides 41–46: III. Cái hùng
- slides 47–51: IV. Cái bi
- slides 52–54: V. Cái hài
- slide 55: kết thúc

### Timing discrepancy — explicitly preserved

The MĐ2 DOCX contains inconsistent time totals: the section values I–V sum to 165 minutes, while the document also states 160 minutes for “NỘI DUNG”, 175 minutes for the practice section, and 5 minutes for the closing section. The engine therefore **does not silently normalize the source**. The manifest marks this as:

SOURCE_TIMING_CONFLICT_REVIEW_REQUIRED

The pilot verifies structural slide coverage and package isolation, but this timing discrepancy is not declared resolved.

## MĐ8 source QC

1.MĐ8.pptx is present and its content/package identity is Bài 8. However, its title slide internally says **“Bài 4 — MỘT SỐ TÔN GIÁO LỚN TRÊN THẾ GIỚI”**. The DOCX and filename identify it as Bài 8. This is preserved as a source-QC flag and is not corrected by the engine.

## Next gates

1. Complete MĐ2 QC without altering academic source.
2. Validate onboarding and isolation through the API.
3. Only after MĐ2 passes, generalize the same pipeline to MĐ3–MĐ9.
4. TTS/script/player gates remain separate from source onboarding.
5. No changes to Bài 1 Golden Reference.
