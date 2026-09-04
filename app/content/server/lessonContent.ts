// ВАЖНО: этот файл — единственное место, откуда можно импортировать полный
// текст уроков. Импортировать его разрешено только из серверного кода
// (app/api/**/route.ts) — НИКОГДА из компонента с "use client" (например,
// app/page.tsx), иначе весь платный текст снова окажется в клиентском
// JS-бандле и будет доступен без подписки любому посетителю сайта (это была
// реальная дыра — см. историю правок).
import { module0Content } from "../module-0";
import { module1Content } from "../module-1";
import { module2Content } from "../module-2";
import { module3Content } from "../module-3";
import { module4Content } from "../module-4";
import { module5Content } from "../module-5";
import { resourceContent } from "../resources";

const FREE_LESSON_IDS = new Set(module0Content.map((item) => item.id));

const contentById = new Map<string, string>();
for (const item of [
  ...module0Content,
  ...module1Content,
  ...module2Content,
  ...module3Content,
  ...module4Content,
  ...module5Content,
  ...resourceContent,
]) {
  contentById.set(item.id, item.content);
}

export function isFreeLessonId(lessonId: string): boolean {
  return FREE_LESSON_IDS.has(lessonId);
}

export function getLessonContentById(lessonId: string): string | undefined {
  return contentById.get(lessonId);
}
