// Тонкая обёртка над Telegram Bot API (https://core.telegram.org/bots/api) —
// используется только из app/api/telegram-webhook/route.ts, чтобы ответить
// на /start и на нажатие кнопки «Я согласен».

const API_BASE = "https://api.telegram.org";

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return `${API_BASE}/bot${token}/${method}`;
}

export async function sendMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<void> {
  await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
      reply_markup: replyMarkup,
    }),
  });
}

export async function editMessageText(chatId: number, messageId: number, text: string): Promise<void> {
  await fetch(apiUrl("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await fetch(apiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}
