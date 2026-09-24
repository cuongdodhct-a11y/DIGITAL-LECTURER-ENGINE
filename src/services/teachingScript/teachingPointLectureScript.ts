/**
 * Phase 1.5.6 & 1.5.6B — Real Lecture Script Generation & Spoken Normalization
 * Implements canonical pedagogical lecture scripts for Slides 15 - 18 (8 TeachingPoints).
 * 
 * Strict Two-Layer Separation:
 * Layer A: Internal Structure (opening, explanation, core_emphasis, clarification, example_or_application, transition, sources)
 * Layer B: Spoken Delivery (fullLectureScript) — Pure natural voice delivery for TTS / Live Voice,
 *          completely free of metadata leakage (no "Slide", "Statement", "Luận điểm", labels, or unsupported metaphors).
 */

export interface InteractiveQuestionScript {
  preQuestion: string;
  question: string;
  waitInstruction: string;
  expectedDirection: string;
  postQuestionTransition: string;
}

export interface LectureScriptSourceRef {
  sourceId: string;
  locator: {
    slideNumber?: number;
    section?: string;
    pageOrParagraph?: string;
  };
}

export interface TeachingPointLectureScript {
  packageId: string;
  teachingBlockId: string;
  slideNumber: number;
  teachingPointId: string;
  pointTitle: string;
  pointType: string;
  durationSeconds: number;
  sources: LectureScriptSourceRef[];

  // 6 canonical sections (Internal Structure layer):
  opening: string;               // A. Dẫn vào đúng luận điểm đang trình bày
  explanation: string;           // B. Giải thích bản chất, nội dung và quan hệ của luận điểm
  core_emphasis: string;         // C. Nêu rõ điều học viên cần ghi nhớ
  clarification: string;         // D. Làm rõ những điểm dễ hiểu sai hoặc dễ nhầm nếu nguồn có đề cập
  example_or_application: string; // E. Chỉ sử dụng khi PPTX/DOCX có ví dụ, liên hệ hoặc định hướng ứng dụng. Không tự bịa.
  transition: string;            // F. Câu chuyển sang TeachingPoint kế tiếp

  // Optional interactive question if source specifies
  interactiveQuestion?: InteractiveQuestionScript;

  // Spoken Delivery Layer: Sanitized, natural teacher voice output for TTS / Live Audio
  fullLectureScript: string;
  wordCount: number;
}

export const SLIDES_15_18_LECTURE_SCRIPTS: TeachingPointLectureScript[] = [
  // =========================================================================
  // SLIDE 15 - POINT 1: TP-1MD1-S15-01
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 15,
    teachingPointId: 'TP-1MD1-S15-01',
    pointTitle: 'Chức năng của Mỹ học Mác - Lênin & Chức năng nhận thức',
    pointType: 'FUNCTION_ANALYSIS',
    durationSeconds: 80,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 15, section: '2.a. Chức năng nhận thức' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng của Mỹ học Mác - Lênin - Chức năng nhận thức' }
      }
    ],
    opening: 'Bước vào nghiên cứu hệ thống chức năng của Mỹ học Mác - Lênin, trước hết chúng ta làm rõ chức năng nền tảng hàng đầu: đó là chức năng nhận thức.',
    explanation: 'Về bản chất, chức năng nhận thức giúp người học hiểu rõ nguồn gốc, bản chất và quy luật phát triển của đời sống thẩm mỹ trong xã hội; đồng thời hiểu đúng quy luật vận động của nghệ thuật với tính cách là hình thái biểu hiện đặc thù của cái thẩm mỹ theo quan điểm duy vật biện chứng.',
    core_emphasis: 'Điểm cốt lõi các đồng chí cần nắm chắc: Nhận thức thẩm mỹ mácxít không dừng lại ở cảm nhận cảm tính bên ngoài, mà đi sâu phát hiện bản chất xã hội và quy luật khách quan chi phối các hiện tượng thẩm mỹ.',
    clarification: 'Cần phân biệt rõ: Tri thức mỹ học không phải là sự suy diễn tư biện trừu tượng, mà là hệ thống tri thức khoa học bắt nguồn từ thực tiễn lao động và đời sống xã hội.',
    example_or_application: 'Nguồn tài liệu xác định rõ định hướng ứng dụng: Tri thức mỹ học là nền tảng trực tiếp để nâng cao ý thức thẩm mỹ, phát triển năng lực thưởng thức, đánh giá và sáng tạo các giá trị thẩm mỹ, nghệ thuật trong thực tiễn.',
    transition: 'Vậy nội dung trực tiếp của việc trang bị tri thức khoa học về cái thẩm mỹ được thể hiện cụ thể ra sao? Chúng ta cùng đi sâu vào nội dung tiếp theo.',
    fullLectureScript:
      'Bước vào nghiên cứu hệ thống chức năng của Mỹ học Mác - Lênin, trước hết chúng ta làm rõ chức năng nền tảng hàng đầu: đó là chức năng nhận thức. Về bản chất, chức năng nhận thức giúp người học hiểu rõ nguồn gốc, bản chất và quy luật phát triển của đời sống thẩm mỹ trong xã hội; đồng thời hiểu đúng quy luật vận động của nghệ thuật với tính cách là hình thái biểu hiện đặc thù của cái thẩm mỹ theo quan điểm duy vật biện chứng. Nhận thức thẩm mỹ mácxít không dừng lại ở cảm nhận cảm tính bên ngoài, mà đi sâu phát hiện bản chất xã hội và quy luật khách quan chi phối các hiện tượng thẩm mỹ. Tri thức mỹ học không phải là sự suy diễn tư biện trừu tượng, mà là hệ thống tri thức khoa học bắt nguồn từ thực tiễn lao động và đời sống xã hội. Đây chính là nền tảng trực tiếp để nâng cao ý thức thẩm mỹ, phát triển năng lực thưởng thức, đánh giá và sáng tạo các giá trị thẩm mỹ, nghệ thuật trong thực tiễn. Vậy nội dung trực tiếp của việc trang bị tri thức khoa học về cái thẩm mỹ được thể hiện cụ thể ra sao? Chúng ta cùng đi sâu vào nội dung tiếp theo.',
    wordCount: 232
  },

  // =========================================================================
  // SLIDE 15 - POINT 2: TP-1MD1-S15-02
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 15,
    teachingPointId: 'TP-1MD1-S15-02',
    pointTitle: 'Nội dung chức năng nhận thức: Trang bị tri thức về cái thẩm mỹ',
    pointType: 'THEORETICAL_ARGUMENT',
    durationSeconds: 90,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 15, section: '2.a. Chức năng nhận thức' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng nhận thức & Ý nghĩa nghiên cứu' }
      }
    ],
    opening: 'Điểm cần làm rõ tiếp theo ở đây là nội dung trang bị tri thức của chức năng nhận thức và ý nghĩa chính trị trực tiếp của nó.',
    explanation: 'Mỹ học Mác - Lênin trang bị hệ thống tri thức khoa học giúp người học nhận thức đúng đắn các hiện tượng thẩm mỹ trong đời sống xã hội; từ đó nâng cao năng lực nhận thức cái thẩm mỹ trong thực tiễn và nhận thức đúng đắn quan điểm, đường lối của Đảng ta về phát triển nền văn hóa - nghệ thuật xã hội chủ nghĩa.',
    core_emphasis: 'Điều học viên cần ghi nhớ sâu sắc: Tri thức mỹ học là cơ sở lý luận để nhận thức và kiên định đường lối văn hóa, văn nghệ của Đảng; bảo đảm cho hoạt động nhận thức văn hóa luôn đứng vững trên lập trường mácxít.',
    clarification: 'Tránh ngộ nhận cho rằng mỹ học chỉ thuần túy phục vụ thưởng thức cá nhân; trong bản chất mácxít, nhận thức thẩm mỹ luôn gắn liền với định hướng chính trị và sự nghiệp xây dựng nền văn hóa cách mạng.',
    example_or_application: 'Vận dụng cụ thể được giáo trình chỉ rõ: Giúp người học nhận thức đúng quan điểm, đường lối của Đảng, vận dụng tri thức để đánh giá đúng đời sống văn hóa tinh thần và các tác phẩm nghệ thuật trong đời sống thực tiễn.',
    transition: 'Sau khi nhận thức đúng bản chất các hiện tượng thẩm mỹ, làm thế nào để củng cố niềm tin khoa học và định hướng phương pháp tư duy? Xin mời các đồng chí cùng chuyển tiếp sang nội dung quan trọng tiếp theo.',
    fullLectureScript:
      'Điểm cần làm rõ tiếp theo ở đây là nội dung trang bị tri thức của chức năng nhận thức và ý nghĩa chính trị trực tiếp của nó. Mỹ học Mác - Lênin trang bị hệ thống tri thức khoa học giúp người học nhận thức đúng đắn các hiện tượng thẩm mỹ trong đời sống xã hội; từ đó nâng cao năng lực nhận thức cái thẩm mỹ trong thực tiễn và nhận thức đúng đắn quan điểm, đường lối của Đảng ta về phát triển nền văn hóa - nghệ thuật xã hội chủ nghĩa. Tri thức mỹ học chính là cơ sở lý luận để nhận thức và kiên định đường lối văn hóa, văn nghệ của Đảng; bảo đảm cho hoạt động nhận thức văn hóa luôn đứng vững trên lập trường mácxít. Chúng ta không nên ngộ nhận rằng mỹ học chỉ thuần túy phục vụ thưởng thức cá nhân; trong bản chất mácxít, nhận thức thẩm mỹ luôn gắn liền với định hướng chính trị và sự nghiệp xây dựng nền văn hóa cách mạng. Giáo trình đã chỉ rõ: người học vận dụng tri thức này để nhận thức đúng quan điểm của Đảng, đồng thời đánh giá đúng đời sống văn hóa tinh thần và các tác phẩm nghệ thuật trong đời sống thực tế. Sau khi nhận thức đúng bản chất các hiện tượng thẩm mỹ, làm thế nào để củng cố niềm tin khoa học và định hướng phương pháp tư duy? Chúng ta cùng chuyển sang nội dung quan trọng tiếp theo.',
    wordCount: 264
  },

  // =========================================================================
  // SLIDE 16 - POINT 1: TP-1MD1-S16-01
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 16,
    teachingPointId: 'TP-1MD1-S16-01',
    pointTitle: 'Chức năng thế giới quan của Mỹ học Mác - Lênin',
    pointType: 'FUNCTION_ANALYSIS',
    durationSeconds: 85,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 16, section: '2.a. Chức năng TGQ, PPL' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng thế giới quan, phương pháp luận (Phát vấn)' }
      }
    ],
    opening: 'Chúng ta chuyển sang chức năng thứ hai mang ý nghĩa định hướng tư tưởng nền tảng: Chức năng thế giới quan của Mỹ học Mác - Lênin.',
    explanation: 'Về bản chất, Mỹ học Mác - Lênin cung cấp hệ thống quan niệm duy vật biện chứng về đời sống thẩm mỹ, khẳng định cái thẩm mỹ tồn tại khách quan và bắt nguồn từ thực tiễn xã hội; qua đó củng cố vững chắc thế giới quan duy vật biện chứng trong nhận thức và hoạt động thực tiễn xây dựng đời sống thẩm mỹ.',
    core_emphasis: 'Điều các đồng chí phải ghi nhớ: Chức năng thế giới quan góp phần khẳng định nền tảng tư tưởng của Đảng ta trong sự nghiệp xây dựng nền văn hóa Việt Nam tiên tiến, đậm đà bản sắc dân tộc.',
    clarification: 'Cần phân biệt rõ và kiên quyết khắc phục quan điểm duy tâm, thần bí coi cái đẹp là sản phẩm của ý niệm trừu tượng hoặc thuần túy do cảm xúc chủ quan tự sinh ra.',
    example_or_application: 'Tài liệu xác định rõ: Khẳng định nền tảng tư tưởng của Đảng ta trong xây dựng nền văn hóa tiên tiến, đậm đà bản sắc dân tộc; giữ vững lập trường giai cấp công nhân trong hoạt động văn hóa.',
    transition: 'Gắn liền hữu cơ với chức năng thế giới quan là phương pháp luận khoa học chỉ đạo hoạt động xem xét và đánh giá.',
    interactiveQuestion: {
      preQuestion: 'Để lớp học cùng tư duy sâu hơn về vai trò định hướng tư tưởng của chức năng này, tôi nêu câu hỏi phát vấn:',
      question: 'Tại sao Mỹ học Mác - Lênin lại mang chức năng thế giới quan và phương pháp luận?',
      waitInstruction: 'Xin mời các đồng chí suy nghĩ trong ít giây và liên hệ với nguồn gốc của cái thẩm mỹ.',
      expectedDirection: 'Học viên cần trả lời: Do môn học cung cấp hệ thống quan niệm duy vật biện chứng về đời sống thẩm mỹ, củng cố thế giới quan duy vật biện chứng trong nhận thức và hoạt động thực tiễn.',
      postQuestionTransition: 'Chính xác. Từ hệ thống quan niệm duy vật biện chứng đó, chúng ta đi tiếp vào chức năng phương pháp luận.'
    },
    fullLectureScript:
      'Chúng ta chuyển sang chức năng thứ hai mang ý nghĩa định hướng tư tưởng nền tảng: Chức năng thế giới quan của Mỹ học Mác - Lênin. Về bản chất, Mỹ học Mác - Lênin cung cấp hệ thống quan niệm duy vật biện chứng về đời sống thẩm mỹ, khẳng định cái thẩm mỹ tồn tại khách quan và bắt nguồn từ thực tiễn xã hội; qua đó củng cố vững chắc thế giới quan duy vật biện chứng trong nhận thức và hoạt động thực tiễn xây dựng đời sống thẩm mỹ. Chức năng thế giới quan này trực tiếp góp phần khẳng định nền tảng tư tưởng của Đảng ta trong sự nghiệp xây dựng nền văn hóa Việt Nam tiên tiến, đậm đà bản sắc dân tộc. Chúng ta cần kiên quyết khắc phục triệt để các quan điểm duy tâm, thần bí coi cái đẹp là sản phẩm của ý niệm trừu tượng hoặc thuần túy do cảm xúc chủ quan tự sinh ra. Tài liệu đã khẳng định rõ việc giữ vững lập trường giai cấp công nhân trong hoạt động văn hóa, bảo vệ nền tảng tư tưởng của Đảng. Gắn liền hữu cơ với chức năng thế giới quan là phương pháp luận khoa học chỉ đạo hoạt động xem xét và đánh giá trong thực tiễn.',
    wordCount: 226
  },

  // =========================================================================
  // SLIDE 16 - POINT 2: TP-1MD1-S16-02
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 16,
    teachingPointId: 'TP-1MD1-S16-02',
    pointTitle: 'Chức năng phương pháp luận chỉ đạo nhận thức và thực tiễn thẩm mỹ',
    pointType: 'METHODOLOGICAL_GUIDELINE',
    durationSeconds: 85,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 16, section: '2.a. Chức năng TGQ, PPL' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng thế giới quan, phương pháp luận (Kết luận)' }
      }
    ],
    opening: 'Tiếp theo, chúng ta phân tích mặt thứ hai hết sức căn bản: Chức năng phương pháp luận biện chứng duy vật.',
    explanation: 'Mỹ học Mác - Lênin cung cấp hệ thống tri thức lý luận khoa học và phương pháp biện chứng duy vật trong nhận thức, cải tạo đời sống thẩm mỹ của con người và xã hội; chỉ đạo cách thức tiếp cận, phân tích các hiện tượng thẩm mỹ trong tính lịch sử - cụ thể và trong mối quan hệ biện chứng với cơ sở kinh tế - xã hội.',
    core_emphasis: 'Điều quan trọng các đồng chí cần khắc sâu: Phương pháp luận mácxít giúp khắc phục triệt để lối tư duy kinh nghiệm chủ nghĩa và lối tư biện trong nhận thức, đánh giá và sáng tạo các giá trị thẩm mỹ.',
    clarification: 'Cần làm rõ: Đánh giá một hiện tượng thẩm mỹ hay tác phẩm nghệ thuật không thể dựa vào thói quen kinh nghiệm vụn vặt hay cảm tính chủ quan, mà phải đứng trên phương pháp luận duy vật biện chứng để xem xét toàn diện, khách quan.',
    example_or_application: 'Vận dụng thực tiễn được tài liệu khẳng định: Sử dụng phương pháp luận khoa học để cải tạo đời sống thẩm mỹ của xã hội, khắc phục các biểu hiện lệch lạc, tư biện trong sáng tạo và thưởng thức nghệ thuật.',
    transition: 'Khi người học đã được trang bị thế giới quan đúng đắn và phương pháp luận khoa học, tri thức mỹ học sẽ chuyển hóa thành sức mạnh giáo dục nhân cách như thế nào? Chúng ta cùng chuyển sang nội dung kế tiếp.',
    fullLectureScript:
      'Tiếp theo, chúng ta phân tích mặt thứ hai hết sức căn bản: Chức năng phương pháp luận biện chứng duy vật. Mỹ học Mác - Lênin cung cấp hệ thống tri thức lý luận khoa học và phương pháp biện chứng duy vật trong nhận thức, cải tạo đời sống thẩm mỹ của con người và xã hội; chỉ đạo cách thức tiếp cận, phân tích các hiện tượng thẩm mỹ trong tính lịch sử - cụ thể và trong mối quan hệ biện chứng với cơ sở kinh tế - xã hội. Phương pháp luận mácxít giúp khắc phục triệt để lối tư duy kinh nghiệm chủ nghĩa và lối tư biện trong nhận thức, đánh giá và sáng tạo các giá trị thẩm mỹ. Khi đánh giá một hiện tượng thẩm mỹ hay tác phẩm nghệ thuật, chúng ta không thể dựa vào thói quen kinh nghiệm vụn vặt hay cảm tính chủ quan, mà phải đứng trên lập trường duy vật biện chứng để xem xét một cách toàn diện và khách quan. Đó là cơ sở khoa học vững chắc để cải tạo đời sống thẩm mỹ xã hội, khắc phục các biểu hiện lệch lạc và tư biện. Khi người học đã được trang bị thế giới quan đúng đắn và phương pháp luận khoa học, tri thức mỹ học sẽ chuyển hóa thành sức mạnh giáo dục nhân cách như thế nào? Chúng ta cùng chuyển sang nội dung kế tiếp.',
    wordCount: 248
  },

  // =========================================================================
  // SLIDE 17 - POINT 1: TP-1MD1-S17-01
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 17,
    teachingPointId: 'TP-1MD1-S17-01',
    pointTitle: 'Chức năng giáo dục: Dẫn dắt con người vươn tới Chân - Thiện - Mỹ',
    pointType: 'FUNCTION_ANALYSIS',
    durationSeconds: 100,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 17, section: '2.a. Chức năng giáo dục' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng giáo dục' }
      }
    ],
    opening: 'Chúng ta đi vào chức năng có sức lay động trực tiếp và sâu sắc nhất đến tâm hồn con người: Chức năng giáo dục của Mỹ học Mác - Lênin.',
    explanation: 'Về bản chất, chức năng giáo dục thực hiện nhiệm vụ giáo dưỡng, định hướng, dẫn dắt con người phát triển vươn tới các giá trị cốt lõi là Chân - Thiện - Mỹ. Gắn bó hữu cơ với chức năng nhận thức, giáo dục thẩm mỹ giúp hình thành nhân cách con người mới, nâng cao năng lực thưởng thức, đánh giá và sáng tạo nghệ thuật.',
    core_emphasis: 'Đặc thù sư phạm cốt lõi học viên cần nắm vững: Giáo dục thẩm mỹ được thực hiện bằng con đường, biện pháp và hình thức có tính tự nguyện, có sự tinh tế cao; tác động thông qua cảm xúc và sự rung động thẩm mỹ chứ không dùng mệnh lệnh áp đặt.',
    clarification: 'Điểm cần làm rõ để không hiểu nhầm: Cái Đẹp không tách rời cái Đúng và cái Tốt. Giáo dục thẩm mỹ chân chính luôn gắn quyện hữu cơ giữa cái Mỹ với chân lý khoa học (Chân) và phẩm giá đạo đức cách mạng (Thiện).',
    example_or_application: 'Định hướng ứng dụng từ giáo trình: Cung cấp cơ sở lý luận khoa học để xây dựng các chương trình, phương pháp giáo dục thẩm mỹ phù hợp với đặc thù từng đối tượng, góp phần xây dựng con người mới xã hội chủ nghĩa.',
    transition: 'Đối với môi trường quân đội, chức năng giáo dục này phát huy tác dụng cụ thể như thế nào trong xây dựng nhân cách người quân nhân cách mạng? Chúng ta cùng tiếp tục làm rõ.',
    fullLectureScript:
      'Chúng ta đi vào chức năng có sức lay động trực tiếp và sâu sắc nhất đến tâm hồn con người: Chức năng giáo dục của Mỹ học Mác - Lênin. Về bản chất, chức năng giáo dục thực hiện nhiệm vụ giáo dưỡng, định hướng, dẫn dắt con người phát triển vươn tới các giá trị cốt lõi là Chân - Thiện - Mỹ. Gắn bó hữu cơ với chức năng nhận thức, giáo dục thẩm mỹ giúp hình thành nhân cách con người mới, nâng cao năng lực thưởng thức, đánh giá và sáng tạo nghệ thuật. Giáo dục thẩm mỹ được thực hiện bằng con đường, biện pháp và hình thức có tính tự nguyện, có sự tinh tế cao; tác động thông qua cảm xúc và sự rung động thẩm mỹ chứ không dùng mệnh lệnh áp đặt. Điều quan trọng là cái Đẹp không tách rời cái Đúng và cái Tốt. Giáo dục thẩm mỹ chân chính luôn gắn quyện hữu cơ giữa cái Mỹ với chân lý khoa học và phẩm giá đạo đức cách mạng. Giáo trình đã chỉ rõ: đây là cơ sở lý luận khoa học để xây dựng các chương trình, biện pháp giáo dục thẩm mỹ phù hợp với từng đối tượng, góp phần xây dựng con người mới xã hội chủ nghĩa. Đối với môi trường quân đội, chức năng giáo dục này phát huy tác dụng cụ thể như thế nào trong xây dựng nhân cách người quân nhân cách mạng? Chúng ta cùng tiếp tục làm rõ.',
    wordCount: 261
  },

  // =========================================================================
  // SLIDE 17 - POINT 2: TP-1MD1-S17-02
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 17,
    teachingPointId: 'TP-1MD1-S17-02',
    pointTitle: 'Xây dựng nhân cách toàn diện và môi trường văn hóa đạo đức',
    pointType: 'PRACTICAL_APPLICATION',
    durationSeconds: 90,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 17, section: '2.a. Chức năng giáo dục' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng giáo dục & 2.d. Ý nghĩa nghiên cứu trong Quân đội' }
      }
    ],
    opening: 'Nội dung tiếp theo gắn liền chức năng giáo dục với mục tiêu thực tiễn của công tác tư tưởng: Xây dựng nhân cách người quân nhân cách mạng.',
    explanation: 'Mỹ học Mác - Lênin cung cấp lý luận khoa học để chủ thể nhận thức đúng đời sống thẩm mỹ, gắn với chức năng nhận thức để góp phần xây dựng con người mới xã hội chủ nghĩa. Trong môi trường lực lượng vũ trang, giáo dục thẩm mỹ trực tiếp góp phần hoàn thiện phẩm chất, nhân cách người quân nhân cách mạng có lý tưởng cao đẹp, tâm hồn trong sáng và lối sống văn hóa mẫu mực.',
    core_emphasis: 'Điều học viên cần ghi nhớ sâu sắc: Giáo dục thẩm mỹ là một mắt xích không thể tách rời trong xây dựng quân đội vững mạnh về chính trị; giúp định hướng và giữ gìn môi trường văn hóa lành mạnh trước các tác động tiêu cực, phản văn hóa.',
    clarification: 'Tránh nhận thức phiến diện cho rằng xây dựng nhân cách quân nhân chỉ cần huấn luyện quân sự và kỷ luật nghiêm ngặt; nếu thiếu đời sống văn hóa thẩm mỹ lành mạnh, nhân cách bộ đội sẽ thiếu đi sự hài hòa và bản lĩnh văn hóa vững vàng.',
    example_or_application: 'Giáo trình chỉ rõ định hướng hành động: Người cán bộ chính trị nghiên cứu chức năng này để hình thành phương pháp, cách thức xây dựng đời sống thẩm mỹ lành mạnh tại đơn vị cơ sở trên cương vị chức trách được giao.',
    transition: 'Bên cạnh ba chức năng nhận thức, thế giới quan phương pháp luận và giáo dục, chúng ta cùng tiếp tục phân tích hai chức năng mang tầm chiến lược phát triển văn hóa ngay sau đây.',
    fullLectureScript:
      'Nội dung tiếp theo gắn liền chức năng giáo dục với mục tiêu thực tiễn: Xây dựng nhân cách người quân nhân cách mạng. Mỹ học Mác - Lênin cung cấp lý luận khoa học giúp chủ thể nhận thức đúng đời sống thẩm mỹ, gắn với chức năng nhận thức để góp phần xây dựng con người mới xã hội chủ nghĩa. Trong môi trường lực lượng vũ trang, giáo dục thẩm mỹ trực tiếp góp phần hoàn thiện phẩm chất, nhân cách người quân nhân cách mạng có lý tưởng cao đẹp, tâm hồn trong sáng và lối sống văn hóa mẫu mực. Giáo dục thẩm mỹ là một mắt xích không thể tách rời trong xây dựng quân đội vững mạnh về chính trị, giúp định hướng và giữ gìn môi trường văn hóa lành mạnh trước các tác động tiêu cực, phản văn hóa. Chúng ta cần tránh nhận thức phiến diện cho rằng xây dựng nhân cách quân nhân chỉ thuần túy huấn luyện quân sự và kỷ luật; nếu thiếu đời sống thẩm mỹ lành mạnh, nhân cách bộ đội sẽ thiếu đi sự hài hòa và bản lĩnh văn hóa vững vàng. Người cán bộ chính trị nghiên cứu chức năng này để hình thành phương pháp xây dựng đời sống thẩm mỹ lành mạnh tại đơn vị cơ sở theo chức trách được giao. Bên cạnh ba chức năng nhận thức, thế giới quan phương pháp luận và giáo dục, chúng ta cùng tiếp tục phân tích hai chức năng mang tầm chiến lược phát triển văn hóa ngay sau đây.',
    wordCount: 269
  },

  // =========================================================================
  // SLIDE 18 - POINT 1: TP-1MD1-S18-01
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 18,
    teachingPointId: 'TP-1MD1-S18-01',
    pointTitle: 'Chức năng dự báo của Mỹ học Mác - Lênin',
    pointType: 'FUNCTION_ANALYSIS',
    durationSeconds: 75,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 18, section: '2.a. Chức năng dự báo' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng dự báo' }
      }
    ],
    opening: 'Chúng ta phân tích chức năng có tính định hướng tương lai của môn học: Chức năng dự báo của Mỹ học Mác - Lênin.',
    explanation: 'Dựa trên việc nắm vững các quy luật vận động xã hội và quy luật phát triển nghệ thuật, môn học thực hiện chức năng dự báo xu hướng phát triển của đời sống thẩm mỹ và xu hướng biến đổi của các giá trị thẩm mỹ theo sự chuyển biến của thời đại.',
    core_emphasis: 'Ý nghĩa then chốt cần ghi nhớ: Chức năng dự báo góp phần định hướng chiến lược phát triển văn hóa - nghệ thuật của Đảng và Nhà nước, chủ động định hướng lành mạnh thị hiếu thẩm mỹ xã hội.',
    clarification: 'Cần phân biệt rõ: Dự báo thẩm mỹ không phải là sự phỏng đoán cảm tính, mà là dự báo khoa học dựa trên việc phân tích các quy luật khách quan của đời sống tinh thần.',
    example_or_application: 'Nguồn tài liệu DOCX xác định rõ: Góp phần định hướng chiến lược phát triển văn hóa - nghệ thuật, giúp các cơ quan lãnh đạo văn hóa chủ động định hướng thị hiếu, không bị động trước các trào lưu mới.',
    transition: 'Gắn liền với việc dự báo các xu hướng tương lai là trách nhiệm đối với các giá trị di sản trong hiện tại, được thể hiện ở chức năng giữ gìn và phát triển giá trị thẩm mỹ.',
    fullLectureScript:
      'Chúng ta phân tích chức năng có tính định hướng tương lai của môn học: Chức năng dự báo của Mỹ học Mác - Lênin. Dựa trên việc nắm vững các quy luật vận động xã hội và quy luật phát triển nghệ thuật, môn học dự báo xu hướng phát triển của đời sống thẩm mỹ và xu hướng biến đổi của các giá trị thẩm mỹ theo sự chuyển biến thời đại. Chức năng này góp phần định hướng chiến lược phát triển văn hóa - nghệ thuật của Đảng và Nhà nước, chủ động định hướng lành mạnh thị hiếu thẩm mỹ xã hội. Dự báo thẩm mỹ không phải là sự phỏng đoán cảm tính, mà là dự báo khoa học dựa trên việc phân tích các quy luật khách quan của đời sống tinh thần. Tài liệu đã chỉ rõ vai trò định hướng chiến lược phát triển văn hóa - nghệ thuật, giúp các cơ quan lãnh đạo văn hóa chủ động định hướng thị hiếu, không bị động trước các trào lưu mới. Gắn liền với dự báo xu hướng tương lai là trách nhiệm đối với các di sản trong hiện tại, được thể hiện ở chức năng giữ gìn và phát triển giá trị thẩm mỹ.',
    wordCount: 215
  },

  // =========================================================================
  // SLIDE 18 - POINT 2: TP-1MD1-S18-02
  // =========================================================================
  {
    packageId: 'LPKG-1MD1-001',
    teachingBlockId: 'TB-1MD1-003',
    slideNumber: 18,
    teachingPointId: 'TP-1MD1-S18-02',
    pointTitle: 'Chức năng giữ gìn và phát triển giá trị thẩm mỹ',
    pointType: 'FUNCTION_ANALYSIS',
    durationSeconds: 75,
    sources: [
      {
        sourceId: 'SRC-006',
        locator: { slideNumber: 18, section: '2.a. Chức năng giữ gìn, phát triển giá trị thẩm mỹ' }
      },
      {
        sourceId: 'SRC-007',
        locator: { section: '2.a. Chức năng giữ gìn, phát triển giá trị thẩm mỹ' }
      }
    ],
    opening: 'Chúng ta đi vào chức năng thứ năm: Chức năng giữ gìn và phát triển giá trị thẩm mỹ của Mỹ học Mác - Lênin.',
    explanation: 'Chức năng này đòi hỏi sự thống nhất biện chứng giữa hai mặt: một mặt là bảo tồn các giá trị thẩm mỹ truyền thống và các di sản văn hóa quý báu của dân tộc; mặt khác là phát triển các giá trị thẩm mỹ mới phù hợp với tiến bộ xã hội.',
    core_emphasis: 'Điều các đồng chí cần ghi nhớ sâu sắc: Giữ gìn để bảo vệ cội nguồn bản sắc, còn phát triển để làm giàu thêm đời sống văn hóa thẩm mỹ của dân tộc trong thời đại mới.',
    clarification: 'Cần phân biệt rõ: Bảo tồn giá trị truyền thống không đồng nghĩa với bảo thủ, nệ cổ; đồng thời kiên quyết đấu tranh chống thái độ hư vô chủ nghĩa, phủ nhận sạch trơn di sản thẩm mỹ quá khứ.',
    example_or_application: 'Nguồn tài liệu DOCX xác định rõ định hướng: Định hướng cho hoạt động sáng tạo và giáo dục nghệ thuật; bảo tồn di sản văn hóa gắn với sáng tạo các giá trị thẩm mỹ mới của nền văn hóa xã hội chủ nghĩa.',
    transition: 'Như vậy, chúng ta đã hoàn thành nghiên cứu 5 chức năng cơ bản của môn học. Từ hệ thống chức năng này, nhiệm vụ cụ thể của môn học là gì? Xin mời các đồng chí cùng bước tiếp sang nội dung tiếp theo.',
    fullLectureScript:
      'Chúng ta đi vào chức năng thứ năm: Chức năng giữ gìn và phát triển giá trị thẩm mỹ của Mỹ học Mác - Lênin. Chức năng này đòi hỏi sự thống nhất biện chứng giữa hai mặt: một mặt bảo tồn các giá trị thẩm mỹ truyền thống và di sản văn hóa quý báu của dân tộc; mặt khác phát triển các giá trị thẩm mỹ mới phù hợp với tiến bộ xã hội. Chúng ta giữ gìn để bảo vệ cội nguồn bản sắc, đồng thời phát triển để làm giàu thêm đời sống văn hóa thẩm mỹ của dân tộc trong thời đại mới. Bảo tồn giá trị truyền thống không đồng nghĩa với bảo thủ, nệ cổ; đồng thời kiên quyết chống thái độ hư vô chủ nghĩa, phủ nhận sạch trơn di sản thẩm mỹ quá khứ. Tài liệu xác định rõ: định hướng cho hoạt động sáng tạo và giáo dục nghệ thuật; bảo tồn di sản gắn chặt với sáng tạo giá trị thẩm mỹ mới của nền văn hóa xã hội chủ nghĩa. Như vậy, chúng ta đã nghiên cứu xong năm chức năng cơ bản của môn học. Từ hệ thống chức năng này, nhiệm vụ cụ thể của môn học là gì? Xin mời các đồng chí cùng bước tiếp sang nội dung tiếp theo.',
    wordCount: 226
  }
];

export function getTeachingPointLectureScripts(): TeachingPointLectureScript[] {
  return SLIDES_15_18_LECTURE_SCRIPTS;
}

export function findLectureScriptByPointId(pointId: string): TeachingPointLectureScript | undefined {
  return SLIDES_15_18_LECTURE_SCRIPTS.find(s => s.teachingPointId === pointId);
}
