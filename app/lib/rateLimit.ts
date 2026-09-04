import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Использует тот же Upstash Redis, что и app/lib/access.ts (та же пара
// переменных окружения). Без них (например, при локальной разработке без
// подключённого Upstash) лимитер отключается — ограничивать запросы к
// серверу на своей машине незачем, а на проде эти переменные уже есть.
function createRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

function makeLimiter(prefix: string, requests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    prefix: `ratelimit:${prefix}`,
  });
}

// Ориентиры: обычный пользователь дёргает /api/access один раз за открытие
// приложения и /api/lesson-content один раз на каждый открытый урок — лимиты
// щедрые, чтобы не мешать нормальному пролистыванию, но отсекают перебор
// OWNER_ACCESS_KEY и массовое выкачивание бесплатных уроков Модуля 0.
export const accessLimiter = makeLimiter("access", 20, 60);
export const lessonContentLimiter = makeLimiter("lesson-content", 40, 60);
export const tributeWebhookLimiter = makeLimiter("tribute-webhook", 60, 60);

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// true = запрос разрешён. Без Upstash (limiter === null) всегда разрешает —
// см. комментарий у createRedis выше.
export async function checkRateLimit(limiter: Ratelimit | null, ip: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(ip);
  return success;
}
