import { timingSafeEqual } from "crypto";
import { hasActiveAccess } from "./access";
import { hasConsent } from "./consent";
import { verifyTelegramInitData } from "./telegramAuth";

export type AccessRequest = { initData?: string; ownerKey?: string };
export type AccessResult = {
  active: boolean;
  error?: "server_not_configured" | "missing_init_data" | "invalid_init_data" | "consent_required";
};

function safeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Длины сравниваем обычным способом (это не секрет), сам секрет — только
  // через timingSafeEqual, и только когда буферы одной длины (иначе сама
  // функция бросает исключение).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Общая проверка доступа, используется и /api/access (просто спрашивает
// статус для UI), и /api/lesson-content (отдаёт текст урока только если
// доступ подтверждён здесь). Один источник правды — см. app/api/access и
// app/api/lesson-content.
export async function resolveAccess({ initData, ownerKey }: AccessRequest): Promise<AccessResult> {
  const validOwnerKey = process.env.OWNER_ACCESS_KEY;
  if (validOwnerKey && ownerKey && safeStringEqual(ownerKey, validOwnerKey)) {
    return { active: true };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { active: false, error: "server_not_configured" };
  }

  if (!initData) {
    return { active: false, error: "missing_init_data" };
  }

  const user = verifyTelegramInitData(initData, botToken);
  if (!user) {
    return { active: false, error: "invalid_init_data" };
  }

  // Без подтверждённого в боте согласия на обработку персональных данных
  // доступ не открываем, даже если подписка уже оплачена — согласие должно
  // предшествовать обработке telegram_user_id (см. app/api/telegram-webhook).
  if (!(await hasConsent(user.id))) {
    return { active: false, error: "consent_required" };
  }

  return { active: await hasActiveAccess(user.id) };
}
