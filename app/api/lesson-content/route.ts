import { NextRequest, NextResponse } from "next/server";
import { resolveAccess } from "../../lib/resolveAccess";
import { getLessonContentById, isFreeLessonId } from "../../content/server/lessonContent";
import { checkRateLimit, getClientIp, lessonContentLimiter } from "../../lib/rateLimit";

export const runtime = "nodejs";

// Отдаёт полный текст ОДНОГО урока по id — только после проверки доступа на
// сервере. app/page.tsx (клиентский компонент) больше не импортирует полный
// текст уроков модулей 1-5 напрямую (это была реальная дыра: весь платный
// курс попадал в публичный JS-бандл и читался без подписки) — вместо этого
// запрашивает контент здесь, когда пользователь открывает конкретный урок.
export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(lessonContentLimiter, getClientIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { lessonId?: string; initData?: string; ownerKey?: string } | null;
  const lessonId = body?.lessonId;
  if (!lessonId) {
    return NextResponse.json({ error: "missing_lesson_id" }, { status: 400 });
  }

  const content = getLessonContentById(lessonId);
  if (!content) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (isFreeLessonId(lessonId)) {
    return NextResponse.json({ content });
  }

  const result = await resolveAccess({ initData: body?.initData, ownerKey: body?.ownerKey });
  if (result.error === "server_not_configured") {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (!result.active) {
    return NextResponse.json({ error: result.error === "consent_required" ? "consent_required" : "no_access" }, { status: 403 });
  }

  return NextResponse.json({ content });
}
