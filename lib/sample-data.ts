import { SkknFormData, SkknAnalysisResult } from './types';

export const SAMPLE_SKKN_DATA: SkknFormData = {
  title: 'Một số biện pháp nâng cao chất lượng dạy học môn Toán cho học sinh lớp 5 thông qua trò chơi học tập và ứng dụng sơ đồ tư duy',
  gradeLevel: 'Tiểu học',
  subject: 'Toán học',
  targetAward: 'Cấp Huyện/Thị xã/Quận',
  content: `I. ĐẶT VẤN ĐỀ
1. Lý do chọn đề tài:
Toán học là môn học công cụ, đóng vai trò nền tảng trong việc phát triển tư duy logic, năng lực giải quyết vấn đề cho học sinh tiểu học, đặc biệt là học sinh lớp 5 - giai đoạn chuyển giao cấp học quan trọng. Tuy nhiên, qua thực tế giảng dạy nhiều năm tại trường Tiểu học, tôi nhận thấy nhiều em học sinh còn tâm lý sợ học Toán, tiếp thu kiến thức một cách thụ động, máy móc, dễ nhầm lẫn giữa các dạng toán chuyển động đều, toán hình học tính diện tích, thể tích.

2. Mục đích nghiên cứu:
Tìm ra các biện pháp sư phạm sáng tạo, kết hợp trò chơi học tập sinh động và sơ đồ tư duy (Mindmap) nhằm khơi dậy niềm đam mê học Toán, giúp học sinh nắm vững bản chất kiến thức, rèn luyện kỹ năng tính toán và nâng cao chất lượng học tập bộ môn.

II. GIẢI PHÁP THỰC HIỆN
Biện pháp 1: Thiết kế và vận dụng hệ thống trò chơi học tập có tính phân hóa trong các tiết khởi động và luyện tập.
- Trò chơi "Vòng quay may mắn - Tiếp sức giải toán": Áp dụng trong ôn tập bảng cửu chương, cộng trừ phân số.
- Trò chơi "Ai là nhà thông thái tí hon": Ứng dụng giải toán chuyển động đều với hệ thống câu hỏi trắc nghiệm phản xạ nhanh.

Biện pháp 2: Hướng dẫn học sinh hệ thống hóa kiến thức các dạng toán hình học bằng Sơ đồ tư duy (Mindmap).
- Dạy học sinh nhận diện từ khóa (Keyword), quy tắc, công thức tính chu vi, diện tích hình tam giác, hình thang, hình tròn thông qua hình ảnh màu sắc trực quan.
- Khuyến khích học sinh tự vẽ sơ đồ tư duy tổng kết chương theo nhóm đôi hoặc nhóm 4.

Biện pháp 3: Tích hợp công nghệ thông tin và học liệu trực quan vào từng bài học.
- Sử dụng mô hình hình học 3D trực quan trên phần mềm GeoGebra để minh họa bài "Hình hộp chữ nhật, hình lập phương".
- Tổ chức kiểm tra nhanh cuối giờ bằng phiếu trắc nghiệm tương tác Quizizz.

III. HIỆU QUẢ VÀ KẾT QUẢ THỰC NGHIỆM
Sau 6 tháng áp dụng tại lớp 5A1 (42 học sinh), kết quả khảo sát đối chứng trước và sau tác động cho thấy sự chuyển biến rõ rệt:
- Mức độ hứng thú: Tăng từ 45.2% lên 92.8%.
- Tỷ lệ học sinh Hoàn thành tốt môn Toán: Tăng từ 33.3% (đầu năm) lên 64.3% (cuối kỳ 1).
- Tỷ lệ học sinh Chưa hoàn thành: Giảm từ 9.5% xuống còn 0%.

IV. BÀI HỌC KINH NGHIỆM VÀ ĐỀ XUẤT
Giáo viên cần không ngừng đổi mới phương pháp giảng dạy, linh hoạt kết hợp các kỹ thuật dạy học tích cực, tạo môi trường học tập vui tươi, kích thích sự tự tin và sáng tạo của mỗi học sinh.`
};

export const MOCK_ANALYSIS_RESULT: SkknAnalysisResult = {
  id: 'skkn-' + Date.now(),
  createdAt: new Date().toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }),
  title: SAMPLE_SKKN_DATA.title,
  gradeLevel: SAMPLE_SKKN_DATA.gradeLevel,
  subject: SAMPLE_SKKN_DATA.subject,
  targetAward: SAMPLE_SKKN_DATA.targetAward,
  totalScore: 88.5,
  awardPrediction: {
    level: 'Cấp Huyện/Thị xã/Quận',
    likelihood: 'Khả quan',
    summary: 'Đề tài có tính thực tiễn cao, cấu trúc cân đối và số liệu thực nghiệm rõ ràng. Khả năng đạt giải Khá hoặc Nhì cấp Huyện/Thị là rất cao nếu bổ sung thêm minh chứng hình ảnh hoạt động của học sinh.'
  },
  plagiarismReport: {
    percentage: 6.8,
    riskLevel: 'Thấp',
    details: 'Mức độ tương đồng 6.8% chủ yếu nằm ở phần trích dẫn văn bản quy chuẩn giáo dục và định nghĩa lý luận chung. Không phát hiện hành vi sao chép nguyên văn giải pháp.',
    suspectedPassages: [
      {
        text: 'Toán học là môn học công cụ, đóng vai trò nền tảng trong việc phát triển tư duy logic...',
        similarity: 24,
        comment: 'Cụm từ mang tính lý luận chung phổ biến trong các đề tài giáo dục tiểu học.'
      }
    ]
  },
  spellingErrors: [
    {
      original: 'vui tươi, kích thích',
      suggestion: 'vui tươi, nhằm kích thích',
      context: 'tạo môi trường học tập vui tươi, kích thích sự tự tin',
      reason: 'Bổ sung liên từ chỉ mục đích giúp câu văn gãy gọn, chuẩn văn phong báo cáo sư phạm.'
    }
  ],
  criteria: {
    novelty: {
      name: 'Tính mới và Sáng tạo',
      score: 26,
      maxScore: 30,
      strengths: [
        'Kết hợp khéo léo giữa phương pháp trò chơi học tập truyền thống với sơ đồ tư duy hiện đại.',
        'Có tích hợp công nghệ (phần mềm GeoGebra và Quizizz) phù hợp với xu thế chuyển đổi số giáo dục.'
      ],
      weaknesses: [
        'Quy trình thiết kế trò chơi chưa được lượng hóa rõ ràng theo các bước sư phạm khép kín.'
      ],
      recommendations: [
        'Nên bổ sung ma trận lựa chọn trò chơi phù hợp với từng dạng toán cụ thể để tăng tính đột phá.'
      ]
    },
    scientific: {
      name: 'Tính Khoa học và Sư phạm',
      score: 28,
      maxScore: 30,
      strengths: [
        'Cấu trúc logic chặt chẽ, từ đặt vấn đề đến giải pháp và thực nghiệm.',
        'Ngôn ngữ sư phạm chuẩn mực, lập luận rõ ràng, bám sát mục tiêu chương trình GDPT 2018.'
      ],
      weaknesses: [
        'Cần trích dẫn bổ sung căn cứ văn bản chỉ đạo chuyên môn của Phòng/Sở GD&ĐT năm học hiện tại.'
      ],
      recommendations: [
        'Bổ sung phần Cơ sở pháp lý và Cơ sở thực tiễn tại đơn vị công tác ở đầu phần Đặt vấn đề.'
      ]
    },
    effectiveness: {
      name: 'Tính Hiệu quả và Minh chứng Thực nghiệm',
      score: 22,
      maxScore: 25,
      strengths: [
        'Có bảng số liệu đối chứng trước và sau tác động rõ ràng trên lớp thực nghiệm.',
        'Chỉ số hứng thú và tỷ lệ Hoàn thành tốt tăng trưởng thuyết phục.'
      ],
      weaknesses: [
        'Chưa có nhóm lớp đối chứng (lớp không áp dụng giải pháp) để khẳng định tính khách quan khoa học.'
      ],
      recommendations: [
        'Nên bổ sung thêm kết quả so sánh với lớp đối chứng 5A2 để hội đồng thẩm định đánh giá cao hơn.'
      ]
    },
    applicability: {
      name: 'Khả năng Ứng dụng và Nhân rộng',
      score: 12.5,
      maxScore: 15,
      strengths: [
        'Các trò chơi và sơ đồ tư duy dễ áp dụng, chi phí thấp, giáo viên các trường khác đều có thể nhân rộng.',
        'Học sinh có thể tự thực hành tại nhà dưới sự hướng dẫn của phụ huynh.'
      ],
      weaknesses: [
        'Yêu cầu phòng học có trang thiết bị máy chiếu/tivi tương tác đối với một số hoạt động công nghệ.'
      ],
      recommendations: [
        'Đưa ra phương án thay thế dành cho các điểm trường vùng khó khăn chưa có máy chiếu.'
      ]
    }
  },
  strategicAdvice: {
    titleReview: 'Tên đề tài chuẩn cấu trúc: có biện pháp (trò chơi + sơ đồ tư duy), có mục tiêu (nâng cao chất lượng dạy học), có đối tượng (học sinh lớp 5) và môn học (Toán).',
    structuralRecommendations: [
      'Bổ sung thêm 2-3 phụ lục: Ảnh chụp các phiếu học tập / Sơ đồ tư duy do học sinh tự vẽ.',
      'Thêm biểu đồ cột trực quan minh họa sự tăng trưởng điểm số thay vì chỉ dùng bảng số liệu thô.'
    ],
    pedagogicalUpgrades: [
      'Lồng ghép yếu tố giáo dục STEM: Cho học sinh tự gấp hình khối hộp chữ nhật từ bìa tái chế.',
      'Áp dụng phương pháp đánh giá thường xuyên theo Thông tư 27/2020/TT-BGDĐT.'
    ],
    actionPlan: [
      'Bước 1: Chụp ảnh minh chứng học sinh đang tham gia hoạt động trò chơi trong tiết học.',
      'Bước 2: Vẽ biểu đồ đối chứng tỷ lệ học sinh đạt chuẩn trước và sau thực nghiệm.',
      'Bước 3: Xin xác nhận áp dụng hiệu quả của Ban Giám hiệu nhà trường trước khi nộp Cấp Huyện.'
    ]
  }
};
