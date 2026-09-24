/**
 * Digital Lecturer Engine - Sample University Lecture Package
 * Course: CS-401: Distributed Systems & Byzantine Fault Tolerance
 * Lecture 07: Principles of Distributed Consensus & The Byzantine Generals Problem
 *
 * Contains authentic academic materials across Levels 1-6, including intentional
 * pedagogical test cases for Quality Control verification (timing mismatch, slide topic mismatch,
 * and source conflict).
 */

import { RegisteredDocument, SourceClaim } from '../types/source';
import { LecturePackage, LectureObjective, SlideMapItem } from '../types/lecture';
import { TeachingBlock } from '../types/teaching';
import { QualityControlEngine } from '../services/qualityControl/qualityControlEngine';

export const SAMPLE_DOCUMENTS: RegisteredDocument[] = [
  {
    sourceId: 'SRC-001',
    filename: 'De_cuong_Chi_tiet_Bai_07_CS401.docx',
    documentType: 'DOCX',
    sourceLevel: 1,
    title: 'Đề cương Bài giảng số 07: Nguyên lý Đồng thuận Phân tán & Bài toán Tướng lĩnh Byzantine',
    author: 'Bộ môn Khoa học Máy tính - Khoa CNTT',
    year: 2026,
    publisher: 'Hội đồng Khoa học Khoa CNTT',
    pageCount: 6,
    status: 'REGISTERED',
    extractedText: `HỌC PHẦN: CS-401 HỆ THỐNG PHÂN TÁN
BÀI 07: NGUYÊN LÝ ĐỒNG THUẬN PHÂN TÁN & BÀI TOÁN TƯỚNG LĨNH BYZANTINE
Thời lượng phân bổ: 45 phút giảng dạy trực tiếp.
Mục tiêu bài học:
1. G1: Trình bày được định nghĩa tính đồng thuận (Consensus), phân biệt Crash Fault và Byzantine Fault.
2. G2: Phân tích được điều kiện cần n >= 3f + 1 để đạt đồng thuận Byzantine theo công trình Lamport (1982).
3. G3: Ứng dụng mô hình PBFT trong các hệ thống giao dịch phân tán và chuỗi khối.
Yêu cầu sư phạm: Giảng viên diễn giải sâu sắc về bản chất bất đối xứng thông tin, đặt câu hỏi kiểm tra tư duy sinh viên, không lướt slide cơ học.`,
    metadata: {
      fileSize: 48200,
      extractedAt: '2026-09-23T18:00:00.000Z',
      chapterSections: ['Mục tiêu', 'Thời lượng', 'Nội dung cốt lõi', 'Phương pháp giảng dạy']
    }
  },
  {
    sourceId: 'SRC-002',
    filename: 'Giao_trinh_He_thong_Phan_tan_Nang_cao_2025.pdf',
    documentType: 'PDF',
    sourceLevel: 2,
    title: 'Giáo trình Hệ thống Phân tán Nâng cao (Tập 2)',
    author: 'GS. TSKH. Nguyễn Thanh Bình',
    year: 2025,
    publisher: 'NXB Đại học Quốc gia',
    pageCount: 384,
    status: 'REGISTERED',
    extractedText: `CHƯƠNG 5: CÁC GIẢI THUẬT ĐỒNG THUẬN
Trang 142: Đồng thuận phân tán (Distributed Consensus) là tiến trình trong đó tập hợp các tiến trình phân tán độc lập đạt được sự nhất trí trên một giá trị duy nhất v.
Hai thuộc tính nền tảng của một giao thức đồng thuận đúng đắn:
1. Tính an toàn (Safety / Agreement): Mọi tiến trình không lỗi đều phải quyết định cùng một giá trị.
2. Tính sống (Liveness / Termination): Mọi tiến trình không lỗi cuối cùng đều sẽ đưa ra quyết định.
Lỗi Crash: Nút ngừng hoạt động mà không gửi thông điệp sai lệch.
Lỗi Byzantine: Nút có thể gửi thông điệp mâu thuẫn, giả mạo dữ liệu hoặc cấu kết phá hoại mạng.`,
    metadata: {
      fileSize: 1245000,
      extractedAt: '2026-09-23T18:00:00.000Z',
      chapterSections: ['Chương 5.1 Khái niệm đồng thuận', 'Chương 5.2 Lỗi Crash và Byzantine']
    }
  },
  {
    sourceId: 'SRC-003',
    filename: 'Slide_Bai_07_Dong_thuan_CS401.pptx',
    documentType: 'PPTX',
    sourceLevel: 3,
    title: 'Slide Bài giảng 07: Đồng thuận Phân tán & PBFT',
    author: 'Giảng viên phụ trách môn học',
    year: 2026,
    slideCount: 8,
    status: 'REGISTERED',
    extractedText: `[Slide 1: Tiêu đề Bài học: Đồng thuận Phân tán CS-401]
[Slide 2: Đặt vấn đề: Tại sao các nút máy chủ phân tán cần đồng thuận?]
[Slide 3: Định nghĩa Đồng thuận: Safety và Liveness]
[Slide 4: Bài toán Các vị tướng Byzantine (The Byzantine Generals Problem)]
[Slide 5: Giới hạn toán học: Tại sao cần n >= 3f + 1 nút?]
[Slide 6: Phân phối Khóa Lượng tử (Quantum Key Distribution - BB84 Protocol)] -> SLIDE MISMATCH TEST CASE
[Slide 7: Ứng dụng thực tiễn: Thuật toán PBFT trong Blockchain]
[Slide 8: Tổng kết bài học và Bài tập tình huống]`,
    metadata: {
      fileSize: 345000,
      extractedAt: '2026-09-23T18:00:00.000Z'
    }
  },
  {
    sourceId: 'SRC-004',
    filename: 'Lamport_1982_The_Byzantine_Generals_Problem.pdf',
    documentType: 'PDF',
    sourceLevel: 4,
    title: 'The Byzantine Generals Problem (ACM TOPLAS, 1982)',
    author: 'Leslie Lamport, Robert Shostak, Marshall Pease',
    year: 1982,
    publisher: 'ACM Transactions on Programming Languages and Systems',
    pageCount: 20,
    status: 'REGISTERED',
    extractedText: `Canonical Quote: "We imagine that several divisions of the Byzantine army are camped outside an enemy city... The generals must agree on a common plan. However, some of the generals may be traitors."
Theorem 1: For any algorithm to guarantee consensus in the presence of m traitors, there must be at least 3m + 1 generals in total. No solution is possible with only 3 generals and 1 traitor.`,
    metadata: {
      fileSize: 420000,
      extractedAt: '2026-09-23T18:00:00.000Z'
    }
  },
  {
    sourceId: 'SRC-005',
    filename: 'Quy_chuan_An_toan_He_thong_Thong_tin_Cap_do_4.pdf',
    documentType: 'PDF',
    sourceLevel: 5,
    title: 'Tiêu chuẩn Kỹ thuật Quốc gia về Khả năng Chịu lỗi Hệ thống Dữ liệu Trọng yếu',
    author: 'Cục An toàn Thông tin - Bộ TT&TT',
    year: 2024,
    pageCount: 45,
    status: 'REGISTERED',
    extractedText: `Điều 12: Các hệ thống thanh toán liên ngân hàng và hạ tầng xác thực quốc gia bắt buộc phải triển khai cơ chế đồng thuận phân tán có khả năng kháng lỗi bất đối xứng Byzantine, tối thiểu hóa độ trễ xác nhận dưới 100ms.`,
    metadata: {
      fileSize: 180000,
      extractedAt: '2026-09-23T18:00:00.000Z'
    }
  }
];

export const SAMPLE_OBJECTIVES: LectureObjective[] = [
  {
    id: 'OBJ-001',
    code: 'G1',
    statement: 'Trình bày định nghĩa chuẩn xác của tính đồng thuận phân tán (Distributed Consensus), phân biệt rành mạch giữa Crash Fault và Byzantine Fault.',
    cognitiveLevel: 'COMPREHENSION',
    targetAudience: 'Sinh viên năm thứ 3 chuyên ngành Khoa học Máy tính / An toàn Thông tin',
    mappedBlockIds: ['TB-001', 'TB-002']
  },
  {
    id: 'OBJ-002',
    code: 'G2',
    statement: 'Phân tích định lý Lamport (1982) chứng minh điều kiện biên n >= 3f + 1 trong môi trường mạng đồng thuận có tướng phản bội.',
    cognitiveLevel: 'ANALYSIS',
    targetAudience: 'Sinh viên CS-401',
    mappedBlockIds: ['TB-003', 'TB-004']
  },
  {
    id: 'OBJ-003',
    code: 'G3',
    statement: 'Đánh giá ứng dụng thực tiễn của giao thức PBFT (Practical Byzantine Fault Tolerance) trong hệ thống tài chính phân tán hiện đại.',
    cognitiveLevel: 'APPLICATION',
    targetAudience: 'Sinh viên CS-401',
    mappedBlockIds: ['TB-005']
  }
];

export const SAMPLE_SLIDE_MAP: SlideMapItem[] = [
  {
    slideNumber: 1,
    title: 'Đồng thuận Phân tán & Bài toán Tướng lĩnh Byzantine',
    sourceText: 'Giới thiệu môn học CS-401, Bài giảng số 07, Giảng viên: Bộ môn KHMT',
    mappedTeachingBlockIds: ['TB-001'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['CS-401 Hệ thống Phân tán', 'Bài 07: Đồng thuận Phân tán', 'Mục tiêu: G1, G2, G3']
  },
  {
    slideNumber: 2,
    title: 'Vấn đề Cốt lõi: Nhất quán trong Môi trường Bất định',
    sourceText: 'Tại sao các máy chủ phân tán cần thống nhất dữ liệu mà không có đồng hồ dùng chung?',
    mappedTeachingBlockIds: ['TB-001'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['Không có shared memory', 'Mạng trễ không giới hạn', 'Nút có thể gặp sự cố']
  },
  {
    slideNumber: 3,
    title: 'Hai Trụ cột: Safety & Liveness trong Đồng thuận',
    sourceText: 'Safety: Không bao giờ quyết định sai. Liveness: Cuối cùng phải đưa ra quyết định.',
    mappedTeachingBlockIds: ['TB-002'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['Safety (Tính an toàn)', 'Liveness (Tính sống)', 'Định lý FLP Impossibility']
  },
  {
    slideNumber: 4,
    title: 'Bài toán Các vị tướng Byzantine (Lamport, 1982)',
    sourceText: 'Mô hình hóa các tướng quân bao vây thành trì: Tướng trung thành vs Tướng phản bội.',
    mappedTeachingBlockIds: ['TB-003'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['Các sư đoàn Byzantine', 'Tướng chỉ huy và Tướng cấp dưới', 'Thông điệp mâu thuẫn']
  },
  {
    slideNumber: 5,
    title: 'Định lý Lamport: Điều kiện n >= 3f + 1',
    sourceText: 'Chứng minh với 3 tướng và 1 kẻ phản bội không thể đạt đồng thuận tuyệt đối.',
    mappedTeachingBlockIds: ['TB-004'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['Trường hợp n=3, f=1: Bế tắc', 'Công thức tổng quát n >= 3f + 1', 'Độ tin cậy toán học']
  },
  {
    slideNumber: 6,
    title: 'Giao thức Phân phối Khóa Lượng tử BB84',
    sourceText: 'Phân cực photon trong mật mã lượng tử, nguyên lý bất định Heisenberg.',
    mappedTeachingBlockIds: [],
    status: 'MISMATCHED',
    issues: ['SLIDE_TOPIC_MISMATCH: Slide thuộc chuyên đề Mật mã Lượng tử, không liên quan đến Đồng thuận Phân tán CS-401.'],
    previewBullets: ['Photon polarization', 'Heisenberg uncertainty', 'Quantum key distribution'],
    suggestedAction: 'Giảng viên cần xác nhận loại trừ slide này hoặc chuyển về bài giảng Mật mã học.'
  },
  {
    slideNumber: 7,
    title: 'Ứng dụng Thực tế: PBFT (Castro & Liskov 1999)',
    sourceText: 'Pre-prepare -> Prepare -> Commit. Khả năng chịu lỗi trong hạ tầng Blockchain.',
    mappedTeachingBlockIds: ['TB-005'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['3 pha: Pre-prepare, Prepare, Commit', 'Áp dụng cho Hyperledger Fabric', 'Kháng 1/3 số nút độc hại']
  },
  {
    slideNumber: 8,
    title: 'Tổng kết Bài học & Câu hỏi Tình huống',
    sourceText: 'Tóm lược Safety/Liveness, n >= 3f + 1 và bài tập thiết kế hệ thống ngân hàng.',
    mappedTeachingBlockIds: ['TB-006'],
    status: 'MAPPED',
    issues: [],
    previewBullets: ['Điểm cốt lõi cần nhớ', 'Bài tập thiết kế cụm 4 máy chủ', 'Tài liệu đọc thêm tuần tới']
  }
];

export const SAMPLE_TEACHING_BLOCKS: TeachingBlock[] = [
  {
    id: 'TB-001',
    slideStart: 1,
    slideEnd: 2,
    topic: 'Giới thiệu & Vấn đề Cốt lõi của Đồng thuận Phân tán',
    purpose: 'Đặt vấn đề sư phạm, khơi gợi nhận thức về sự bất khả của trạng thái toàn cục trong hệ thống phân tán.',
    objectiveIds: ['OBJ-001'],
    keyPoints: [
      'Hệ thống phân tán không có bộ nhớ dùng chung hay đồng hồ vật lý đồng bộ tuyệt đối.',
      'Sự cần thiết của một cơ chế đồng thuận (Consensus) để các nút hoạt động như một thể thống nhất.'
    ],
    lectureText: 'Chào các bạn sinh viên. Hôm nay chúng ta bước vào một trong những chủ đề kinh điển và quan trọng bậc nhất của ngành khoa học máy tính: Nguyên lý Đồng thuận Phân tán. Hãy hình dung một hệ thống ngân hàng với hàng trăm máy chủ đặt tại nhiều châu lục. Làm thế nào để mọi máy chủ đều ghi nhận cùng một số dư tài khoản khi đường truyền mạng có thể bị trễ, đứt cáp, hoặc thậm chí máy chủ bị kẻ xấu thao túng? Đó chính là thách thức mà chúng ta sẽ giải quyết triệt để trong bài học hôm nay.',
    pedagogicalMethod: 'Diễn giảng kết hợp nêu vấn đề thực tiễn (Socratic questioning)',
    question: 'Nếu không có một máy chủ trung tâm duy nhất, làm thế nào hai nút độc lập biết chắc chắn mình đang có cùng một phiên bản dữ liệu?',
    waitSeconds: 12,
    expectedResponse: 'Sinh viên nêu ra ý niệm về việc trao đổi thông điệp xác nhận và biểu quyết đa số.',
    example: 'Hệ thống giao dịch thanh toán thẻ ATM liên ngân hàng Napas.',
    application: 'Đảm bảo tính nhất quán dữ liệu trong cụm cơ sở dữ liệu phân tán Cassandra/CockroachDB.',
    transition: 'Để hiểu được cách thức các máy chủ nhất trí, chúng ta cần nắm vững hai tiêu chuẩn vàng của tính đúng đắn: Safety và Liveness.',
    durationSeconds: 420, // 7 phút
    sources: [
      {
        sourceId: 'SRC-001',
        citation: 'Đề cương CS-401, Mục tiêu G1, trang 1',
        sourceType: 'LECTURE_PLAN',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 1'
      },
      {
        sourceId: 'SRC-002',
        citation: 'Giáo trình Hệ thống Phân tán, Chương 5, trang 142',
        sourceType: 'TEXTBOOK',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 142'
      }
    ],
    contentType: 'CORE_CONTENT',
    status: 'READY'
  },
  {
    id: 'TB-002',
    slideStart: 3,
    slideEnd: 3,
    topic: 'Hai Thuộc tính Nền tảng: Safety & Liveness',
    purpose: 'Phân tích bản chất lý thuyết của tính an toàn (Safety) và tính sống (Liveness), phân biệt lỗi dừng (Crash) và lỗi Byzantine.',
    objectiveIds: ['OBJ-001'],
    keyPoints: [
      'Safety: Không bao giờ có hai nút bình thường đưa ra hai quyết định xung đột nhau.',
      'Liveness: Cuối cùng mọi nút bình thường đều phải tiến tới trạng thái kết luận.',
      'Phân biệt Crash Fault (nút ngắt kết nối hoàn toàn) và Byzantine Fault (nút nói dối hoặc gửi dữ liệu mâu thuẫn).'
    ],
    lectureText: 'Trong lý thuyết hệ thống, mọi giao thức đồng thuận đều phải thỏa mãn hai thuộc tính bất khả xâm phạm. Thứ nhất là Safety – tính an toàn: tức là "điều xấu không bao giờ xảy ra". Không một nút trung thực nào được phép quyết định sai. Thứ hai là Liveness – tính sống: tức là "điều tốt cuối cùng sẽ xảy ra", hệ thống không được bế tắc vĩnh viễn. Đặc biệt, chúng ta phải phân biệt rất rạch ròi giữa lỗi Crash – máy chủ chỉ đơn giản sập nguồn, và lỗi Byzantine – khi một nút gửi thông tin sai lệch có chủ đích nhằm phá vỡ sự nhất quán của toàn mạng.',
    pedagogicalMethod: 'Phân tích đối chiếu khái niệm học thuật và phản chứng',
    question: 'Trong một hệ thống phân tán, nếu chúng ta ưu tiên tuyệt đối Safety mà chấp nhận tạm thời hy sinh Liveness thì trạng thái hệ thống sẽ ra sao?',
    waitSeconds: 15,
    expectedResponse: 'Hệ thống có thể tạm dừng phản hồi nhưng tuyệt đối không bao giờ làm sai lệch dữ liệu tài chính.',
    example: 'Khóa giao dịch khi mạng bị phân mảnh (Network Partition) theo định lý CAP.',
    application: 'Thiết kế hệ thống chuyển mạch tài chính Swift.',
    transition: 'Sau khi đã phân biệt lỗi Byzantine, câu hỏi hóc búa đặt ra là: Cần bao nhiêu nút để chống lại một kẻ phản bội cố tình nói dối? Chúng ta cùng bước vào công trình lịch sử của Leslie Lamport năm 1982.',
    durationSeconds: 540, // 9 phút
    sources: [
      {
        sourceId: 'SRC-002',
        citation: 'Giáo trình Hệ thống Phân tán, Chương 5.2, trang 145',
        sourceType: 'TEXTBOOK',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 145'
      }
    ],
    contentType: 'CORE_CONTENT',
    status: 'READY'
  },
  {
    id: 'TB-003',
    slideStart: 4,
    slideEnd: 4,
    topic: 'Bài toán Các vị tướng Byzantine (The Byzantine Generals Problem)',
    purpose: 'Xây dựng mô hình hóa toán học dựa trên bài toán ẩn dụ kinh điển của Lamport, Pease và Shostak (1982).',
    objectiveIds: ['OBJ-002'],
    keyPoints: [
      'Mô hình quân đội Byzantine: Tướng chỉ huy gửi lệnh Tấn công hoặc Rút lui qua giao liên.',
      'Kẻ phản bội có thể gửi thông điệp trái ngược cho các tướng cấp dưới khác nhau.',
      'Sự bất khả của việc đạt đồng thuận nếu chỉ dựa trên thông tin truyền trực tiếp không có cơ chế xác thực đa bên.'
    ],
    lectureText: 'Năm 1982, nhà khoa học máy tính đạt giải Turing Leslie Lamport đã đặt tên cho hiện tượng này bằng bài toán "Các vị tướng Byzantine". Một nhóm tướng quân Byzantine vây quanh một thành trì địch. Để chiến thắng, tất cả các tướng trung thực phải cùng đồng loạt Tấn công hoặc cùng Rút lui. Nếu một nửa tấn công còn một nửa rút lui, họ sẽ thất bại thảm hại. Thách thức cốt tử: có những viên tướng phản bội. Viên chỉ huy có thể ra lệnh cho Tướng A là Tấn công, nhưng lại ra lệnh cho Tướng B là Rút lui. Làm sao Tướng A và B có thể biết được mệnh lệnh thực sự?',
    pedagogicalMethod: 'Phương pháp mô hình hóa ẩn dụ sư phạm (Analogy-driven pedagogical explanation)',
    question: 'Tại sao việc các tướng tự gửi tin nhắn kiểm tra lẫn nhau lại chưa đủ để loại trừ kẻ phản bội?',
    waitSeconds: 12,
    expectedResponse: 'Bởi vì chính kẻ phản bội có thể nói dối về những gì hắn đã nhận được từ tướng chỉ huy.',
    example: 'Tình huống 3 máy bay tác chiến cần đồng bộ radar nhưng một máy bay bị can thiệp điện tử.',
    application: 'Bảo mật truyền tin trong hệ thống nhúng điều khiển phương tiện tự hành không người lái.',
    transition: 'Từ bài toán ẩn dụ này, Lamport đã chứng minh bằng toán học một định lý cực kỳ chặt chẽ về số lượng tối thiểu các nút cần thiết.',
    durationSeconds: 600, // 10 phút
    sources: [
      {
        sourceId: 'SRC-004',
        citation: 'Lamport, Shostak, Pease (1982), ACM TOPLAS, trang 382-385',
        sourceType: 'FOUNDATIONAL_CLASSICAL',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 382'
      }
    ],
    contentType: 'CORE_CONTENT',
    status: 'READY'
  },
  {
    id: 'TB-004',
    slideStart: 5,
    slideEnd: 5,
    topic: 'Định lý Lamport: Điều kiện Biên n >= 3f + 1',
    purpose: 'Chứng minh định lý nền tảng: Để chịu được f nút phản bội Byzantine, tổng số nút n phải tối thiểu đạt 3f + 1.',
    objectiveIds: ['OBJ-002'],
    keyPoints: [
      'Chứng minh phản chứng: Trường hợp n = 3 và f = 1 không thể giải quyết được.',
      'Bất đối xứng thông tin: Tướng trung thực không phân biệt được ai là kẻ nói dối.',
      'Công thức tổng quát n >= 3f + 1 đảm bảo số nút trung thực luôn chiếm hơn 2/3 tổng thể.'
    ],
    lectureText: 'Đây là trọng tâm lý thuyết cốt lõi của bài học hôm nay mà các em phải ghi nhớ sâu sắc. Định lý Lamport khẳng định: Trong một hệ thống truyền thông điệp không có chữ ký mã hóa hoàn hảo, không có thuật toán nào có thể đạt được đồng thuận nếu tổng số nút n không thỏa mãn điều kiện: n >= 3f + 1, trong đó f là số nút phản bội. Thầy chứng minh ngắn gọn: Giả sử có 3 tướng (n=3) và 1 kẻ phản bội (f=1). Khi Tướng A nhận lệnh "Tấn công" từ Chỉ huy, và nhận tin từ Tướng B nói rằng "Chỉ huy bảo tôi Rút lui". Tướng A không có cách nào biết được Tướng B phản bội hay chính vị Chỉ huy mới là kẻ phản bội! Hệ thống rơi vào bế tắc hoàn toàn.',
    pedagogicalMethod: 'Chứng minh định lý toán học kết hợp sơ đồ phản chứng',
    question: 'Nếu một hệ thống có 4 nút mạng, thì nó có thể chịu đựng tối đa bao nhiêu nút bị lỗi Byzantine?',
    waitSeconds: 10,
    expectedResponse: 'Tối đa 1 nút lỗi, vì nếu f=2 thì 3(2)+1 = 7 nút mới đủ an toàn.',
    example: 'Cụm cluster 4 node chạy thuật toán Raft/Paxos mở rộng.',
    application: 'Quy hoạch số lượng node kiểm toán trong các hệ thống Core Banking.',
    transition: 'Từ giới hạn lý thuyết này, ngành công nghệ phần mềm đã hiện thực hóa thành các giao thức thực dụng như thế nào? Chúng ta cùng bước sang thuật toán PBFT.',
    durationSeconds: 660, // 11 phút
    sources: [
      {
        sourceId: 'SRC-004',
        citation: 'Lamport et al. (1982), Định lý 1, trang 387',
        sourceType: 'FOUNDATIONAL_CLASSICAL',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 387'
      },
      {
        sourceId: 'SRC-002',
        citation: 'Giáo trình Hệ thống Phân tán, Chương 5.3, trang 151',
        sourceType: 'TEXTBOOK',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 151'
      }
    ],
    contentType: 'CORE_CONTENT',
    status: 'READY'
  },
  {
    id: 'TB-005',
    slideStart: 7,
    slideEnd: 7,
    topic: 'Ứng dụng Thực tiễn: Thuật toán PBFT trong Hệ thống Giao dịch',
    purpose: 'Chuyển hóa lý thuyết hàn lâm sang kiến trúc kỹ thuật của Practical Byzantine Fault Tolerance (Castro & Liskov 1999).',
    objectiveIds: ['OBJ-003'],
    keyPoints: [
      'Giao thức PBFT với 3 pha: Pre-prepare, Prepare, Commit.',
      'Sử dụng thông điệp biểu quyết 2/3 để đạt được thỏa thuận an toàn.',
      'Mối liên hệ với quy chuẩn quốc gia về khả năng chịu lỗi trong hạ tầng tài chính.'
    ],
    lectureText: 'Năm 1999, Miguel Castro và Barbara Liskov công bố bước đột phá mang tên PBFT – Practical Byzantine Fault Tolerance. PBFT chia tiến trình đồng thuận thành 3 pha rõ ràng: Pre-prepare, Prepare và Commit. Bằng cách yêu cầu mỗi nút phải thu thập đủ ít nhất 2f + 1 phiếu xác nhận ở mỗi pha trước khi chuyển trạng thái, PBFT cho phép hệ thống phân tán đạt được đồng thuận trong thời gian phần nghìn giây ngay cả khi có kẻ cố tình phá hoại mạng. Đây chính là nền tảng đang vận hành trong các giải pháp sổ cái phân tán doanh nghiệp hiện đại.',
    pedagogicalMethod: 'Phân tích kiến trúc hệ thống và quy trình trạng thái (State machine replication)',
    question: 'Tại sao PBFT phải cần đến cả hai pha Prepare và Commit thay vì chỉ cần một pha biểu quyết duy nhất?',
    waitSeconds: 15,
    expectedResponse: 'Pha Prepare đảm bảo các nút nhất trí về thứ tự thông điệp, còn pha Commit đảm bảo mọi nút cam kết thực thi cùng kết quả ngay cả khi view thay đổi.',
    example: 'Mạng lưới thanh toán liên ngân hàng và hệ thống Hyperledger Fabric.',
    application: 'Thi hành quy chuẩn quốc gia Thông tư 08 về an toàn thông tin cấp độ 4.',
    transition: 'Bây giờ chúng ta sẽ cùng tổng hợp toàn bộ các kết quả cốt lõi của bài học hôm nay.',
    durationSeconds: 540, // 9 phút
    sources: [
      {
        sourceId: 'SRC-005',
        citation: 'Tiêu chuẩn Kỹ thuật Quốc gia Cấp độ 4, Điều 12',
        sourceType: 'OFFICIAL_REGULATORY',
        confidence: 'HIGH',
        contentType: 'APPLICATION',
        pageOrSlide: 'Điều 12'
      }
    ],
    contentType: 'APPLICATION',
    status: 'READY'
  },
  {
    id: 'TB-006',
    slideStart: 8,
    slideEnd: 8,
    topic: 'Tổng kết & Định hướng Bài tập Nghiên cứu',
    purpose: 'Củng cố kiến thức, tổng kết 3 luận điểm vàng và giao bài tập phân tích kiến trúc.',
    objectiveIds: ['OBJ-001', 'OBJ-002', 'OBJ-003'],
    keyPoints: [
      'Khái quát hóa Safety vs Liveness.',
      'Ghi nhớ bất biến n >= 3f + 1 của Lamport.',
      'Ý nghĩa thực tiễn của đồng thuận Byzantine trong kỷ nguyên số.'
    ],
    lectureText: 'Tóm lại trong 45 phút vừa qua, chúng ta đã nắm vững 3 trụ cột: Một là sự khác biệt bản chất giữa lỗi Crash và lỗi Byzantine. Hai là định lý bất hủ của Leslie Lamport với điều kiện biên n >= 3f + 1 để chiến thắng bất đối xứng thông tin. Ba là kiến trúc 3 pha của thuật toán PBFT trong thực tiễn. Thầy yêu cầu các em về nhà làm bài tập thiết kế hệ thống cluster 7 máy chủ và tính toán cụ thể các kịch bản phân rã mạng. Cảm ơn các em đã chú ý lắng nghe.',
    pedagogicalMethod: 'Tổng kết sư phạm & Đánh giá năng lực tự học',
    question: 'Ai có thể nhắc lại trong 1 câu: Tại sao lỗi Byzantine lại nguy hiểm hơn gấp nhiều lần so với lỗi Crash?',
    waitSeconds: 8,
    expectedResponse: 'Vì lỗi Crash chỉ là im lặng, còn lỗi Byzantine là sự dối trá có tổ chức.',
    example: 'Tổng kết bài.',
    application: 'Định hướng đồ án môn học.',
    transition: 'Buổi học kết thúc tại đây.',
    durationSeconds: 240, // 4 phút (Tổng thời gian = 7+9+10+11+9+4 = 50 phút -> khớp ~45-50 phút)
    sources: [
      {
        sourceId: 'SRC-001',
        citation: 'Đề cương CS-401, Tổng kết, trang 6',
        sourceType: 'LECTURE_PLAN',
        confidence: 'HIGH',
        contentType: 'CORE_CONTENT',
        pageOrSlide: 'Trang 6'
      }
    ],
    contentType: 'CORE_CONTENT',
    status: 'READY'
  }
];

export function createSampleLecturePackage(): LecturePackage {
  // Total duration: 420 + 540 + 600 + 660 + 540 + 240 = 3000 seconds = 50 minutes.
  // Target duration: 45 minutes = 2700 seconds.
  // Discrepancy: 300 seconds (5 minutes) -> demonstrates TIMING_MISMATCH warning for QC inspection!

  const pkg: LecturePackage = {
    id: 'LPKG-CS401-007',
    version: 1,
    status: 'NEEDS_REVIEW',
    metadata: {
      courseCode: 'CS-401',
      courseTitle: 'Hệ thống Phân tán & Độ tin cậy Cao',
      lectureNumber: 7,
      lectureTitle: 'Nguyên lý Đồng thuận Phân tán & Bài toán Tướng lĩnh Byzantine',
      academicUnit: 'Khoa Công nghệ Thông tin - Bộ môn Khoa học Máy tính',
      targetDegree: 'Cử nhân / Kỹ sư Khoa học Máy tính',
      plannedDurationMinutes: 45,
      authorLecturer: 'Hội đồng Bộ môn KHMT (Chủ biên: GS. Trần Đình Trọng)',
      pedagogicalFocus: 'Lý luận mô hình hóa phản chứng, phân biệt rạch ròi Safety/Liveness và định lý biên Lamport n >= 3f + 1',
      createdAt: '2026-09-23T18:00:00.000Z',
      updatedAt: '2026-09-23T18:00:00.000Z'
    },
    objectives: SAMPLE_OBJECTIVES,
    requirements: [
      {
        id: 'REQ-001',
        type: 'PREREQUISITE',
        description: 'Sinh viên đã hoàn thành học phần Mạng máy tính và Cấu trúc dữ liệu & Giải thuật nâng cao.'
      },
      {
        id: 'REQ-002',
        type: 'PEDAGOGICAL_ORIENTATION',
        description: 'Giảng viên tuân thủ nghiêm ngặt chuẩn kiến thức giáo trình Level 2 và tài liệu gốc Level 4 Lamport (1982).'
      }
    ],
    sourceHierarchy: SAMPLE_DOCUMENTS.map(d => ({
      sourceId: d.sourceId,
      level: d.sourceLevel,
      title: d.title,
      role: `Cấp độ ${d.sourceLevel}: ${d.title}`,
      filename: d.filename
    })),
    lectureStructure: [
      {
        sectionId: 'SEC-01',
        sectionTitle: 'Phần 1: Mở đầu & Khái niệm Đồng thuận Phân tán',
        allocatedMinutes: 16,
        teachingBlockIds: ['TB-001', 'TB-002']
      },
      {
        sectionId: 'SEC-02',
        sectionTitle: 'Phần 2: Bài toán Tướng lĩnh Byzantine & Định lý Lamport',
        allocatedMinutes: 21,
        teachingBlockIds: ['TB-003', 'TB-004']
      },
      {
        sectionId: 'SEC-03',
        sectionTitle: 'Phần 3: Thuật toán Thực tiễn PBFT & Tổng kết',
        allocatedMinutes: 13,
        teachingBlockIds: ['TB-005', 'TB-006']
      }
    ],
    timingPlan: {
      totalPlannedSeconds: 3000,
      totalActualSeconds: 0,
      remainingSeconds: 3000,
      varianceSeconds: 300,
      blockTimings: {
        'TB-001': 420,
        'TB-002': 540,
        'TB-003': 600,
        'TB-004': 660,
        'TB-005': 540,
        'TB-006': 240
      },
      bufferSeconds: 0,
      isMismatch: true,
      mismatchDescription: 'Tổng thời lượng các TeachingBlock (50:00) vượt quá thời lượng kế hoạch bài giảng (45:00) là 05:00 phút. Giảng viên cần phê duyệt điều chỉnh hoặc rút ngắn các phần diễn giảng.'
    },
    slideMap: SAMPLE_SLIDE_MAP.map(s => ({
      ...s,
      mappedTeachingBlockIds: [...s.mappedTeachingBlockIds],
      previewBullets: s.previewBullets ? [...s.previewBullets] : [],
      issues: s.issues ? [...s.issues] : []
    })),
    teachingBlocks: SAMPLE_TEACHING_BLOCKS.map(b => ({
      ...b,
      objectiveIds: [...b.objectiveIds],
      keyPoints: [...b.keyPoints],
      sources: b.sources.map(src => ({ ...src }))
    })),
    interactionPlan: [
      {
        blockId: 'TB-001',
        checkpointPrompt: 'Nếu không có một máy chủ trung tâm duy nhất, làm thế nào hai nút độc lập biết chắc chắn mình đang có cùng một phiên bản dữ liệu?',
        waitSeconds: 12,
        fallbackPrompt: 'Gợi ý: Hãy nghĩ về nguyên lý biểu quyết đa số trong xã hội học.'
      },
      {
        blockId: 'TB-004',
        checkpointPrompt: 'Nếu một hệ thống có 4 nút mạng, thì nó có thể chịu đựng tối đa bao nhiêu nút bị lỗi Byzantine?',
        waitSeconds: 10,
        fallbackPrompt: 'Áp dụng trực tiếp bất đẳng thức n >= 3f + 1.'
      }
    ],
    transitionPlan: [
      {
        fromBlockId: 'TB-001',
        toBlockId: 'TB-002',
        transitionScript: 'Để hiểu được cách thức các máy chủ nhất trí, chúng ta cần nắm vững hai tiêu chuẩn vàng của tính đúng đắn: Safety và Liveness.'
      },
      {
        fromBlockId: 'TB-002',
        toBlockId: 'TB-003',
        transitionScript: 'Sau khi đã phân biệt lỗi Byzantine, câu hỏi hóc búa đặt ra là: Cần bao nhiêu nút để chống lại một kẻ phản bội cố tình nói dối? Chúng ta cùng bước vào công trình lịch sử của Leslie Lamport năm 1982.'
      },
      {
        fromBlockId: 'TB-003',
        toBlockId: 'TB-004',
        transitionScript: 'Từ bài toán ẩn dụ này, Lamport đã chứng minh bằng toán học một định lý cực kỳ chặt chẽ về số lượng tối thiểu các nút cần thiết.'
      },
      {
        fromBlockId: 'TB-004',
        toBlockId: 'TB-005',
        transitionScript: 'Từ giới hạn lý thuyết này, ngành công nghệ phần mềm đã hiện thực hóa thành các giao thức thực dụng như thế nào? Chúng ta cùng bước sang thuật toán PBFT.'
      },
      {
        fromBlockId: 'TB-005',
        toBlockId: 'TB-006',
        transitionScript: 'Bây giờ chúng ta sẽ cùng tổng hợp toàn bộ các kết quả cốt lõi của bài học hôm nay.'
      }
    ],
    citationMap: {
      'TB-001': [
        {
          id: 'CLM-001',
          claim: 'Hệ thống phân tán không có bộ nhớ dùng chung hay đồng hồ vật lý đồng bộ tuyệt đối.',
          sourceIds: ['SRC-001', 'SRC-002'],
          sourceType: 'TEXTBOOK',
          sourceLevel: 2,
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT',
          isUnsupported: false,
          pageOrSlide: 'Trang 142'
        }
      ],
      'TB-004': [
        {
          id: 'CLM-002',
          claim: 'Để chịu được f nút Byzantine, tổng số nút n phải thỏa mãn n >= 3f + 1.',
          sourceIds: ['SRC-004'],
          sourceType: 'FOUNDATIONAL_CLASSICAL',
          sourceLevel: 4,
          confidence: 'HIGH',
          contentType: 'CORE_CONTENT',
          isUnsupported: false,
          directQuote: 'Theorem 1: For any algorithm to guarantee consensus in the presence of m traitors, there must be at least 3m + 1 generals in total.',
          pageOrSlide: 'Trang 387'
        }
      ]
    },
    unresolvedIssues: [],
    qualityControl: {
      auditRunId: 'INITIAL_BOOT',
      timestamp: new Date().toISOString(),
      totalChecks: 16,
      passedCount: 14,
      criticalCount: 1, // Slide 6 is MISMATCHED (Quantum Key Distribution)
      warningCount: 1,  // Timing mismatch (50 min vs 45 min)
      infoCount: 1,
      resolvedCount: 0,
      disappearedCount: 0,
      canApprove: false, // Strict gate: cannot approve until Slide 6 critical mismatch is acknowledged/reviewed!
      issues: [],
      summaryNarrative: ''
    }
  };

  // Run rigorous QC audit to generate authentic issues list
  const qcReport = QualityControlEngine.audit(pkg);
  pkg.qualityControl = qcReport;
  pkg.unresolvedIssues = qcReport.issues;

  return pkg;
}
