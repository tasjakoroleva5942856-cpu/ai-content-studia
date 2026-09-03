import { NextRequest, NextResponse } from "next/server";
import { hasActiveAccess } from "../../lib/access";
import { verifyTelegramInitData } from "../../lib/telegramAuth";

export const runtime = "nodejs";

// Мини-приложение вызывает этот роут при загрузке главного экрана, чтобы узнать,
// открыты ли модули 1-5 (см. app/page.tsx). initData подписан Telegram и
// проверяется здесь на сервере — так пользователь не может подделать
// свой telegram_user_id и открыть подписку бесплатно.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { initData?: string; ownerKey?: string } | null;

  // Проход для автора: секретный ключ передаётся один раз через ?key= в ссылке
  // (см. app/page.tsx), сохраняется в браузере и подтверждается здесь на сервере.
  // Работает без Telegram — так автор может открыть все модули по обычной ссылке.
  const ownerKey = process.env.OWNER_ACCESS_KEY;
  if (ownerKey && body?.ownerKey === ownerKey) {
    return NextResponse.json({ active: true });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }

  const initData = body?.initData;
  if (!initData) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }

  const user = verifyTelegramInitData(initData, botToken);
  if (!user) {
    return NextResponse.json({ error: "invalid_init_data" }, { status: 401 });
  }

  const active = await hasActiveAccess(user.id);
  return NextResponse.json({ active });
}
