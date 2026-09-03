import { createHmac, timingSafeEqual } from "crypto";

// Проверка initData Telegram Mini App по алгоритму из официальной документации:
// https://docs.telegram-mini-apps.com/platform/init-data
// 1) убираем hash/signature, сортируем оставшиеся пары по ключу и склеиваем через \n;
// 2) secret = HMAC_SHA256(key="WebAppData", message=токен_бота);
// 3) ожидаемый hash = HMAC_SHA256(key=secret, message=data-check-string), сравниваем с hash из initData.
// Это подтверждает, что telegram_user_id пришёл от Telegram, а не был подделан на клиенте.

const MAX_INIT_DATA_AGE_SECONDS = 60 * 60 * 24; // 24 часа — с запасом на не самую свежую сессию Mini App

export type TelegramInitDataUser = {
  id: number;
  firstName?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string): TelegramInitDataUser | null {
  if (!initData || !botToken) return null;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return null;
  }

  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  params.delete("signature");

  const pairs: string[] = [];
  params.forEach((value, key) => pairs.push(`${key}=${value}`));
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const computedBuffer = Buffer.from(computedHash, "hex");
  const providedBuffer = Buffer.from(hash, "hex");
  if (computedBuffer.length !== providedBuffer.length || !timingSafeEqual(computedBuffer, providedBuffer)) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SECONDS) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as { id?: number; first_name?: string };
    if (typeof user.id !== "number") return null;
    return { id: user.id, firstName: user.first_name };
  } catch {
    return null;
  }
}
