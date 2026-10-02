# Digital Lecturer Engine — Giai đoạn 1

Mục tiêu: xây engine tổng quát cho môn 1MĐ, độc lập với ứng dụng 1MĐ1 cũ. Giai đoạn 1 không chứa nội dung Word/PPTX của 1MĐ1–1MĐ10.

## Bất biến
- DIGITAL-LECTURER-2026 không thuộc phạm vi thay đổi.
- Phát triển ứng dụng mới trên branch build-1md-engine.
- 1MĐ1 chỉ là Golden Reference về cách vận hành, không sao chép nội dung.
- Mỗi bài 1MĐ1–1MĐ10 là package độc lập tương đối.
- Level 1 DOCX và Level 3 PPTX là source riêng của từng package.
- Level 2/4/5/6/7 là common source set của toàn môn.
- Không tạo nội dung học thuật giả khi chưa có source chuẩn.

## Runtime
Course → Package Resolver → LecturePackage → TeachingBlocks → TeachingPoints → Script/TTS → Slide/Player → Interaction → QC.

## Phase 1 deliverables
1. Course Registry COURSE-1MD.
2. Package Registry LPKG-1MD1-001 … LPKG-1MD10-001.
3. Package Resolver không phụ thuộc activePackageId toàn cục.
4. Source contracts cho Level 1/3 và common sources.
5. Architecture documentation.

## Phase 2 entry criteria
Engine build/lint pass; package isolation pass; Word + PPTX chuẩn cho từng lesson; common-source set của môn.
