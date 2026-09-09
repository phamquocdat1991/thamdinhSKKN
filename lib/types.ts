export type GoogleAiProvider = 'gemini-developer' | 'agent-platform-express';

export interface ModelOption {
  id: string;
  name: string;
  badge?: string;
  desc: string;
  isPaid?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Mặc định (Chuẩn 2026)',
    desc: 'Mặc định chất lượng cao nhất, tối ưu viết & thẩm định SKKN, suy luận sư phạm đa bước'
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Khuyên dùng',
    desc: 'Mặc định, mới nhất, mạnh mẽ và chi phí tốt'
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    desc: 'Chất lượng cao, dự phòng chính'
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    desc: 'Nhanh, chi phí thấp, đọc/trích xuất tài liệu tốt'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Ổn định, dự phòng cuối chuỗi'
  },
  {
    id: 'gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    badge: 'Trả phí',
    desc: 'Chất lượng cao nhất, suy luận sâu',
    isPaid: true
  }
];

export interface SkknFormData {
  title: string;
  gradeLevel: string;
  subject: string;
  targetAward: string;
  content: string;
  fileName?: string;
}

export interface SpellingError {
  original: string;
  suggestion: string;
  context: string;
  reason: string;
}

export interface CriterionAssessment {
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface SkknAnalysisResult {
  isDemo?: boolean;
  id: string;
  createdAt: string;
  title: string;
  gradeLevel: string;
  subject: string;
  targetAward: string;
  totalScore: number; // Thang 100
  awardPrediction: {
    level: string;
    likelihood: 'Rất cao' | 'Khả quan' | 'Cần hoàn thiện thêm' | 'Chưa đạt yêu cầu';
    summary: string;
  };
  plagiarismReport: {
    percentage: number;
    riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
    details: string;
    suspectedPassages: Array<{
      text: string;
      similarity: number;
      comment: string;
    }>;
  };
  spellingErrors: SpellingError[];
  criteria: {
    novelty: CriterionAssessment; // Tính mới & sáng tạo
    scientific: CriterionAssessment; // Tính khoa học & sư phạm
    effectiveness: CriterionAssessment; // Tính hiệu quả & thực nghiệm
    applicability: CriterionAssessment; // Khả năng nhân rộng
  };
  strategicAdvice: {
    titleReview: string;
    structuralRecommendations: string[];
    pedagogicalUpgrades: string[];
    actionPlan: string[];
  };
}

export interface TitleAnalysisResult {
  title: string;
  overallScore: number; // 0-10
  verdict: 'Rất tốt' | 'Khá' | 'Cần điều chỉnh' | 'Chưa đạt chuẩn';
  structure: {
    hasAction: boolean; // Có biện pháp / giải pháp rõ ràng
    hasTarget: boolean; // Có đối tượng học sinh
    hasScope: boolean; // Có phạm vi lớp / môn
    hasObjective: boolean; // Có mục tiêu kết quả
  };
  critique: string;
  suggestedTitles: string[];
}

