// Хранилище доступа к подписке: telegram_user_id -> дата, до которой открыт доступ.
//
// ВАЖНО (см. также student-path-plan.md / studio-baseline.md в проекте):
// сейчас это временная in-memory реализация. Она подходит только для локальной
// разработки. На Vercel serverless-функции не гарантируют общий процесс между
// вызовами — запись, сделанную в одном вызове, следующий вызов может не увидеть.
// Перед реальным запуском оплаты это нужно заменить на постоянное хранилище
// (проще всего — Vercel KV: один env-переменная, минимум кода). Меняется только
// этот файл — API-роуты (app/api/access, app/api/tribute-webhook) от места
// хранения не зависят.

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

const store: AccessStore = new MemoryAccessStore();

export async function grantAccess(userId: number, days: number): Promise<number> {
  const existing = await store.get(userId);
  const base = existing && existing.activeUntil > Date.now() ? existing.activeUntil : Date.now();
  const activeUntil = base + days * 24 * 60 * 60 * 1000;
  await store.set(userId, { activeUntil });
  return activeUntil;
}

export async function hasActiveAccess(userId: number): Promise<boolean> {
  const record = await store.get(userId);
  return !!record && record.activeUntil > Date.now();
}
