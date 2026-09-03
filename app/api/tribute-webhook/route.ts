import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { grantAccess } from "../../lib/access";

export const runtime = "nodejs";

// Приём вебхуков от Tribute (https://wiki.tribute.tg/for-content-creators/api-documentation/webhooks).
// Настройка на стороне Tribute: в @tribute -> настройки -> API — указать
// URL этого роута (https://<домен>/api/tribute-webhook) и создать API-ключ,
// тот же ключ положить в переменную окружения TRIBUTE_API_KEY на Vercel.
//
// Схема тарифов сейчас — два отдельных "цифровых товара" в Tribute (не
// авто-продлеваемая подписка): "1 месяц" за 3900₽ и "3 месяца" за 9900₽.
// ID этих товаров (видны в дашборде Tribute после создания) нужно положить
// в TRIBUTE_PRODUCT_1M_ID и TRIBUTE_PRODUCT_3M_ID.
function accessDaysByProductId(): Record<string, number> {
  const map: Record<string, number> = {};
  if (process.env.TRIBUTE_PRODUCT_1M_ID) map[process.env.TRIBUTE_PRODUCT_1M_ID] = 30;
  if (process.env.TRIBUTE_PRODUCT_3M_ID) map[process.env.TRIBUTE_PRODUCT_3M_ID] = 90;
  return map;
}

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
    product_id?: number | string;
    telegram_user_id?: number | string;
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
  const productId = String(payload.product_id ?? "");
  const days = accessDaysByProductId()[productId];

  if (event.name === "new_digital_product" && telegramUserId && days) {
    await grantAccess(telegramUserId, days);
  }

  // Отвечаем 200 и на события, которые пока не обрабатываем (например,
  // возвраты), чтобы Tribute не пытался повторно доставить вебхук.
  return NextResponse.json({ ok: true });
}
