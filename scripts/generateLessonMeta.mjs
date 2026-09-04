// Одноразовый (перезапускаемый) генератор app/content/lessonMeta.ts — файла,
// который безопасно импортировать в клиентский код: он содержит только
// заголовки/сводки/ссылки уроков, БЕЗ полного текста. Полный текст остаётся
// только в app/content/module-*.ts и app/content/resources.ts, которые
// импортирует исключительно app/content/server/lessonContent.ts —
// серверный файл, никогда не попадающий в клиентский бандл.
//
// Запуск: node scripts/generateLessonMeta.mjs
// Использует уже установленный пакет typescript (devDependency) для
// транспиляции module-*.ts в CommonJS на лету — без ts-node и без новых
// зависимостей.
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function loadTsModuleAsCjs(relPath) {
  const absPath = path.join(__dirname, "..", relPath);
  const source = readFileSync(absPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  const fn = new Function("exports", "require", "module", "__filename", "__dirname", outputText);
  fn(mod.exports, require, mod, absPath, path.dirname(absPath));
  return mod.exports;
}

function lessonSummary(content) {
  const rawParagraphs = content.split("\n").map((item) => item.trim());
  const candidate = rawParagraphs.find((item) => {
    if (/^\*\*(Результат|Главное|Важно|Можно|Альтернатива|Самый простой|Никогда)/i.test(item)) return false;
    const stripped = item.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*`]/g, "");
    return stripped.length > 35;
  });

  const line = (candidate ?? rawParagraphs.find((item) => item.length > 35) ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`]/g, "");

  const sentences = line.match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()) || [];
  if (sentences.length) {
    const firstTwo = sentences.slice(0, 2).join(" ");
    return firstTwo.length <= 210 ? firstTwo : sentences[0];
  }
  if (line.length <= 210) return line;

  const shortened = line.slice(0, 210);
  return `${shortened.slice(0, shortened.lastIndexOf(" ")).trim()}…`;
}

const moduleArrays = [0, 1, 2, 3, 4, 5].map((n) => {
  const mod = loadTsModuleAsCjs(`app/content/module-${n}.ts`);
  return Object.values(mod).find(Array.isArray);
});
const resourceArray = Object.values(loadTsModuleAsCjs("app/content/resources.ts")).find(Array.isArray);

const toMeta = (items) => items.map((item) => ({
  id: item.id,
  title: item.title,
  note: lessonSummary(item.content),
  sourceUrl: item.sourceUrl,
}));

const lessonsByModule = moduleArrays.map(toMeta);
const resources = toMeta(resourceArray);

const fileBody = `// СГЕНЕРИРОВАНО: node scripts/generateLessonMeta.mjs — не редактировать руками.
// Содержит только заголовки/сводки/ссылки уроков (без полного текста), поэтому
// безопасен для импорта в клиентские компоненты (см. app/page.tsx). Полный
// текст урока запрашивается на сервере через /api/lesson-content, после
// проверки доступа — см. app/content/server/lessonContent.ts.
export type LessonMeta = { id: string; title: string; note: string; sourceUrl?: string };

export const lessonMetaByModule: LessonMeta[][] = ${JSON.stringify(lessonsByModule, null, 2)};
export const resourceMeta: LessonMeta[] = ${JSON.stringify(resources, null, 2)};
`;

writeFileSync(path.join(__dirname, "..", "app/content/lessonMeta.ts"), fileBody);
console.log("Wrote app/content/lessonMeta.ts —", lessonsByModule.flat().length, "lessons +", resources.length, "resources");
