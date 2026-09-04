import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKeyLive } from '@/lib/ai/gateway';
import { GoogleAiProvider } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey } = body as { provider?: GoogleAiProvider; apiKey?: string };

    if (!provider || !apiKey) {
      return NextResponse.json(
        { ok: false, message: 'Vui lòng cung cấp đầy đủ provider và API Key.' },
        { status: 400 }
      );
    }

    const result = await verifyApiKeyLive(provider, apiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi kiểm tra API Key';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
