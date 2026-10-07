# Phase 3 — Generalized Lesson Onboarding

## Mục tiêu
Biến Course Engine từ registry + pilot builder thành pipeline tiếp nhận một bài mới theo nguyên tắc:

DOCX/PPTX chính bài
→ Source Registration
→ Package Isolation
→ Lecture Structure
→ Teaching Blocks
→ Teaching Points
→ Grounded Teaching Script
→ TTS Gateway VieNeu v3 Turbo / ONNX
→ Audio Segments
→ Continuous Lecture Player
→ QC
→ APPROVED
→ LOCKED

## Thiết kế bắt buộc
- PRIMARY CONTENT: DOCX/PPTX của chính bài.
- COMMON: Level 2/4/5/6/7 của học phần.
- PRIMARY thắng COMMON khi có xung đột; phải ghi nhận conflict.
- Mọi Teaching Point/Script phải có provenance.
- Không dùng nội dung Bài 1 làm PRIMARY cho Bài 2+.
- Mỗi package có namespace và runtime state độc lập.
- TTS phải đi qua Gateway; FREE/LOCAL không dùng Gemini TTS và không dùng Browser SpeechSynthesis làm đường chính.
- Audio được phân đoạn và cache theo packageId + teachingPointId + script checksum + voice profile.
- Không nhân bản model/runtime giữa các package.

## Phase gates
### Gate A — Source onboarding
DOCX/PPTX đúng package, checksum ổn định, slide coverage đủ 1..N.

### Gate B — Lecture package
Tạo Lecture Structure, Teaching Blocks, Teaching Points và provenance.

### Gate C — Teaching script
Script được tạo từ PRIMARY + COMMON theo policy, không unsupported facts.

### Gate D — TTS
VieNeu v3 Turbo/ONNX + Phạm Tuyên; kiểm tra từng segment và cold start.

### Gate E — Player
Không mất tiếng khi chuyển slide; prefetch segment tiếp theo; resume/retry có kiểm soát.

### Gate F — QC
Content, teaching, TTS, player, isolation, cache/disk và rollback đều PASS.

## Điều kiện DONE
Một lesson chỉ được đánh dấu DONE khi toàn bộ gates A–F đạt và có bằng chứng kiểm thử.
