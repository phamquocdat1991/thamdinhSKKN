import { NextRequest, NextResponse } from 'next/server';
import { analyzeFullSkkn } from '@/lib/ai/gateway';
import { GoogleAiProvider, SkknFormData } from '@/lib/types';

export const maxDuration = 60; // Tối đa thời gian cho tác vụ phân tích AI

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, provider = 'gemini-developer', apiKey, modelId } = body as {
      formData: SkknFormData;
      provider?: GoogleAiProvider;
      apiKey?: string;
      modelId?: string;
    };

    if (!formData || !formData.title || !formData.content) {
      return NextResponse.json(
        { ok: false, message: 'Vui lòng cung cấp đầy đủ tên đề tài và nội dung SKKN.' },
        { status: 400 }
      );
    }

    const result = await analyzeFullSkkn(formData, provider, apiKey, modelId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi thẩm định SKKN';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
