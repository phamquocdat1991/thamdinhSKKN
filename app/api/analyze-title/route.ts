import { NextRequest, NextResponse } from 'next/server';
import { analyzeSkknTitle } from '@/lib/ai/gateway';
import { GoogleAiProvider } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, provider = 'gemini-developer', apiKey, modelId } = body as {
      title: string;
      provider?: GoogleAiProvider;
      apiKey?: string;
      modelId?: string;
    };

    if (!title || !title.trim()) {
      return NextResponse.json(
        { ok: false, message: 'Vui lòng nhập tên đề tài cần phân tích.' },
        { status: 400 }
      );
    }

    const result = await analyzeSkknTitle(title, provider, apiKey, modelId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi phân tích tên đề tài';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
