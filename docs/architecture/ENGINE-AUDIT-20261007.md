# DIGITAL LECTURER ENGINE — Audit tiếp nhận 2026-10-07

## 1. Baseline
- Repository: cuongdodhct-a11y/DIGITAL-LECTURER-ENGINE
- Working branch: engine-generalization-20261007
- Parent branch: build-1md-engine
- Production baseline DIGITAL-LECTURER-2026: ngoài phạm vi thay đổi
- Bài 1: Golden Reference, CODE FREEZE

## 2. Fact đã xác minh
- COURSE-1MD có 10 package: LPKG-1MD1-001 … LPKG-1MD10-001.
- Mỗi package có commonSourceSetId=COMMON-1MD và isolation=true.
- Bài 1 có DOCX + PPTX đã kiểm checksum, 52 slide, mapping 1..52 và 185 phút.
- Engine có Course Registry, Package Resolver, Source Registry, Pilot Package Builder và API /api/course-engine.
- CI workflow kiểm tra TypeScript, build, package isolation và pilot smoke.
- Không có nguồn DOCX/PPTX chính thức cho Bài 2–10 trong repository này.

## 3. Root cause / risk được phát hiện
Source Registry trước đây chỉ kiểm tra level và document type. Điều đó cho phép một DOCX/PPTX hợp lệ về định dạng nhưng thuộc lesson khác có nguy cơ bị gắn vào package hiện tại.
Đây là lỗi kiến trúc về provenance/isolation, không phải lỗi giao diện.

## 4. Đã sửa
- Bổ sung metadata.packageId cho RegisteredDocument.
- Bắt buộc Level 1/3 authoritative source phải khai báo đúng packageId.
- Chặn thay thế nguồn khác sourceId ở cùng một level nếu chưa có explicit rebuild.
- Kiểm tra duplicate blockId, duration không hợp lệ và mapping slide gap/overlap.
- UI Course Engine hiển thị đúng readiness status thay vì luôn hiển thị CONTENT_PENDING.
- Sau pilot build, Course Registry cập nhật trạng thái READY_FOR_QC và source slots.
- Health endpoint phản ánh Phase 2.

## 5. Không thay đổi
- Không thay đổi nội dung DOCX/PPTX học thuật.
- Không sửa DIGITAL-LECTURER-2026.
- Không thay VieNeu, giọng Phạm Tuyên hoặc runtime của Bài 1.
- Không xóa model, venv, audio cache hay cloud service.

## 6. Gate tiếp theo
Engine đã sẵn sàng để nhận một lesson mới khi có đủ:
1. DOCX Level 1 của chính lesson.
2. PPTX Level 3 của chính lesson.
3. checksum của hai nguồn.
4. slide count và mapping slide → Teaching Block.
5. common source set của học phần nếu lesson cần khai thác nguồn chung.

Không tạo nội dung học thuật giả để lấp Bài 2–10 khi chưa có nguồn chuẩn.
