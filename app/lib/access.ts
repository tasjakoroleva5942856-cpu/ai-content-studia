// Хранилище доступа к подписке: telegram_user_id -> дата, до которой открыт доступ.
//
// Постоянное хранилище — Upstash Redis (подключается в Vercel через
// Storage -> Marketplace Database Providers -> Upstash, план Free подходит).
// После подключения Vercel сам добавляет переменные окружения
// KV_REST_API_URL / KV_REST_API_TOKEN (или UPSTASH_REDIS_REST_URL / TOKEN —
// оба названия ниже поддержаны). Без этих переменных (например, при
// локальной разработке) автоматически используется временное хранилище
// в памяти — подписки в нём не переживают перезапуск процесса, но всё
// остальное работает как обычно.

import { Redis } from "@upstash/redis";

export type AccessRecord = { activeUntil: number };

interface AccessStore {
  get(userId: number): Promise<AccessRecord | null>;
  set(userId: number, record: AccessRecord): Promise<void>;
}

class MemoryAccessStore implements AccessStore {
  private data = new Map<number, AccessRecord>();

  async get(userId: number) {
    return this.data.get(userId) ?? null;
  }

  async set(userId: number, record: AccessRecord) {
    this.data.set(userId, record);
  }
}

class RedisAccessStore implements AccessStore {
  constructor(private redis: Redis) {}

  private key(userId: number) {
    return `access:${userId}`;
  }

  async get(userId: number) {
    const record = await this.redis.get<AccessRecord>(this.key(userId));
    return record ?? null;
  }

  async set(userId: number, record: AccessRecord) {
    await this.redis.set(this.key(userId), record);
  }
}

function createStore(): AccessStore {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new RedisAccessStore(new Redis({ url, token }));
  }
  return new MemoryAccessStore();
}

const store: AccessStore = createStore();

// Оставлено на случай, если понадобится выдавать доступ вручную на N дней
// (например, для промо). Основной путь — grantAccessUntil ниже, Tribute сам
// присылает точную дату окончания подписки.
export async function grantAccess(userId: number, days: number): Promise<number> {
  const existing = await store.get(userId);
  const base = existing && existing.activeUntil > Date.now() ? existing.activeUntil : Date.now();
  const activeUntil = base + days * 24 * 60 * 60 * 1000;
  await store.set(userId, { activeUntil });
  return activeUntil;
}

// Tribute присылает точную дату окончания подписки (payload.expires_at) —
// записываем её как есть, без дополнительных расчётов дней.
export async function grantAccessUntil(userId: number, activeUntil: number): Promise<void> {
  await store.set(userId, { activeUntil });
}

export async function hasActiveAccess(userId: number): Promise<boolean> {
  const record = await store.get(userId);
  return !!record && record.activeUntil > Date.now();
}
