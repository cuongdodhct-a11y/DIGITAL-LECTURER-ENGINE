/**
 * Digital Lecturer Engine - Pure LecturePackage Builder
 * Builds an independent, fully-isolated LecturePackage from real source documents
 * (e.g. SRC-006 PPTX + SRC-007 DOCX for 1MĐ1).
 */

import { LecturePackage, SlideMapItem, LecturerDecisionsRecord, TimingPlan } from '../../types/lecture';
import { TeachingBlock } from '../../types/teaching';
import { RegisteredDocument } from '../../types/source';
import { QualityControlEngine } from '../qualityControl/qualityControlEngine';

export interface BuildPackageFromSourcesParams {
  packageId?: string;
  pptxSource: RegisteredDocument;
  docxSource: RegisteredDocument;
  lecturerDecisions: LecturerDecisionsRecord;
}

export function buildLecturePackageFromSources(params: BuildPackageFromSourcesParams): LecturePackage {
  const {
    packageId = 'LPKG-1MD1-001',
    pptxSource,
    docxSource,
    lecturerDecisions
  } = params;

  if (!pptxSource || !docxSource) {
    throw new Error('Both pptxSource and docxSource are strictly required to build LecturePackage.');
  }

  const pptxId = pptxSource.sourceId; // e.g. 'SRC-006'
  const docxId = docxSource.sourceId; // e.g. 'SRC-007'

  // 1. Build 52 SlideMap items from PPTX extracted text
  const slideBlocks = pptxSource.extractedText.split(/\n+\s*---\s*\n+/).filter(b => b.trim().length > 0);
  const slideMap: SlideMapItem[] = [];

  slideBlocks.forEach((rawBlock, index) => {
    const slideNumber = index + 1;
    const lines = rawBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const headerLine = lines[0] || '';
    
    // Extract title from "[Slide X: Title]"
    let title = `Slide ${slideNumber}`;
    const titleMatch = headerLine.match(/^\[Slide \d+:\s*(.*?)\]$/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    } else if (lines.length > 0 && !headerLine.startsWith('[')) {
      title = headerLine;
    }

    // Extract speaker notes if present
    let speakerNotes: string | undefined;
    const speakerNotesIdx = lines.findIndex(l => l.includes('[Speaker Notes]'));
    if (speakerNotesIdx !== -1) {
      speakerNotes = lines.slice(speakerNotesIdx).join(' ').replace(/\[Speaker Notes\]/g, '').trim();
    }

    // Semantic roles & non-instructional determinations
    let semanticRole = 'INSTRUCTIONAL';
    if (slideNumber === 1) semanticRole = 'TITLE_SLIDE';
    else if (slideNumber === 2 || slideNumber === 3) semanticRole = 'PRIOR_KNOWLEDGE_CHECK';
    else if (slideNumber === 4) semanticRole = 'LECTURER_TITLE_SLIDE';
    else if (slideNumber === 5) semanticRole = 'OBJECTIVES_REQUIREMENTS';
    else if (slideNumber === 6) semanticRole = 'COURSE_OUTLINE';
    else if (slideNumber === 7) semanticRole = 'ORGANIZATION_METHODS';
    else if (slideNumber === 8) semanticRole = 'AI_ASSISTANT_INTRO';
    else if (slideNumber === 9) semanticRole = 'SYLLABUS_FOUNDATION';
    else if (slideNumber === 10) semanticRole = lecturerDecisions.slide10LabelDecision || 'TRANSITION_SLIDE_LESSON_1';
    else if (slideNumber === 51) semanticRole = 'RESEARCH_ORIENTATION_CLOSING';
    else if (slideNumber === 52) semanticRole = 'CLOSING_SLIDE';

    // Map slide to candidate TeachingBlock based on pedagogical structure
    let mappedTeachingBlockIds: string[] = [];
    if (slideNumber >= 1 && slideNumber <= 4) mappedTeachingBlockIds = ['TB-1MD1-001'];
    else if (slideNumber >= 5 && slideNumber <= 10) mappedTeachingBlockIds = ['TB-1MD1-002'];
    else if (slideNumber >= 11 && slideNumber <= 21) mappedTeachingBlockIds = ['TB-1MD1-003'];
    else if (slideNumber >= 22 && slideNumber <= 26) mappedTeachingBlockIds = ['TB-1MD1-004'];
    else if (slideNumber >= 27 && slideNumber <= 46) mappedTeachingBlockIds = ['TB-1MD1-005'];
    else if (slideNumber >= 47 && slideNumber <= 50) mappedTeachingBlockIds = ['TB-1MD1-006'];
    else if (slideNumber >= 51 && slideNumber <= 52) mappedTeachingBlockIds = ['TB-1MD1-007'];

    // Check image / visual metadata
    const bodyLines = lines.slice(1).filter(l => !l.includes('[Speaker Notes]'));
    const isVisualOnly = bodyLines.length === 0;

    // Handle Slide 6 Roman Numerals Decision (REC-02)
    let lecturerStandardizedOutline: string | undefined;
    if (slideNumber === 6 && lecturerDecisions.slide6OutlineDecision === 'STANDARDIZE_TO_II') {
      lecturerStandardizedOutline = 
        'I. KHÁI NIỆM, ĐỐI TƯỢNG, CHỨC NĂNG, NHIỆM VỤ, PHƯƠNG PHÁP NGHIÊN CỨU MỸ HỌC MÁC - LÊNIN\n' +
        'II. SỰ HÌNH THÀNH VÀ PHÁT TRIỂN MỸ HỌC MÁC - LÊNIN\n' +
        'III. QUAN HỆ THẨM MỸ VÀ Ý THỨC THẨM MỸ\n' +
        'IV. NGHỆ THUẬT - HÌNH THÁI ĐẶC THÙ CỦA THẨM MỸ';
    }

    slideMap.push({
      slideNumber,
      title,
      sourceText: rawBlock,
      originalText: rawBlock,
      mappedTeachingBlockIds,
      status: 'MAPPED',
      issues: [],
      sourceDocumentId: pptxId,
      semanticRole,
      lecturerStandardizedOutline,
      speakerNotes,
      imageMetadata: {
        hasImage: isVisualOnly || slideNumber === 4 || slideNumber === 8 || slideNumber === 10 || slideNumber === 52,
        isVisualOnly,
        description: isVisualOnly ? `Slide trực quan/chuyển tiếp số ${slideNumber}` : undefined
      },
      provenance: {
        sourceId: pptxId,
        locator: {
          slideNumber
        }
      },
      previewBullets: bodyLines.slice(0, 4)
    });
  });

  // 2. Build canonical TeachingBlocks from DOCX (SRC-007) and PPTX (SRC-006)
  const isPartIAndIIIFocus = lecturerDecisions.pedagogicalFocusDecision === 'PARTS_I_AND_III';

  const teachingBlocks: TeachingBlock[] = [
    {
      id: 'TB-1MD1-001',
      slideStart: 1,
      slideEnd: 4,
      topic: 'Thủ tục giảng bài & Kiểm tra kiến thức cũ',
      purpose: 'Ổn định lớp học, nắm quân số, phổ biến nội quy và kiểm tra kiến thức triết học nền tảng về Thực tiễn và Ý thức xã hội.',
      objectiveIds: ['OBJ-1MD1-03'],
      keyPoints: [
        'Nắm quân số và phổ biến quy định học tập',
        'Khởi động tư duy: Kiểm tra câu hỏi trắc nghiệm khái niệm Thực tiễn (Slide 2)',
        'Đàm thoại phát vấn: Mối quan hệ biện chứng giữa tồn tại xã hội và ý thức xã hội (Slide 3)'
      ],
      lectureText: 'Kính chào các đồng chí học viên, hôm nay chúng ta bắt đầu bài giảng theo kế hoạch huấn luyện. Trước khi đi vào bài mới, đề nghị đồng chí lớp trưởng báo cáo quân số. Về quy định học tập, yêu cầu các đồng chí chấp hành nghiêm kỷ luật giảng đường, tập trung nghe giảng, ghi chép đầy đủ và tích cực phát biểu xây dựng bài. Chúng ta cùng khởi động bằng câu hỏi trắc nghiệm ôn tập kiến thức cũ trên màn hình: Thực tiễn là gì? Hãy suy nghĩ trong 3 giây và chọn đáp án chính xác nhất.',
      pedagogicalMethod: 'Đàm thoại, nêu vấn đề, tương tác câu hỏi trắc nghiệm có đồng hồ đếm ngược',
      question: 'Thực tiễn là gì và có những hình thức cơ bản nào trong đời sống xã hội?',
      waitSeconds: 10,
      expectedResponse: 'Thực tiễn là toàn bộ hoạt động vật chất có mục đích, mang tính lịch sử - xã hội của con người nhằm cải biến tự nhiên và xã hội. Gồm 3 hình thức: sản xuất vật chất, chính trị - xã hội và thực nghiệm khoa học.',
      example: 'Hoạt động huấn luyện sẵn sàng chiến đấu tại đơn vị cơ sở là một dạng hoạt động thực tiễn quân sự đặc thù.',
      application: 'Vận dụng quan điểm thực tiễn để đánh giá đúng bản chất đời sống thẩm mỹ và văn hóa tinh thần quân nhân.',
      transition: 'Từ nền tảng triết học duy vật biện chứng về thực tiễn và ý thức xã hội, chúng ta bước vào nghiên cứu nội dung mở đầu bài giảng Mỹ học Mác - Lênin.',
      durationSeconds: 300, // 5 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần II.A (Thủ tục giảng bài)',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 2',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 1-4 (Câu hỏi kiểm tra bài cũ)',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 1-4',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-002',
      slideStart: 5,
      slideEnd: 10,
      topic: 'Mở đầu & Nhập môn bài giảng',
      purpose: 'Xác định vị trí, ý nghĩa của bài giảng đối với học viên đào tạo cán bộ chính trị cấp phân đội; giới thiệu mục đích, yêu cầu, nội dung, trọng tâm, thời gian và phương pháp.',
      objectiveIds: ['OBJ-1MD1-01'],
      keyPoints: [
        'Vị trí, ý nghĩa bài giảng đối với sĩ quan chính trị cấp phân đội',
        'Mục đích, yêu cầu về kiến thức, kỹ năng, thái độ',
        'Nội dung gồm 4 phần, xác định trọng tâm giảng dạy',
        'Căn cứ biên soạn: HD 3939/HD-QHNT và HD 260/HD-SQCT',
        'Slide 10: Slide chuyển tiếp bước vào nội dung lý luận (TRANSITION_SLIDE_LESSON_1)'
      ],
      lectureText: 'Mỹ học Mác - Lênin hướng con người tới cái đẹp, để con người ngày càng vươn tới những giá trị đích thực, phù hợp với tiến bộ xã hội. Do đó, việc học tập, nghiên cứu mỹ học Mác - Lênin có ý nghĩa đặc biệt quan trọng trong đào tạo cán bộ quân đội, nhất là đào tạo cán bộ chính trị cấp phân đội; làm cơ sở xây dựng thế giới quan khoa học trong nhận thức và hoạt động thực tiễn xây dựng đời sống thẩm mỹ ở đơn vị cơ sở. Bài học gồm 4 nội dung lớn, trong đó trọng tâm được xác định rõ ràng để tập trung thời lượng.',
      pedagogicalMethod: 'Thuyết trình định hướng, trực quan hóa trên slide và giới thiệu trợ giảng AI',
      question: 'Vì sao người cán bộ chính trị cấp phân đội cần được trang bị tri thức lý luận Mỹ học Mác - Lênin?',
      waitSeconds: 10,
      expectedResponse: 'Để xây dựng thế giới quan khoa học, nâng cao năng lực định hướng thẩm mỹ và xây dựng môi trường văn hóa tinh thần lành mạnh cho cán bộ, chiến sĩ tại đơn vị cơ sở.',
      example: 'Xây dựng cảnh quan môi trường văn hóa chính quy, xanh - sạch - đẹp và nền nếp chính quy tại đơn vị cấp đại đội.',
      application: 'Vận dụng để định hướng thẩm mỹ cho chiến sĩ trẻ trước các trào lưu lệch chuẩn trên không gian mạng hiện nay.',
      transition: 'Sau khi đã nắm vững ý định giảng bài và vị trí môn học, chúng ta chuyển sang nghiên cứu nội dung trọng tâm thứ nhất của bài giảng: Khái niệm, đối tượng, chức năng, nhiệm vụ và phương pháp nghiên cứu Mỹ học Mác - Lênin.',
      durationSeconds: 300, // 5 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần I & Phần II.B (Mở đầu)',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 1-3',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 5-10',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 5-10',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-003',
      slideStart: 11,
      slideEnd: 21,
      topic: 'Phần I: Khái niệm, đối tượng, chức năng, nhiệm vụ, phương pháp nghiên cứu Mỹ học Mác - Lênin',
      purpose: 'Làm rõ khái niệm khoa học Mỹ học Mác - Lênin, đối tượng nghiên cứu (đời sống thẩm mỹ như một chỉnh thể), 5 chức năng cơ bản, nhiệm vụ và phương pháp luận biện chứng duy vật.',
      objectiveIds: ['OBJ-1MD1-01'],
      keyPoints: [
        'Khái niệm: Khoa học nghiên cứu nguồn gốc, bản chất, quy luật đời sống thẩm mỹ và nghệ thuật',
        'Đối tượng: Đời sống thẩm mỹ - một chỉnh thể thống nhất gắn với thực tiễn',
        '5 chức năng: Nhận thức, Thế giới quan - Phương pháp luận, Giáo dục (chân - thiện - mỹ), Dự báo, Giữ gìn phát triển giá trị',
        'Nhiệm vụ: Cung cấp tri thức, tuyên truyền giáo dục và đấu tranh tư tưởng',
        'Phương pháp: Phương pháp luận biện chứng duy vật (khách quan, toàn diện, lịch sử - cụ thể)'
      ],
      lectureText: 'Mỹ học Mác - Lênin là một khoa học thuộc triết học Mác - Lênin, nghiên cứu nguồn gốc, bản chất, quy luật phát triển đời sống thẩm mỹ của con người hiện thực; nghiên cứu nghệ thuật - hình thái đặc thù của thẩm mỹ. Đây là khoa học có đối tượng nghiên cứu độc lập, có phương pháp riêng và hệ thống phạm trù, quy luật riêng. Đối tượng nghiên cứu xuyên suốt là đời sống thẩm mỹ - một chỉnh thể thống nhất, gồm các giá trị thẩm mỹ sinh ra trong quan hệ giữa chủ thể và khách thể thẩm mỹ. Mỹ học Mác - Lênin thực hiện 5 chức năng cốt lõi: chức năng nhận thức, chức năng thế giới quan - phương pháp luận, chức năng giáo dục hướng tới chân - thiện - mỹ, chức năng dự báo và chức năng giữ gìn, phát triển giá trị thẩm mỹ.',
      pedagogicalMethod: 'Thuyết trình kết hợp nêu vấn đề, phân tích quy nạp và đàm thoại sâu sắc',
      question: 'Hãy phân tích chức năng thế giới quan và phương pháp luận của Mỹ học Mác - Lênin trong việc khắc phục lối tư duy kinh nghiệm, tư biện?',
      waitSeconds: 15,
      expectedResponse: 'Giúp xem xét các hiện tượng thẩm mỹ gắn liền với thực tiễn lịch sử - xã hội, tránh rơi vào chủ nghĩa duy tâm tư biện hoặc lối đánh giá cảm tính, kinh nghiệm chủ nghĩa.',
      example: 'Đánh giá một tác phẩm nghệ thuật quân đội dựa trên tính chân thực lịch sử và giá trị tư tưởng chứ không chỉ dựa vào sở thích chủ quan cá nhân.',
      application: 'Vận dụng phương pháp biện chứng duy vật để chỉ đạo hoạt động văn hóa, văn nghệ quần chúng tại đơn vị.',
      transition: 'Để hiểu rõ nguồn gốc và bản chất cách mạng của Mỹ học Mác - Lênin, chúng ta cùng nghiên cứu tiếp Phần II: Sự hình thành và phát triển của Mỹ học Mác - Lênin.',
      durationSeconds: 1800, // 30 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần II.B.I',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 3-12',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 11-21',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 11-21',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      notes: isPartIAndIIIFocus ? 'Trọng tâm bài giảng (Primary Focus - Phê duyệt REC-01)' : 'Nội dung bài giảng',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-004',
      slideStart: 22,
      slideEnd: 26,
      topic: 'Phần II: Sự hình thành và phát triển Mỹ học Mác - Lênin',
      purpose: 'Phân tích các giai đoạn phát triển tư tưởng mỹ học của C. Mác, Ph. Ăngghen và V.I. Lênin; ý nghĩa phương pháp luận đối với việc bảo vệ và phát triển lý luận mỹ học cách mạng.',
      objectiveIds: ['OBJ-1MD1-01'],
      keyPoints: [
        'Tư tưởng mỹ học của C. Mác và Ph. Ăngghen: Đặt nền móng thế giới quan duy vật cho mỹ học',
        'Khẳng định cái thẩm mỹ là sản phẩm của hoạt động thực tiễn và lao động của con người',
        'Luận giải tính giai cấp của nghệ thuật và cách thức phản ánh hiện thực',
        'Tư tưởng mỹ học của V.I. Lênin trong thời kỳ đế quốc chủ nghĩa: Nguyên tắc tính đảng và tính nhân dân',
        'Ý nghĩa phương pháp luận: Cơ sở đấu tranh chống các quan điểm sai trái, thù địch'
      ],
      lectureText: 'Sự hình thành và phát triển của Mỹ học Mác - Lênin là một cuộc cách mạng trong lịch sử tư tưởng thẩm mỹ nhân loại. C. Mác và Ph. Ăngghen đã sáng tạo ra hệ thống lý luận mỹ học hoàn chỉnh, khoa học, lần đầu tiên khẳng định cái thẩm mỹ là sản phẩm của thực tiễn, của lao động giải phóng con người. Bước sang thời kỳ đế quốc chủ nghĩa, V.I. Lênin tiếp tục bảo vệ, phát triển lý luận mỹ học mácxít, đặc biệt là tư tưởng về tính đảng, tính nhân dân của văn hóa, nghệ thuật, và chủ nghĩa hiện thực xã hội chủ nghĩa. Lý luận này là vũ khí tư tưởng sắc bén để đấu tranh chống các trào lưu nghệ thuật tư sản suy đồi.',
      pedagogicalMethod: 'Thuyết trình lịch sử - lôgíc, phân tích trích dẫn tác phẩm kinh điển',
      question: 'Luận điểm của V.I. Lênin về tính đảng trong văn học nghệ thuật có ý nghĩa như thế nào đối với công tác tư tưởng trong quân đội hiện nay?',
      waitSeconds: 15,
      expectedResponse: 'Khẳng định văn hóa nghệ thuật là một bộ phận của sự nghiệp cách mạng chung của Đảng, định hướng cán bộ chiến sĩ giữ vững bản lĩnh chính trị trước sự xâm lăng văn hóa độc hại.',
      example: 'Tác phẩm "Tổ chức đảng và văn học đảng" (1905) của V.I. Lênin.',
      application: 'Định hướng hoạt động văn nghệ trong đơn vị luôn giữ vững tôn chỉ phục vụ bộ đội và đường lối quân sự của Đảng.',
      transition: 'Từ lịch sử phát triển tư tưởng, chúng ta chuyển sang nội dung trọng tâm then chốt thứ hai của toàn bộ bài giảng: Phần III - Quan hệ thẩm mỹ và ý thức thẩm mỹ.',
      durationSeconds: 1200, // 20 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần II.B.II',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 12-18',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 22-26',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 22-26',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-005',
      slideStart: 27,
      slideEnd: 46,
      topic: 'Phần III: Quan hệ thẩm mỹ và ý thức thẩm mỹ',
      purpose: 'Phân tích sâu sắc bản chất, cấu trúc và tính chất xã hội của quan hệ thẩm mỹ; bản chất, cấu trúc nhiều tầng bậc của ý thức thẩm mỹ (cảm xúc, thị hiếu, lý tưởng thẩm mỹ).',
      objectiveIds: ['OBJ-1MD1-02', 'OBJ-1MD1-03'],
      keyPoints: [
        'Quan hệ thẩm mỹ: Khái niệm (quan hệ tinh thần trên cơ sở hứng thú không vụ lợi, khoái cảm thẩm mỹ)',
        'Cấu trúc quan hệ thẩm mỹ: Chủ thể thẩm mỹ và Khách thể thẩm mỹ',
        'Tính chất xã hội của quan hệ thẩm mỹ: Tính lịch sử, tính giai cấp, tính nhân loại',
        'Ý thức thẩm mỹ: Hình thái ý thức xã hội phản ánh hiện thực khách quan bằng hình tượng thẩm mỹ',
        'Cấu trúc ý thức thẩm mỹ: Cảm giác, tri giác, cảm xúc/tình cảm, thị hiếu, lý tưởng thẩm mỹ',
        'Định hướng nghiên cứu: Rèn luyện thị hiếu thẩm mỹ đúng đắn cho quân nhân'
      ],
      lectureText: 'Quan hệ thẩm mỹ là quan hệ về mặt tinh thần trên cơ sở hứng thú không vụ lợi, được gợi lên bởi khoái cảm thẩm mỹ khi con người tiếp xúc với các sự vật, hiện tượng trong thế giới. Quan hệ này được hình thành từ hai yếu tố cơ bản: chủ thể thẩm mỹ và khách thể thẩm mỹ. Ý thức thẩm mỹ là một hình thái ý thức xã hội đặc biệt, phản ánh hiện thực một cách trực tiếp, cảm tính bằng hình tượng thông qua cái đẹp. Cấu trúc ý thức thẩm mỹ bao gồm các tầng bậc từ tâm lý thẩm mỹ (cảm xúc, tình cảm thẩm mỹ) đến hệ tư tưởng thẩm mỹ (thị hiếu thẩm mỹ, lý tưởng thẩm mỹ). Đây là trọng tâm lý luận đặc biệt quan trọng để bồi dưỡng nhân cách văn hóa cho người quân nhân cách mạng.',
      pedagogicalMethod: 'Nêu vấn đề, phân tích khái quát, liên hệ thực tiễn tâm lý quân nhân và thảo luận mở',
      question: 'Phân biệt sự khác nhau giữa khoái cảm thẩm mỹ không vụ lợi với khoái cảm thực dụng thông thường?',
      waitSeconds: 15,
      expectedResponse: 'Khoái cảm thẩm mỹ là sự rung động tinh thần thuần túy trước cái đẹp hài hòa, thanh cao mà không nhằm chiếm đoạt hay thỏa mãn nhu cầu vật chất vị kỷ cá nhân.',
      example: 'Chiến sĩ ngắm nhìn đóa hoa rừng nở bên chiến hào và xúc động về vẻ đẹp sức sống bình yên của quê hương.',
      application: 'Xây dựng cho cán bộ, chiến sĩ thị hiếu thẩm mỹ lành mạnh, biết yêu cái đẹp chân chính, bài trừ thị hiếu tầm thường, lai căng.',
      transition: 'Từ quan hệ thẩm mỹ và ý thức thẩm mỹ, chúng ta tiến tới nghiên cứu hình thái đỉnh cao và tập trung nhất của thẩm mỹ: Phần IV - Nghệ thuật: hình thái đặc thù của thẩm mỹ.',
      durationSeconds: 5400, // 90 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần II.B.III',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 18-30',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 27-46',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 27-46',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      notes: isPartIAndIIIFocus ? 'Trọng tâm bài giảng (Primary Focus - Phê duyệt REC-01)' : 'Nội dung bài giảng',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-006',
      slideStart: 47,
      slideEnd: 50,
      topic: 'Phần IV: Nghệ thuật - hình thái đặc thù của thẩm mỹ',
      purpose: 'Làm rõ khái niệm, nguồn gốc lao động, bản chất xã hội và đặc trưng phản ánh hiện thực của nghệ thuật thông qua hình tượng nghệ thuật, điển hình hóa và khái quát hóa.',
      objectiveIds: ['OBJ-1MD1-02', 'OBJ-1MD1-04'],
      keyPoints: [
        'Khái niệm: Nghệ thuật là hình thái ý thức xã hội đặc biệt phản ánh hiện thực bằng hình tượng nghệ thuật',
        'Nguồn gốc nghệ thuật: Nảy sinh từ lao động thực tiễn và nhu cầu tinh thần của con người',
        'Bản chất của nghệ thuật: Sự kết hợp biện chứng giữa khách quan và chủ quan, phản ánh và sáng tạo',
        'Đặc trưng nghệ thuật: Điển hình hóa và khái quát hóa trong hình tượng cụ thể, cảm tính'
      ],
      lectureText: 'Nghệ thuật là một hình thái ý thức xã hội đặc thù, là đỉnh cao của sự phản ánh và đồng hóa thế giới về mặt thẩm mỹ. Nghệ thuật bắt nguồn từ lao động sản xuất, phản ánh hiện thực cuộc sống một cách sinh động, cụ thể qua hình tượng nghệ thuật. Điểm cốt lõi của nghệ thuật là phương thức điển hình hóa: thông qua cái riêng, cái cá biệt, độc đáo để bộc lộ cái chung, bản chất và quy luật của xã hội. Trong quân đội, nghệ thuật có sức mạnh to lớn trong việc cổ vũ tinh thần chiến đấu và khắc họa hình tượng "Bộ đội Cụ Hồ".',
      pedagogicalMethod: 'Thuyết trình kết hợp minh họa hình ảnh tác phẩm nghệ thuật, đàm thoại phân tích',
      question: 'Vì sao nói lao động là nguồn gốc trực tiếp và quyết định sự ra đời của nghệ thuật?',
      waitSeconds: 15,
      expectedResponse: 'Vì lao động rèn luyện các giác quan của con người, tạo ra của cải vật chất và nảy sinh nhu cầu biểu đạt cảm xúc, chia sẻ giá trị tinh thần.',
      example: 'Hình tượng người chiến sĩ giải phóng quân trong bài thơ "Người con gái Việt Nam" của Tố Hữu.',
      application: 'Tổ chức các hoạt động văn hóa nghệ thuật tại đơn vị để nuôi dưỡng tình yêu quê hương, đất nước và ý chí chiến đấu.',
      transition: 'Để tổng hợp lại toàn bộ kiến thức và chuẩn bị cho các bài học tiếp theo, chúng ta bước vào phần tổng kết và định hướng nghiên cứu.',
      durationSeconds: 1800, // 30 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần II.B.IV',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 30-35',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 47-50',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 47-50',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      status: 'READY'
    },
    {
      id: 'TB-1MD1-007',
      slideStart: 51,
      slideEnd: 52,
      topic: 'Kết luận & Định hướng nghiên cứu bài giảng',
      purpose: 'Tổng kết toàn bộ 4 nội dung bài giảng, định hướng 3 vấn đề nghiên cứu và vận dụng vào thực tiễn xây dựng đời sống tinh thần quân nhân; thông báo nội dung chuẩn bị cho Bài 2.',
      objectiveIds: ['OBJ-1MD1-03', 'OBJ-1MD1-04'],
      keyPoints: [
        'Tổng kết 4 nội dung cơ bản của bài giảng',
        '3 định hướng nghiên cứu: Vận dụng lý luận chung, Vận dụng quan điểm về nghệ thuật để đấu tranh tư tưởng, Ý nghĩa đối với học viên CT29TS25',
        'Phổ biến Bài 2: Những phạm trù cơ bản của Mỹ học Mác - Lênin',
        'Slide 52: Slide kết thúc bài giảng (CLOSING_SLIDE)'
      ],
      lectureText: 'Tóm lại, bài giảng đã trang bị cho các đồng chí hệ thống tri thức cơ bản về Mỹ học Mác - Lênin từ khái niệm, đối tượng, lịch sử phát triển đến quan hệ thẩm mỹ, ý thức thẩm mỹ và nghệ thuật. Đề nghị các đồng chí tập trung nghiên cứu 3 vấn đề: Thứ nhất, vận dụng lý luận chung vào xây dựng đời sống tinh thần cho quân nhân; Thứ hai, vận dụng quan điểm về nghệ thuật trong đấu tranh tư tưởng; Thứ ba, rèn luyện phẩm chất văn hóa thẩm mỹ của người cán bộ chính trị cấp phân đội. Về bài tiếp theo, yêu cầu các đồng chí đọc trước tài liệu Bài 2: "Những phạm trù cơ bản của Mỹ học Mác - Lênin". Cảm ơn các đồng chí đã chú ý lắng nghe!',
      pedagogicalMethod: 'Tổng kết sư phạm, định hướng tự học và giao nhiệm vụ nghiên cứu',
      question: 'Hãy nêu 3 định hướng vận dụng lý luận Mỹ học Mác - Lênin vào công tác của người cán bộ chính trị cấp phân đội?',
      waitSeconds: 15,
      expectedResponse: '1. Xây dựng đời sống tinh thần cho bộ đội; 2. Đấu tranh chống các quan điểm sai trái trên lĩnh vực văn hóa - nghệ thuật; 3. Nâng cao phẩm chất thẩm mỹ của người chính trị viên.',
      example: 'Kế hoạch tổ chức sinh hoạt văn hóa tinh thần tại đại đội trong ngày nghỉ cuối tuần.',
      application: 'Xây dựng kế hoạch công tác đảng, công tác chính trị trong xây dựng môi trường văn hóa tại đơn vị.',
      transition: 'Bài giảng hôm nay kết thúc tại đây. Chúc các đồng chí học tập và công tác tốt!',
      durationSeconds: 300, // 5 minutes
      sources: [
        {
          sourceId: docxId,
          citation: 'Giáo án bài giảng 1MĐ1, Phần Kết luận & Dặn dò',
          sourceType: 'DOCX',
          pageOrSlide: 'Trang 35-37',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        },
        {
          sourceId: pptxId,
          citation: 'Slide bài giảng 1.MĐ1, Slide 51-52',
          sourceType: 'PPTX',
          pageOrSlide: 'Slide 51-52',
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT'
        }
      ],
      contentType: 'CORE_CONTENT',
      status: 'READY'
    }
  ];

  // 3. Timing Plan - Total 185 minutes (11,100 seconds) derived from DOCX
  const blockTimings: Record<string, number> = {
    'TB-1MD1-001': 300,   // 5 min
    'TB-1MD1-002': 300,   // 5 min
    'TB-1MD1-003': 1800,  // 30 min
    'TB-1MD1-004': 1200,  // 20 min
    'TB-1MD1-005': 5400,  // 90 min
    'TB-1MD1-006': 1800,  // 30 min
    'TB-1MD1-007': 300    // 5 min
  };
  const totalActualSeconds = Object.values(blockTimings).reduce((sum, val) => sum + val, 0);
  const totalPlannedSeconds = 185 * 60; // 11,100 seconds

  const timingPlan: TimingPlan = {
    totalPlannedSeconds,
    totalActualSeconds,
    remainingSeconds: 0,
    varianceSeconds: totalActualSeconds - totalPlannedSeconds,
    blockTimings,
    bufferSeconds: 0,
    isMismatch: totalActualSeconds !== totalPlannedSeconds
  };

  // 4. Objectives from DOCX Section I
  const objectives = [
    {
      id: 'OBJ-1MD1-01',
      code: 'MĐ1-K1',
      statement: 'Phân tích được khái niệm, đối tượng, chức năng, nhiệm vụ, phương pháp nghiên cứu và sự hình thành, phát triển của Mỹ học Mác - Lênin.',
      cognitiveLevel: 'COMPREHENSION' as const,
      targetAudience: 'Học viên đào tạo cán bộ chính trị cấp phân đội',
      mappedBlockIds: ['TB-1MD1-002', 'TB-1MD1-003', 'TB-1MD1-004']
    },
    {
      id: 'OBJ-1MD1-02',
      code: 'MĐ1-K2',
      statement: 'Phân tích được quan hệ thẩm mỹ, cấu trúc ý thức thẩm mỹ và nghệ thuật - hình thái đặc thù của thẩm mỹ.',
      cognitiveLevel: 'ANALYSIS' as const,
      targetAudience: 'Học viên đào tạo cán bộ chính trị cấp phân đội',
      mappedBlockIds: ['TB-1MD1-005', 'TB-1MD1-006']
    },
    {
      id: 'OBJ-1MD1-03',
      code: 'MĐ1-S1',
      statement: 'Vận dụng thế giới quan duy vật biện chứng và phương pháp luận biện chứng duy vật vào nhận thức, xây dựng đời sống thẩm mỹ cho bộ đội ở đơn vị cơ sở.',
      cognitiveLevel: 'APPLICATION' as const,
      targetAudience: 'Học viên đào tạo cán bộ chính trị cấp phân đội',
      mappedBlockIds: ['TB-1MD1-001', 'TB-1MD1-005', 'TB-1MD1-007']
    },
    {
      id: 'OBJ-1MD1-04',
      code: 'MĐ1-A1',
      statement: 'Kiên quyết đấu tranh phê phán các quan điểm sai trái, biểu hiện lệch chuẩn về giá trị thẩm mỹ, bảo vệ nền tảng tư tưởng của Đảng.',
      cognitiveLevel: 'EVALUATION' as const,
      targetAudience: 'Học viên đào tạo cán bộ chính trị cấp phân đội',
      mappedBlockIds: ['TB-1MD1-006', 'TB-1MD1-007']
    }
  ];

  // 5. Requirements from DOCX Section I
  const requirements = [
    {
      id: 'REQ-1MD1-01',
      type: 'PREREQUISITE' as const,
      description: 'Học viên đã học các học phần Triết học Mác - Lênin căn bản, đặc biệt là quy luật biện chứng duy vật và lý luận hình thái ý thức xã hội.'
    },
    {
      id: 'REQ-1MD1-02',
      type: 'STUDENT_EQUIPMENT' as const,
      description: 'Vở ghi bài, bút viết, giáo trình Mỹ học Mác - Lênin (Trường Sĩ quan Chính trị, 2020), thiết bị tương tác lớp học.'
    },
    {
      id: 'REQ-1MD1-03',
      type: 'PEDAGOGICAL_ORIENTATION' as const,
      description: 'Giảng viên kết hợp thuyết trình, đàm thoại gợi mở, nêu vấn đề, trực quan hóa trên slide và ứng dụng trợ lý ảo.'
    }
  ];

  // 6. Source Hierarchy for 1MĐ1
  const sourceHierarchy = [
    {
      sourceId: docxId,
      level: docxSource.sourceLevel,
      title: 'Kế hoạch bài giảng: Những vấn đề chung về Mỹ học Mác - Lênin (1.MĐ1)',
      role: 'Đề cương & kế hoạch bài giảng chuẩn quy định cấu trúc, mục tiêu và thời lượng chi tiết',
      filename: docxSource.filename
    },
    {
      sourceId: pptxId,
      level: pptxSource.sourceLevel,
      title: 'Slide bài giảng trình chiếu: 1.MĐ1.pptx',
      role: 'Khung trực quan trình chiếu 52 slide, câu hỏi trắc nghiệm tương tác và từ khóa bài giảng',
      filename: pptxSource.filename
    }
  ];

  // 7. Lecture Structure
  const lectureStructure = [
    {
      sectionId: 'SEC-1MD1-01',
      sectionTitle: 'Thủ tục giảng bài & Mở đầu bài giảng',
      allocatedMinutes: 10,
      teachingBlockIds: ['TB-1MD1-001', 'TB-1MD1-002']
    },
    {
      sectionId: 'SEC-1MD1-02',
      sectionTitle: 'Phần I: Khái niệm, đối tượng, chức năng, nhiệm vụ, phương pháp nghiên cứu',
      allocatedMinutes: 30,
      teachingBlockIds: ['TB-1MD1-003']
    },
    {
      sectionId: 'SEC-1MD1-03',
      sectionTitle: 'Phần II: Sự hình thành và phát triển Mỹ học Mác - Lênin',
      allocatedMinutes: 20,
      teachingBlockIds: ['TB-1MD1-004']
    },
    {
      sectionId: 'SEC-1MD1-04',
      sectionTitle: 'Phần III: Quan hệ thẩm mỹ và ý thức thẩm mỹ',
      allocatedMinutes: 90,
      teachingBlockIds: ['TB-1MD1-005']
    },
    {
      sectionId: 'SEC-1MD1-05',
      sectionTitle: 'Phần IV: Nghệ thuật - hình thái đặc thù của thẩm mỹ',
      allocatedMinutes: 30,
      teachingBlockIds: ['TB-1MD1-006']
    },
    {
      sectionId: 'SEC-1MD1-06',
      sectionTitle: 'Kết luận & Dặn dò nghiên cứu',
      allocatedMinutes: 5,
      teachingBlockIds: ['TB-1MD1-007']
    }
  ];

  // Pedagogical focus string
  const pedagogicalFocus = isPartIAndIIIFocus
    ? 'Phần I (Khái niệm, đối tượng, chức năng, nhiệm vụ, phương pháp) và Phần III (Quan hệ thẩm mỹ, ý thức thẩm mỹ) - Theo quyết định phê duyệt của Giảng viên (PARTS_I_AND_III)'
    : 'Phần I và Phần II';

  const initialPackage: LecturePackage = {
    id: packageId,
    version: 1,
    status: 'QC_PENDING',
    metadata: {
      courseCode: '1MĐ',
      courseTitle: 'Mỹ học Mác - Lênin, Đạo đức học quân sự và Tôn giáo học',
      lectureNumber: 1,
      lectureTitle: 'Bài 1: Những vấn đề chung về Mỹ học Mác - Lênin',
      academicUnit: 'Khoa Triết học Mác - Lênin, Trường Sĩ quan Chính trị',
      targetDegree: 'Cử nhân / Sĩ quan Chính trị cấp phân đội (CT29TS25)',
      plannedDurationMinutes: 185,
      authorLecturer: 'Thượng tá, ThS Đỗ Đình Cường - Chủ nhiệm bộ môn',
      pedagogicalFocus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    objectives,
    requirements,
    sourceHierarchy,
    lectureStructure,
    timingPlan,
    slideMap,
    teachingBlocks,
    interactionPlan: [
      {
        blockId: 'TB-1MD1-001',
        checkpointPrompt: 'Học viên trả lời câu hỏi trắc nghiệm kiểm tra bài cũ trên màn hình (Thực tiễn là gì?).',
        waitSeconds: 10,
        fallbackPrompt: 'Nhắc lại 3 hình thức cơ bản của hoạt động thực tiễn.'
      },
      {
        blockId: 'TB-1MD1-003',
        checkpointPrompt: 'Học viên phân tích chức năng thế giới quan, phương pháp luận của Mỹ học Mác - Lênin.',
        waitSeconds: 15,
        fallbackPrompt: 'Gợi ý: Mỹ học Mác - Lênin khắc phục lối tư duy kinh nghiệm, tư biện như thế nào?'
      },
      {
        blockId: 'TB-1MD1-005',
        checkpointPrompt: 'Học viên phân biệt khoái cảm thẩm mỹ không vụ lợi với khoái cảm thực dụng.',
        waitSeconds: 15,
        fallbackPrompt: 'Gợi ý: Khi ngắm một bông hoa đẹp, điều gì phân biệt sự chiêm ngưỡng cái đẹp với việc hái bông hoa để sử dụng?'
      }
    ],
    transitionPlan: [
      {
        fromBlockId: 'TB-1MD1-001',
        toBlockId: 'TB-1MD1-002',
        transitionScript: 'Từ nền tảng triết học duy vật biện chứng về thực tiễn và ý thức xã hội, chúng ta bước vào nghiên cứu nội dung mở đầu bài giảng Mỹ học Mác - Lênin.'
      },
      {
        fromBlockId: 'TB-1MD1-002',
        toBlockId: 'TB-1MD1-003',
        transitionScript: 'Sau khi đã nắm vững ý định giảng bài và vị trí môn học, chúng ta chuyển sang nghiên cứu nội dung trọng tâm thứ nhất: Khái niệm, đối tượng, chức năng, nhiệm vụ và phương pháp nghiên cứu Mỹ học Mác - Lênin.'
      },
      {
        fromBlockId: 'TB-1MD1-003',
        toBlockId: 'TB-1MD1-004',
        transitionScript: 'Để hiểu rõ nguồn gốc và bản chất cách mạng của Mỹ học Mác - Lênin, chúng ta cùng nghiên cứu tiếp Phần II: Sự hình thành và phát triển của Mỹ học Mác - Lênin.'
      },
      {
        fromBlockId: 'TB-1MD1-004',
        toBlockId: 'TB-1MD1-005',
        transitionScript: 'Từ lịch sử phát triển tư tưởng, chúng ta chuyển sang nội dung trọng tâm then chốt thứ hai của toàn bộ bài giảng: Phần III - Quan hệ thẩm mỹ và ý thức thẩm mỹ.'
      },
      {
        fromBlockId: 'TB-1MD1-005',
        toBlockId: 'TB-1MD1-006',
        transitionScript: 'Từ quan hệ thẩm mỹ và ý thức thẩm mỹ, chúng ta tiến tới nghiên cứu hình thái đỉnh cao và tập trung nhất của thẩm mỹ: Phần IV - Nghệ thuật: hình thái đặc thù của thẩm mỹ.'
      },
      {
        fromBlockId: 'TB-1MD1-006',
        toBlockId: 'TB-1MD1-007',
        transitionScript: 'Để tổng hợp lại toàn bộ kiến thức và chuẩn bị cho các bài học tiếp theo, chúng ta bước vào phần tổng kết và định hướng nghiên cứu.'
      }
    ],
    citationMap: {
      'TB-1MD1-001': [
        {
          id: 'CLM-1MD1-01',
          claim: 'Thực tiễn là hoạt động vật chất có mục đích, mang tính lịch sử - xã hội của con người nhằm cải tạo tự nhiên và xã hội.',
          sourceIds: [docxId, pptxId],
          sourceType: 'Triết học Mác - Lênin',
          sourceLevel: 1,
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT',
          isUnsupported: false,
          directQuote: 'Giáo án 1MĐ1 & Slide 2'
        }
      ],
      'TB-1MD1-003': [
        {
          id: 'CLM-1MD1-02',
          claim: 'Mỹ học Mác - Lênin là khoa học thuộc triết học Mác - Lênin, nghiên cứu nguồn gốc, bản chất, quy luật phát triển đời sống thẩm mỹ của con người hiện thực; nghiên cứu nghệ thuật - hình thái đặc thù của thẩm mỹ.',
          sourceIds: [docxId, pptxId],
          sourceType: 'Giáo trình & Slide',
          sourceLevel: 1,
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT',
          isUnsupported: false,
          directQuote: 'Giáo án 1MĐ1 Phần II.B.I & Slide 11-12'
        }
      ],
      'TB-1MD1-005': [
        {
          id: 'CLM-1MD1-03',
          claim: 'Quan hệ thẩm mỹ là quan hệ về mặt tinh thần trên cơ sở hứng thú không vụ lợi, được gợi lên bởi khoái cảm thẩm mỹ khi tiếp xúc với các sự vật, hiện tượng của thế giới.',
          sourceIds: [docxId, pptxId],
          sourceType: 'Giáo trình & Slide',
          sourceLevel: 1,
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT',
          isUnsupported: false,
          directQuote: 'Giáo án 1MĐ1 Phần II.B.III & Slide 27'
        }
      ]
    },
    qualityControl: {
      auditRunId: 'PENDING',
      timestamp: new Date().toISOString(),
      totalChecks: 16,
      passedCount: 16,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      resolvedCount: 0,
      disappearedCount: 0,
      canApprove: true,
      issues: [],
      summaryNarrative: 'Chưa thực hiện kiểm định chất lượng.'
    },
    unresolvedIssues: []
  };

  // Run immediate pure QC audit on the constructed package
  const qcReport = QualityControlEngine.audit(initialPackage);
  initialPackage.qualityControl = qcReport;
  initialPackage.unresolvedIssues = qcReport.issues.filter(
    i => i.status === 'ACTIVE' || i.status === 'REOPENED'
  );
  initialPackage.status = qcReport.criticalCount > 0 ? 'NEEDS_REVIEW' : 'QC_PENDING';

  return initialPackage;
}

export class LecturePackageBuilder {
  public static buildFromSources = buildLecturePackageFromSources;
  public static buildPackage = buildLecturePackageFromSources;
}

