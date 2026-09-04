// Согласие на обработку персональных данных: telegram_user_id -> момент
// подтверждения. Получают его через кнопку «Я согласен» под сообщением
// бота (см. app/api/telegram-webhook/route.ts) — отдельно от оферты, как
// того требует 152-ФЗ с 1 сентября 2025 года. Тот же принцип хранения, что
// и в app/lib/access.ts (Upstash Redis на проде, память — при локальной
// разработке без подключённого Upstash).

import { Redis } from "@upstash/redis";

interface ConsentStore {
  get(userId: number): Promise<string | null>;
  set(userId: number, confirmedAt: string): Promise<void>;
}

class MemoryConsentStore implements ConsentStore {
  private data = new Map<number, string>();

  async get(userId: number) {
    return this.data.get(userId) ?? null;
  }

  async set(userId: number, confirmedAt: string) {
    this.data.set(userId, confirmedAt);
  }
}

class RedisConsentStore implements ConsentStore {
  constructor(private redis: Redis) {}

  private key(userId: number) {
    return `consent:${userId}`;
  }

  async get(userId: number) {
    const value = await this.redis.get<string>(this.key(userId));
    return value ?? null;
  }

  async set(userId: number, confirmedAt: string) {
    await this.redis.set(this.key(userId), confirmedAt);
  }
}

function createStore(): ConsentStore {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new RedisConsentStore(new Redis({ url, token }));
  }
  return new MemoryConsentStore();
}

const store: ConsentStore = createStore();

export async function hasConsent(userId: number): Promise<boolean> {
  return (await store.get(userId)) !== null;
}

export async function recordConsent(userId: number): Promise<void> {
  await store.set(userId, new Date().toISOString());
}
