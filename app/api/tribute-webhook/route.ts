import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { grantAccessUntil } from "../../lib/access";

export const runtime = "nodejs";

// Приём вебхуков от Tribute (https://wiki.tribute.tg/for-content-creators/api-documentation/webhooks).
// Настройка на стороне Tribute: в @tribute -> настройки -> API — указать
// URL этого роута (https://<домен>/api/tribute-webhook) и создать API-ключ,
// тот же ключ положить в переменную окружения TRIBUTE_API_KEY на Vercel.
//
// Тариф в Tribute — одна подписка ("AI Content Studio — доступ") с двумя
// периодами (1 месяц / 3 месяца), а не отдельные цифровые товары — поэтому
// не нужно различать периоды по product_id: Tribute сам присылает точную
// дату окончания в payload.expires_at, её и записываем как есть.
function isValidSignature(rawBody: string, signature: string | null, apiKey: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", apiKey).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

type TributeWebhookEvent = {
  name: string;
  payload?: {
    telegram_user_id?: number | string;
    expires_at?: string;
    [key: string]: unknown;
  };
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.TRIBUTE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("trbt-signature");
  if (!isValidSignature(rawBody, signature, apiKey)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: TributeWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = event.payload ?? {};
  const telegramUserId = Number(payload.telegram_user_id);
  const expiresAt = payload.expires_at ? Date.parse(payload.expires_at) : NaN;

  if ((event.name === "newSubscription" || event.name === "renewedSubscription") && telegramUserId && !Number.isNaN(expiresAt)) {
    await grantAccessUntil(telegramUserId, expiresAt);
  }

  // Отвечаем 200 и на события, которые пока не обрабатываем (например,
  // cancelledSubscription — доступ там и так остаётся открытым до конца уже
  // оплаченного периода, отдельно ничего отзывать не нужно), чтобы Tribute
  // не пытался повторно доставить вебхук.
  return NextResponse.json({ ok: true });
}
