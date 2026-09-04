import { NextRequest, NextResponse } from "next/server";
import { resolveAccess } from "../../lib/resolveAccess";
import { accessLimiter, checkRateLimit, getClientIp } from "../../lib/rateLimit";

export const runtime = "nodejs";

// Мини-приложение вызывает этот роут при загрузке главного экрана, чтобы узнать,
// открыты ли модули 1-5 (см. app/page.tsx). initData подписан Telegram и
// проверяется здесь на сервере — так пользователь не может подделать
// свой telegram_user_id и открыть подписку бесплатно.
export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(accessLimiter, getClientIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { initData?: string; ownerKey?: string } | null;
  const result = await resolveAccess({ initData: body?.initData, ownerKey: body?.ownerKey });
  if (result.error === "server_not_configured") {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ active: result.active, reason: result.error });
}
