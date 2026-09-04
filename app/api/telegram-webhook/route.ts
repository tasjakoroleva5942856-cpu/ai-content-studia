import { NextRequest, NextResponse } from "next/server";
import { hasConsent, recordConsent } from "../../lib/consent";
import { answerCallbackQuery, editMessageText, sendMessage } from "../../lib/telegramBot";

export const runtime = "nodejs";

// Принимает обновления от Telegram (https://core.telegram.org/bots/api#update).
// Настройка (один раз, вручную): вызвать
//   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<домен>/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
// TELEGRAM_WEBHOOK_SECRET — та же строка, что и в переменной окружения на Vercel.
//
// Логика: первое /start показывает текст согласия на обработку персональных
// данных с кнопкой «Я согласен» — до нажатия доступ к материалам не
// открывается (см. app/lib/resolveAccess.ts, который проверяет hasConsent).
// Это отдельное согласие, не объединённое с офертой — требование,
// действующее с 1 сентября 2025 года.

const CONSENT_AGREE = "consent_agree";

function consentText(): string {
  const docsUrl = process.env.NEXT_PUBLIC_LEGAL_DOCS_URL || "";
  const docsLine = docsUrl ? ` Ознакомиться с документами можно <a href="${docsUrl}">здесь</a>.` : "";
  return (
    "Привет! Прежде чем открыть AI CONTENT STUDIA, нужно подтвердить согласие " +
    "на обработку персональных данных." +
    docsLine
  );
}

function agreeKeyboard() {
  return { inline_keyboard: [[{ text: "Я согласен", callback_data: CONSENT_AGREE }]] };
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "invalid_secret" }, { status: 401 });
  }

  const update = await request.json().catch(() => null) as {
    message?: { chat?: { id?: number }; from?: { id?: number }; text?: string };
    callback_query?: { id: string; data?: string; from?: { id?: number }; message?: { chat?: { id?: number }; message_id?: number } };
  } | null;
  if (!update) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (update.message?.text === "/start") {
    const chatId = update.message.chat?.id;
    const userId = update.message.from?.id;
    if (chatId && userId) {
      if (await hasConsent(userId)) {
        await sendMessage(chatId, "С возвращением! Откройте студию через кнопку меню ниже.");
      } else {
        await sendMessage(chatId, consentText(), agreeKeyboard());
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (update.callback_query?.data === CONSENT_AGREE) {
    const query = update.callback_query;
    const userId = query.from?.id;
    const chatId = query.message?.chat?.id;
    const messageId = query.message?.message_id;
    if (userId) {
      await recordConsent(userId);
    }
    await answerCallbackQuery(query.id, "Спасибо!");
    if (chatId && messageId) {
      await editMessageText(chatId, messageId, "Спасибо, согласие получено ✅\nТеперь откройте студию через кнопку меню ниже.");
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
