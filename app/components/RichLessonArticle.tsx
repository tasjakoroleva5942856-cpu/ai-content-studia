"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { copyText } from "../lib/fileActions";

type CourseLessonLink = { id: string; title: string; sourceUrl?: string };
type Props = { lessonId: string; title: string; content: string; courseLessons: CourseLessonLink[]; onOpenLesson: (id: string) => void; showTools?: boolean; moduleId?: number };
type NavigationContextValue = { resolve: (url: string) => CourseLessonLink | undefined; open: (id: string) => void };

// Same module-id → CSS-class convention as ModulePreview.tsx's moduleToneClass,
// so `.rich-lesson-article.mod1` etc can resolve --lesson-accent to that module's
// real color (see globals.css). Module 0 has no dedicated accent, so it falls
// back to the generic --accent/--accent-soft tokens (empty class).
const moduleToneClass: Record<number, string> = { 0: "", 1: "mod1", 2: "mod2", 3: "mod3", 4: "mod4", 5: "mod5" };

const LessonNavigationContext = createContext<NavigationContextValue>({ resolve: () => undefined, open: () => undefined });

type AppInfo = {
  name: string;
  pattern: RegExp;
  icon: string;
  tone: string;
  label: string;
  url: string;
};

const appCatalog: AppInfo[] = [
  { name: "Claude Code", pattern: /Claude Code/i, icon: "https://claude.ai/favicon.ico", tone: "orange", label: "Работа с файлами", url: "https://claude.com/product/claude-code" },
  { name: "Claude", pattern: /\bClaude\b/i, icon: "https://claude.ai/favicon.ico", tone: "orange", label: "Проекты и агенты", url: "https://claude.ai" },
  { name: "ChatGPT", pattern: /ChatGPT/i, icon: "https://chatgpt.com/favicon.ico", tone: "green", label: "Проекты и контент", url: "https://chatgpt.com" },
  { name: "Codex", pattern: /\bCodex\b/i, icon: "https://chatgpt.com/favicon.ico", tone: "green", label: "Работа с файлами", url: "https://chatgpt.com/codex" },
  { name: "Apify", pattern: /Apify/i, icon: "https://apify.com/favicon.ico", tone: "blue", label: "Сбор данных", url: "https://apify.com" },
  { name: "PostMyPost", pattern: /PostMyPost/i, icon: "https://postmypost.io/favicon.ico", tone: "purple", label: "Публикация", url: "https://postmypost.io" },
  { name: "HeyGen", pattern: /HeyGen/i, icon: "https://www.heygen.com/favicon.ico", tone: "pink", label: "AI-аватар", url: "https://www.heygen.com" },
  { name: "ElevenLabs", pattern: /ElevenLabs/i, icon: "https://elevenlabs.io/favicon.ico", tone: "black", label: "Озвучка", url: "https://elevenlabs.io" },
  { name: "Captions", pattern: /\bCaptions\b/i, icon: "https://www.captions.ai/favicon.ico", tone: "black", label: "Монтаж видео", url: "https://www.captions.ai" },
  { name: "Remotion", pattern: /Remotion/i, icon: "https://www.remotion.dev/favicon.ico", tone: "blue", label: "Нейромонтаж", url: "https://www.remotion.dev" },
  { name: "Canva", pattern: /\bCanva\b/i, icon: "https://www.canva.com/favicon.ico", tone: "purple", label: "Дизайн", url: "https://www.canva.com" },
  { name: "Google Drive", pattern: /Google Drive/i, icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png", tone: "yellow", label: "Хранение файлов", url: "https://drive.google.com" },
  { name: "Instagram", pattern: /Instagram/i, icon: "https://www.instagram.com/static/images/ico/favicon-200.png/ab6eff595bb1.png", tone: "pink", label: "Площадка", url: "https://www.instagram.com" },
  { name: "Telegram", pattern: /Telegram/i, icon: "https://telegram.org/favicon.ico", tone: "blue", label: "Площадка", url: "https://telegram.org" },
];

function clean(value: string) {
  return value.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#{1,5}\s+/, "").trim();
}

// Mockup's `.path-cta` (e.g. screens p0/m1-1/m2-0 etc): a solid module-tinted
// callout with the lesson's transition note, sitting right before the
// "next lesson" button — authored in module-N.ts as the LAST block of a
// lesson, wrapped in a lone `---` line on each side, immediately followed by
// the `\n---\n## Продолжить обучение` navigation section. Must run on the RAW
// content (before the navigation section is stripped) — a previous version
// stripped navigation first, which also consumed the path-cta's own closing
// `---`, so the path-cta never matched for ANY lesson and rendered as stray
// plain text (visible literal "---" line) instead of the styled callout.
function splitPathCta(content: string): { body: string; pathCta: string | null } {
  const wrapped = content.match(/\n---\n([^]+?)\n---\n## (?:Продолжить обучение|Куда дальше)/);
  if (wrapped) return { body: content.slice(0, wrapped.index).trim(), pathCta: wrapped[1].trim() };
  return { body: content.split(/\n---\n## (?:Продолжить обучение|Куда дальше)/)[0].trim(), pathCta: null };
}

function notionPageId(url: string) {
  return url.match(/[a-f0-9]{32}/i)?.[0]?.toLowerCase();
}

function tokenize(content: string) {
  const lines = content.split("\n");
  const tokens: string[] = [];
  let buffer: string[] = [];
  let code: string[] | null = null;

  const flush = () => {
    if (buffer.length) tokens.push(buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code) {
        code.push(line);
        tokens.push(code.join("\n"));
        code = null;
      } else {
        flush();
        code = [line];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (/^#{2,5}\s/.test(line)) {
      flush();
      tokens.push(line.trim());
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();
  if (code) tokens.push(code.join("\n"));
  return tokens.filter(Boolean);
}

type PhaseInfo = { phase: 0 | 1 | 2; step?: number; total?: number; note?: string };
const PHASE_LABELS = ["Вход", "Настройка", "Съёмка и монтаж"];

function parsePhase(boldLead: string): PhaseInfo | null {
  const text = boldLead.replace(/\.$/, "").trim();
  if (/^Вход в модуль$/.test(text)) return { phase: 0 };
  let match = text.match(/^Настройка\s*·\s*Шаг\s*(\d+)\s*из\s*(\d+)(?:\s*·\s*(.+))?$/);
  if (match) return { phase: 1, step: Number(match[1]), total: Number(match[2]), note: match[3] };
  match = text.match(/^Съёмка и монтаж\s*·\s*Урок\s*(\d+)\s*из\s*(\d+)(?:\s*·\s*(.+))?$/);
  if (match) return { phase: 2, step: Number(match[1]), total: Number(match[2]), note: match[3] };
  return null;
}

function PhaseTrack({ info }: { info: PhaseInfo }) {
  return (
    <div className="phase-track-wrap">
      <div className="phase-track">
        {PHASE_LABELS.map((label, index) => (
          <span className={`seg ${index === info.phase ? "active" : index < info.phase ? "done" : ""}`} key={label}>{label}</span>
        ))}
      </div>
      {(info.step || info.note) && (
        <p className="phase-track-caption">
          {info.step && info.total ? <b>Шаг {info.step} из {info.total}</b> : null}
          {info.note ? <span>{info.step ? " · " : ""}{info.note}</span> : null}
        </p>
      )}
    </div>
  );
}

function AppIcon({ app, compact = false }: { app: AppInfo; compact?: boolean }) {
  return (
    <span className={`rich-app-icon ${app.tone} ${compact ? "compact" : ""}`} aria-hidden="true">
      <b>{app.name.slice(0, 1)}</b>
      <img src={app.icon} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
    </span>
  );
}

function InlineRich({ value }: { value: string }) {
  const navigation = useContext(LessonNavigationContext);
  const appNames = appCatalog.map((app) => app.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`(\\*\\*[^*]+\\*\\*|\`[^\`]+\`|\\[[^\\]]+\\]\\([^)]+\\)|${appNames})`, "gi");
  const parts = value.split(pattern).filter(Boolean);

  return <>{parts.map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const lesson = navigation.resolve(link[2]);
      if (lesson) return <button type="button" className="internal-lesson-link" key={index} onClick={() => navigation.open(lesson.id)}>{link[1]} <span>→</span></button>;
      if (link[2].includes("app.notion.com")) return <span className="notion-reference" key={index}>{link[1]}</span>;
      return <a className="link-chip" key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]} <span>↗</span></a>;
    }
    return <span key={index}>{part}</span>;
  })}</>;
}

function ReelsMethodCards({ blocks }: { blocks: string[] }) {
  const navigation = useContext(LessonNavigationContext);
  const methods: Array<{ name: string; description: string; url: string; badge: string; tone: string }> = [];
  const badges = ["БЫСТРЫЙ СТАРТ", "ФИРМЕННЫЙ МОНТАЖ", "ТОЧНАЯ НАСТРОЙКА"];
  const tones = ["captions", "studio", "svg"];
  let cursor = 1;

  while (cursor + 1 < blocks.length && methods.length < 3) {
    const lines = blocks[cursor].split("\n").filter(Boolean);
    const name = lines[0]?.match(/^\*\*([^*]+)\*\*$/)?.[1];
    const link = blocks[cursor + 1]?.match(/^\[[^\]]+\]\(([^)]+)\)$/);
    if (!name || !link) break;
    methods.push({ name, description: lines.slice(1).join(" "), url: link[1], badge: badges[methods.length], tone: tones[methods.length] });
    cursor += 2;
  }

  return <div className="reels-method-wrap">
    <p className="reels-method-intro"><InlineRich value={blocks[0]} /></p>
    <div className="reels-method-grid">{methods.map((method, index) => {
      const target = navigation.resolve(method.url);
      const iconApp = method.name === "Captions" ? appCatalog.find((app) => app.name === "Captions") : method.name.includes("SVG") ? appCatalog.find((app) => app.name === "Claude Code") : undefined;
      return <div className={`reels-method-card ${method.tone}`} key={method.name}>
        <div className="reels-method-top">{iconApp ? <AppIcon app={iconApp} /> : <span className="studio-method-icon">AI</span>}<span>0{index + 1}</span></div>
        <small>{method.badge}</small><h5>{method.name}</h5><p><InlineRich value={method.description} /></p>
        <button type="button" onClick={() => target && navigation.open(target.id)} disabled={!target}>Открыть урок <span>→</span></button>
      </div>;
    })}</div>
    {blocks[cursor] && <div className="method-note"><span>✓</span><InlineRich value={blocks[cursor]} /></div>}
  </div>;
}

// Mockup's `.prompt-card` (screen m1-1 etc): a `ph` header (bold title + small
// pill badge), a short result/hint line, then a collapsed <details> holding the
// full text and a copy button. The mockup's own prompt-cards carry per-card
// result copy and numbering ("01"/"02") that only exists for a few hand-authored
// screens — module-N.ts's fenced code blocks don't carry that metadata, so this
// falls back to a generic "AI" badge and a copy hint instead of a numbered result line.
function PromptCard({ code, title }: { code: string; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState("Скопировать промпт");
  const prepared = code.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim();
  const isInstallerMessage = /Установите студию одним файлом/i.test(title);
  const cardTitle = isInstallerMessage
    ? "Сообщение для запуска установки"
    : title.toLowerCase().includes("методика") ? "Готовая методика агента" : "Готовый текст для вставки";
  const cardHint = isInstallerMessage
    ? "Скопируйте после того, как прикрепите файл установки"
    : "Откройте полностью и скопируйте одним нажатием";

  const handleCopy = async () => {
    setCopyState(await copyText(prepared) ? "Скопировано ✓" : "Не получилось");
    window.setTimeout(() => setCopyState("Скопировать промпт"), 1800);
  };

  return (
    <div className="prompt-card">
      <div className="ph"><b>{cardTitle}</b><span>AI</span></div>
      <p className="hint">{cardHint}</p>
      <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary>{expanded ? "Свернуть ←" : "Открыть полностью →"}</summary>
        <pre>{prepared}</pre>
        <p className="copy-note">После копирования текст временно хранится в буфере обмена. Откройте {isInstallerMessage ? "Claude Code или Codex" : "сервис, указанный в шаге"}, нажмите в поле сообщения и выберите «Вставить».</p>
        <button type="button" className={copyState.startsWith("Скопировано") ? "copied" : ""} onClick={handleCopy}>{copyState}</button>
      </details>
    </div>
  );
}

function StudioInstallerSection({ blocks, title }: { blocks: string[]; title: string }) {
  const usefulBlocks = blocks.filter((block) => !/Скачайте документ ниже/i.test(clean(block)));

  return <div className="studio-installer">
    <div className="installer-file-card">
      <div className="installer-file-icon">TXT</div>
      <div className="installer-file-copy">
        <small>ОФОРМЛЕННЫЙ ФАЙЛ ДЛЯ ЗАГРУЗКИ</small>
        <strong>AI_CONTENT_STUDIA_INSTALL.docx</strong>
        <p>Презентабельный Word-документ со структурой студии, шагами установки и обязательной проверкой.</p>
      </div>
      <a href="/documents/AI_CONTENT_STUDIA_INSTALL.docx" download="AI_CONTENT_STUDIA_INSTALL.docx">Скачать документ</a>
    </div>

    <ol className="installer-steps">
      <li><span>01</span><div><strong>Создайте пустую папку</strong><p>Назовите её AI_CONTENT_STUDIA.</p></div></li>
      <li><span>02</span><div><strong>Откройте папку</strong><p>Используйте Claude Code или Codex.</p></div></li>
      <li><span>03</span><div><strong>Прикрепите скачанный документ</strong><p>Выберите AI_CONTENT_STUDIA_INSTALL.docx из папки «Загрузки».</p></div></li>
      <li><span>04</span><div><strong>Отправьте сообщение ниже</strong><p>Агент сам установит студию и создаст проверочное видео.</p></div></li>
    </ol>

    {renderBlocks(usefulBlocks, title)}
  </div>;
}

type TableSpec = { headers: string[]; firstCell: RegExp; maxRows: number };

const tableSpecs: TableSpec[] = [
  { headers: ["#", "Чат", "Выход", "Пригодится для"], firstCell: /^\d+$/, maxRows: 20 },
  { headers: ["#", "Элемент", "Что делает", "Приоритет"], firstCell: /^\d+$/, maxRows: 20 },
  { headers: ["Вариант", "Что использовать", "Кому подходит"], firstCell: /^(Тестовый|Основной|Полный)$/i, maxRows: 10 },
  { headers: ["Сервис", "Нужен сразу?", "Ориентир", "Для чего"], firstCell: /^(Claude|ChatGPT|Apify|PostMyPost|HeyGen|ElevenLabs|Google Drive)/i, maxRows: 20 },
  { headers: ["Формат", "Плюсы", "Минусы", "Что подготовить"], firstCell: /^(Живой разговорный рилс|ИИ-аватар|Кадр без разговора|Видео без тебя)$/i, maxRows: 10 },
  { headers: ["Этап", "Срок", "Площадки"], firstCell: /^Этап\s*\d+/i, maxRows: 10 },
  { headers: ["Площадка", "Что публиковать", "Куда вести"], firstCell: /^(YouTube Shorts|Threads|Яндекс Дзен|TikTok|WhatsApp канал)$/i, maxRows: 12 },
  { headers: ["Файл", "Площадка", "Дата и время", "Описание"], firstCell: /.+/, maxRows: 1 },
  { headers: ["Ракурс", "Формулировка для промпта"], firstCell: /^(Лицо вблизи|По талию|В полный рост|Профиль|Со спины)$/i, maxRows: 5 },
];

function sameCell(value: string, expected: string) {
  return clean(value).toLowerCase() === expected.toLowerCase();
}

function PromptAngles({ rows }: { rows: string[][] }) {
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = async (value: string, index: number) => {
    if (await copyText(value)) {
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1600);
    }
  };

  return <div className="prompt-angle-grid">{rows.map((row, index) => <div className="prompt-angle-card" key={row[0]}>
    <div className="prompt-angle-top"><span className={`angle-visual angle-${index + 1}`}><i /></span><span className="angle-count">0{index + 1}</span></div>
    <h5>{row[0]}</h5>
    <p>{row[1]}</p>
    <button onClick={() => handleCopy(row[1], index)}>{copied === index ? "Скопировано ✓" : "Скопировать промпт"}</button>
  </div>)}</div>;
}

// The mockup never renders a literal `<table>` anywhere in a lesson body (verified:
// zero `<table` tags in lessonredesignmockup.html) — every tabular list in module-N.ts
// content maps to `.info-rows` (name/value pairs) in the mockup's actual screens, so
// the generic fallback below (used by Module 3/4/5's remaining tables that don't have
// a bespoke renderer yet) uses that same markup instead of a custom grid-table.
function RichTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (headers[0] === "Ракурс") return <PromptAngles rows={rows} />;
  if (headers[0] === "Вариант") return <StartVariantRows rows={rows} />;
  if (headers[0] === "Сервис") return <ServicePriceRows rows={rows} />;
  return <div className="info-rows">{rows.map((row, rowIndex) => (
    <div className="row" key={rowIndex}>
      <div className="head"><span className="name"><span className="dot-ic">{rowIndex + 1}</span><b><InlineRich value={row[0]} /></b></span></div>
      <div className="sub">{row.slice(1).map((cell, cellIndex) => <span key={cellIndex}>{cellIndex > 0 && " · "}<InlineRich value={cell} /></span>)}</div>
    </div>
  ))}</div>;
}

// Module 0, Lesson 1's "Три варианта старта" and "Сервис/цена" tables render as
// `.info-rows` cards (dot-ic badge + bold name + description line) in the design
// mockup (lessonredesignmockup.html, screen #p0) instead of the generic grid table —
// reusing the exact `.info-rows`/`.row`/`.dot-ic` markup already used by
// ImplementationPage.tsx and ModulePreview.tsx.
const START_VARIANT_ICONS: Record<string, string> = { "Тестовый": "🧪", "Основной": "🚀", "Полный": "⭐" };

function StartVariantRows({ rows }: { rows: string[][] }) {
  return <div className="info-rows">{rows.map((row) => {
    const name = clean(row[0]);
    return <div className="row" key={name}>
      <div className="head"><span className="name"><span className="dot-ic">{START_VARIANT_ICONS[name] || "•"}</span><b>{name}</b></span></div>
      <div className="sub"><InlineRich value={row[1]} /> — <InlineRich value={row[2]} /></div>
    </div>;
  })}</div>;
}

// Numbered folder/item lists (e.g. "01_База_знаний — сюда лягут файлы...") render
// as numbered circle-badge rows in the design mockup's `.scenario-grid` (screen #p1a,
// "Зачем именно так" section) — badges carry the item's own number (folder number),
// not sequential list position. Reuses the `.info-rows`/`.dot-ic` markup/CSS.
const FOLDER_ITEM = /^(\d{2})_(\S+)\s*—\s*(.+)$/;

// Verbatim mockup `.scenario-grid` (lessonredesignmockup.html lines 301-303) — this is
// how EVERY plain bullet list in the mockup renders (grep confirms zero bare <ul>
// elements exist anywhere in the file). Each item gets an `.ic` badge: the item's own
// leading emoji if every item in the list has one, otherwise a sequential "01"/"02".
const LEADING_EMOJI = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u;

function ScenarioGrid({ lines }: { lines: string[] }) {
  const allHaveEmoji = lines.every((line) => LEADING_EMOJI.test(line));
  return <div className="scenario-grid">{lines.map((line, index) => {
    const icon = allHaveEmoji ? line.match(LEADING_EMOJI)![1] : String(index + 1).padStart(2, "0");
    const text = allHaveEmoji ? line.replace(LEADING_EMOJI, "") : line;
    return <div className="item" key={index}><span className="ic">{icon}</span><InlineRich value={text} /></div>;
  })}</div>;
}

function FolderNumberRows({ items }: { items: Array<{ number: string; label: string; description: string }> }) {
  return <div className="info-rows">{items.map((item) => (
    <div className="row" key={item.number}>
      <div className="head"><span className="name"><span className="dot-ic">{item.number}</span><b>{item.label.replace(/_/g, " ")}</b></span></div>
      <div className="sub"><InlineRich value={item.description} /></div>
    </div>
  ))}</div>;
}

const SERVICE_NEED_LABELS: Record<string, string> = { "Да": "нужен сейчас" };

function ServicePriceRows({ rows }: { rows: string[][] }) {
  return <div className="info-rows">{rows.map((row) => {
    const name = clean(row[0]);
    const need = clean(row[1]);
    const needLabel = SERVICE_NEED_LABELS[need] || need.toLowerCase();
    return <div className="row" key={name}>
      <div className="head"><span className="name"><span className="dot-ic">{name === "Google Drive" ? "📁" : name[0]}</span><b>{name}</b></span></div>
      <div className="sub">{needLabel} · <InlineRich value={row[2]} /> — <InlineRich value={row[3]} /></div>
    </div>;
  })}</div>;
}

type RouteInfo = { key: string; label: string; nodes: ReactNode[] };

function RouteSwitcher({ routeA, routeB }: { routeA: RouteInfo; routeB: RouteInfo }) {
  const [active, setActive] = useState(routeA.key);
  const routes = [routeA, routeB];
  const current = routes.find((route) => route.key === active) ?? routeA;

  return <div className="route-switch">
    <div className="route-tabs">{routes.map((route) => (
      <button
        type="button"
        className={route.key === active ? "active" : ""}
        key={route.key}
        onClick={() => setActive(route.key)}
      >
        <b>{route.label}</b><small>Маршрут {route.key}</small>
      </button>
    ))}</div>
    <div className="route-panel active">{current.nodes}</div>
  </div>;
}

// Sequential "chat" steps ported as `### N. Чат «Title»` headings (currently only
// module-1.ts's "Агент-маркетолог" lesson, 7 chats). This is the same shape as the
// `.chat-acc` accordion in the design mockup (lessonredesignmockup.html, screen m1-1):
// a collapsed-by-default <details>/<summary> per chat, first one open. When a run of
// 2+ consecutive blocks match this heading pattern, group them into ChatAccordion
// instead of rendering each as a plain subsection heading.
const CHAT_HEAD = /^###\s*(\d+)\.\s*Чат\s*«([^»]+)»\s*$/;

type ChatAccItem = { number: string; title: string; file?: string; blocks: string[] };

function ChatAccordion({ items, sectionTitle }: { items: ChatAccItem[]; sectionTitle: string }) {
  return <>{items.map((item, itemIndex) => (
    <details className="chat-acc" open={itemIndex === 0} key={item.number}>
      <summary>
        <span className="left"><span className="dot-ic">{item.number}</span><b>{item.title}</b></span>
        <span className="right">{item.file && <span className="file">{item.file}</span>}<span className="chev">▶</span></span>
      </summary>
      <div className="acc-body">{renderBlocks(item.blocks, sectionTitle)}</div>
    </details>
  ))}</>;
}

function renderBlocks(blocks: string[], sectionTitle: string) {
  const result: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    if (CHAT_HEAD.test(blocks[index])) {
      const items: ChatAccItem[] = [];
      let cursor = index;
      while (cursor < blocks.length && CHAT_HEAD.test(blocks[cursor])) {
        const match = blocks[cursor].match(CHAT_HEAD)!;
        let bodyEnd = cursor + 1;
        while (bodyEnd < blocks.length && !CHAT_HEAD.test(blocks[bodyEnd]) && !/^#{1,5}\s/.test(blocks[bodyEnd])) bodyEnd += 1;
        const itemBlocks = blocks.slice(cursor + 1, bodyEnd);
        const file = itemBlocks.map((block) => block.match(/Результат\s*→\s*`([^`]+)`/)?.[1]).find(Boolean);
        items.push({ number: match[1], title: match[2], file, blocks: itemBlocks });
        cursor = bodyEnd;
      }
      if (items.length > 1) {
        result.push(<ChatAccordion items={items} sectionTitle={sectionTitle} key={`chat-acc-${index}`} />);
        index = cursor;
        continue;
      }
    }

    const table = tableSpecs.find((spec) => spec.headers.every((header, offset) => blocks[index + offset] && sameCell(blocks[index + offset], header)));
    if (table) {
      const rows: string[][] = [];
      let cursor = index + table.headers.length;
      while (rows.length < table.maxRows && cursor + table.headers.length <= blocks.length && table.firstCell.test(clean(blocks[cursor]))) {
        rows.push(blocks.slice(cursor, cursor + table.headers.length));
        cursor += table.headers.length;
      }
      if (rows.length) {
        result.push(<RichTable headers={table.headers} rows={rows} key={`table-${index}`} />);
        index = cursor;
        continue;
      }
    }

    const routeHeadings: number[] = [];
    for (let cursor = index; cursor < blocks.length; cursor += 1) {
      if (ROUTE_HEAD.test(blocks[cursor])) routeHeadings.push(cursor);
    }
    if (routeHeadings.length === 2 && routeHeadings[0] === index) {
      const [headingA, headingB] = routeHeadings;
      let contentBEnd = blocks.length;
      for (let cursor = headingB + 1; cursor < blocks.length; cursor += 1) {
        if (/^#{1,5}\s/.test(blocks[cursor])) { contentBEnd = cursor; break; }
      }
      const matchA = blocks[headingA].match(ROUTE_HEAD)!;
      const matchB = blocks[headingB].match(ROUTE_HEAD)!;
      const routeA = { key: matchA[1], label: matchA[2].trim(), nodes: renderBlocks(blocks.slice(headingA + 1, headingB), sectionTitle) };
      const routeB = { key: matchB[1], label: matchB[2].trim(), nodes: renderBlocks(blocks.slice(headingB + 1, contentBEnd), sectionTitle) };
      result.push(<RouteSwitcher routeA={routeA} routeB={routeB} key={`route-switch-${index}`} />);
      index = contentBEnd;
      continue;
    }

    // "**Время**" / "**Подготовить**" / "**Действие**" / "**Результат**" style
    // label+content pairs render as one `.info-rows` group in the mockup (screen
    // m1-1: Время/Подготовить/Действие/Результат all inside a single .info-rows),
    // not as separate cards — so a run of consecutive label blocks is grouped.
    const label = blocks[index].match(/^\*\*([^*]{1,48})\*\*$/)?.[1];
    if (label && blocks[index + 1] && !/^#{2,5}\s/.test(blocks[index + 1]) && !blocks[index + 1].startsWith("```")) {
      const rows: Array<{ label: string; content: string }> = [];
      let cursor = index;
      while (cursor < blocks.length) {
        const rowLabel = blocks[cursor].match(/^\*\*([^*]{1,48})\*\*$/)?.[1];
        if (!rowLabel || !blocks[cursor + 1] || /^#{2,5}\s/.test(blocks[cursor + 1]) || blocks[cursor + 1].startsWith("```")) break;
        rows.push({ label: rowLabel, content: blocks[cursor + 1] });
        cursor += 2;
      }
      result.push(<div className="info-rows" key={`info-${index}`}>{rows.map((row) => (
        <div className="row" key={row.label}>
          <div className="head"><span className="name"><span className="dot-ic">{INFO_CARD_ICONS[row.label] || DEFAULT_INFO_ICON}</span><b>{row.label}</b></span></div>
          <div className="sub"><InlineRich value={row.content} /></div>
        </div>
      ))}</div>);
      index = cursor;
      continue;
    }

    // A RUN of 2+ consecutive standalone "**Short lead** — text." blocks (each its
    // own block, separated by blank lines) is the mockup's "sequence of result
    // callouts" pattern (e.g. lesson 3's "## Результат": "Когда линейка собрана —
    // ...", "Файлы в базе знаний — ...", "Готовую линейку — ..." — three separate
    // .callout boxes, not one paragraph each). Scoped to a RUN (not a single
    // isolated bold-lead sentence) so long-form instructional leads that happen to
    // start with "**Label:**" (e.g. "Как установить: откройте репозиторий...")
    // don't get boxed too — those appear alone, not back-to-back with siblings of
    // the same shape.
    const BOLD_LEAD_DASH = /^\*\*[^*]{2,60}\*\*\s*[—:]/;
    if (BOLD_LEAD_DASH.test(blocks[index]) && !isCallout(blocks[index])) {
      let cursor = index;
      while (cursor < blocks.length && BOLD_LEAD_DASH.test(blocks[cursor]) && !blocks[cursor].startsWith("```")) cursor += 1;
      if (cursor - index >= 2) {
        for (let i = index; i < cursor; i += 1) {
          result.push(<Callout tone={calloutTone(blocks[i])} lines={[blocks[i]]} id={`run-callout-${i}`} key={`run-callout-${i}`} />);
        }
        index = cursor;
        continue;
      }
    }

    result.push(renderBlock(blocks[index], index, sectionTitle));
    index += 1;
  }

  return result;
}

// Callout detection: a bold-lead paragraph starting with one of these words (or
// an explicit ⚠️) is rendered as a mockup `.callout` instead of a plain paragraph.
// "Готово"/"Можно" mark a successful-completion callout (mockup's `.callout.green`,
// e.g. "**Готово, если** ...", "**Можно двигаться дальше, если:**") — those get
// routed to the green tone specifically, below.
const CALLOUT_LEAD_WORDS = /^\*\*(Важно|Главное|Результат|Самый простой|Никогда|Обязательно|Цель|Правило|Готово|Можно|Когда всё готово|Чаще всего)/i;
const CALLOUT_GREEN_WORDS = /^\*\*(Готово|Можно|Когда всё готово)/i;

function calloutTone(value: string): "amber" | "green" | "" {
  if (value.includes("⚠️")) return "amber";
  if (CALLOUT_GREEN_WORDS.test(value)) return "green";
  return "";
}

function isCallout(value: string) {
  return CALLOUT_LEAD_WORDS.test(value) || value.includes("⚠️");
}

// Mockup's `.callout` (screens p1/p1a/m1-1 etc): a flex row with an `.ic` icon
// badge and a text div — `.callout.amber`/`.callout.green` carry their own
// background via CSS, the plain "tip" tone (no ⚠️/✓ semantics) is styled inline
// in the mockup's own markup (`style="background:var(--accent-soft);color:#164a66;"`),
// which this mirrors with the module's --la-accent-soft token.
const CALLOUT_ICONS: Record<"amber" | "green" | "", string> = { amber: "⚠", green: "✓", "": "💡" };

function Callout({ tone, lines, id }: { tone: "amber" | "green" | ""; lines: string[]; id: string }) {
  return (
    <div className={`callout${tone ? ` ${tone}` : ""}`} style={tone ? undefined : { background: "var(--la-accent-soft)", color: "#164a66" }} key={id}>
      <span className="ic">{CALLOUT_ICONS[tone]}</span>
      <div>{lines.map((line, lineIndex) => <span key={lineIndex}><InlineRich value={line} />{lineIndex < lines.length - 1 && <br />}</span>)}</div>
    </div>
  );
}

// Mockup's `ol.steps` (screens p1/m1-1 etc): a numbered circle badge (`.n`) next
// to the step text (`.body`), replacing the app's earlier CSS-counter approach.
function Steps({ lines, id }: { lines: string[]; id: string }) {
  return (
    <ol className="steps" key={id}>
      {lines.map((line, lineIndex) => (
        <li key={line}><span className="n">{lineIndex + 1}</span><div className="body"><InlineRich value={line.replace(/^\d+[.)]\s/, "")} /></div></li>
      ))}
    </ol>
  );
}

const ROUTE_HEAD = /^###\s*Маршрут\s*([А-Яа-яA-Za-z])\.\s*(.+)$/;

// Label → icon dictionary, built from every `.info-rows .row .head` label the
// design mockup actually uses (lessonredesignmockup.html, `dot-ic` spans inside
// `.head`/`.name` — excludes the numbered-folder and chat-accordion `dot-ic`
// uses, which carry numbers/letters instead of a semantic icon). Where the
// mockup uses more than one icon for the same label across screens, the most
// frequent one is kept here. `DEFAULT_INFO_ICON` guarantees every row still
// gets an icon even for a label not in this dictionary — the mockup never
// shows a label-less/icon-less `.row`, so the app must not either.
const INFO_CARD_ICONS: Record<string, string> = {
  "Время": "⏱", "Подготовить": "🗂", "Действие": "⚡", "Результат": "🎯",
  "Сохранить на компьютер": "💻", "Загрузить в базу знаний": "📥",
  "Перед началом": "🗂", "Что сделать": "⚡", "Загрузить": "📚",
  "Источники": "🔎", "Первый тест": "🧪", "Первый результат": "✅",
  "Критерий качества": "✅", "Когда возвращаться": "🔁", "Можно пропустить": "⏭️",
  "Опционально": "🔌", "Дополнительно": "🔌", "Сначала решить": "🧭",
  "Когда выбирать этот путь": "🧭", "Что здесь не нужно": "🚫", "Технически": "🎥",
  "По подаче": "🗣", "После проверки": "📈", "Чем отличается от AI-студии": "⚖️",
  "Рекомендуется загрузить": "📤", "Загрузить в базу знаний проекта": "📤",
  "Проект": "📁",
};
const DEFAULT_INFO_ICON = "•";

function renderBlock(value: string, index: number, sectionTitle: string): ReactNode {
  if (value.startsWith("```")) return <PromptCard code={value} title={sectionTitle} key={index} />;
  if (value.startsWith("### ")) return <h5 className="subsection-title" key={index}>{clean(value)}</h5>;
  if (value.startsWith("#### ") || value.startsWith("##### ")) return <h6 key={index}>{clean(value)}</h6>;

  const lines = value.split("\n").filter(Boolean);
  const checklist = lines.every((line) => /^- \[[ x]\]/.test(line));
  if (checklist) return <div className="rich-checklist" key={index}>{lines.map((line) => <label key={line}><input type="checkbox" /><span><InlineRich value={line.replace(/^- \[[ x]\]\s?/, "")} /></span></label>)}</div>;

  const numbered = lines.every((line) => /^\d+[.)]\s/.test(line));
  if (numbered) return <Steps lines={lines} id={`steps-${index}`} key={index} />;

  // A bold-lead (or plain) intro line glued by a single "\n" to a numbered mini-list
  // that follows it in the same block (no blank line between them in the source).
  // Split it into its own intro paragraph/callout plus a real ordered list instead of
  // rendering the whole thing as one cramped paragraph.
  const firstNumberedIndex = lines.findIndex((line) => /^\d+[.)]\s/.test(line));
  if (
    firstNumberedIndex > 0 &&
    lines.slice(firstNumberedIndex).every((line) => /^\d+[.)]\s/.test(line))
  ) {
    const introLines = lines.slice(0, firstNumberedIndex);
    const stepLines = lines.slice(firstNumberedIndex);
    const introValue = introLines.join("\n");
    const introIsCallout = isCallout(introValue);
    const introTone = calloutTone(introValue);
    return <div className="lesson-step-group" key={index}>
      {introIsCallout ? <Callout tone={introTone} lines={introLines} id={`intro-callout-${index}`} /> : <p className="rich-paragraph">{introLines.map((line, lineIndex) => <span key={lineIndex}><InlineRich value={line} />{lineIndex < introLines.length - 1 && <br />}</span>)}</p>}
      <Steps lines={stepLines} id={`steps-${index}`} />
    </div>;
  }

  const folderMatches = lines.map((line) => line.replace(/^[-*]\s+/, "").match(FOLDER_ITEM));
  if (lines.length > 1 && folderMatches.every(Boolean)) {
    const items = folderMatches.map((match) => ({ number: match![1], label: match![2], description: match![3] }));
    return <FolderNumberRows items={items} key={index} />;
  }

  const bullets = lines.every((line) => /^[-*]\s/.test(line));
  if (bullets) return <ScenarioGrid lines={lines.map((line) => line.replace(/^[-*]\s/, ""))} key={index} />;

  const callout = isCallout(value);
  if (callout) return <Callout tone={calloutTone(value)} lines={lines} id={`callout-${index}`} key={index} />;
  return <p className="rich-paragraph" key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}><InlineRich value={line} />{lineIndex < lines.length - 1 && <br />}</span>)}</p>;
}

export default function RichLessonArticle({ lessonId, title, content, courseLessons, onOpenLesson, showTools = true, moduleId }: Props) {
  const { body: bodyContent, pathCta } = useMemo(() => splitPathCta(content), [content]);
  const navigation = useMemo<NavigationContextValue>(() => {
    const lessonMap = new Map(courseLessons.map((lesson) => [notionPageId(lesson.sourceUrl || ""), lesson]));
    return { resolve: (url: string) => lessonMap.get(notionPageId(url)), open: (id: string) => { onOpenLesson(id); } };
  }, [courseLessons, onOpenLesson]);
  const tokens = useMemo(() => tokenize(bodyContent), [bodyContent]);
  const firstHeading = tokens.findIndex((token) => token.startsWith("## "));
  const intro = firstHeading === -1 ? tokens : tokens.slice(0, firstHeading);
  const rest = firstHeading === -1 ? [] : tokens.slice(firstHeading);
  const tools = useMemo(() => appCatalog.filter((app) => app.pattern.test(bodyContent)).filter((app, index, all) => !(app.name === "Claude" && all.some((item) => item.name === "Claude Code"))), [bodyContent]);

  const sections: Array<{ title: string; blocks: string[] }> = [];
  for (const token of rest) {
    if (token.startsWith("## ")) sections.push({ title: token.slice(3).trim(), blocks: [] });
    else sections.at(-1)?.blocks.push(token);
  }

  const outcomeIndex = intro.findIndex((item) => /^\*\*Результат/i.test(item));
  const outcome = outcomeIndex >= 0 ? intro[outcomeIndex].replace(/^\*\*Результат(?: урока)?[:*\s]*/i, "").trim() : "";
  const introBody = intro.filter((_, index) => index !== outcomeIndex);

  const leadMatch = introBody[0]?.match(/^\*\*([^*]+)\*\*/);
  const phaseInfo = leadMatch ? parsePhase(leadMatch[1]) : null;
  if (phaseInfo && leadMatch) {
    const remainder = introBody[0].slice(leadMatch[0].length).trimStart();
    introBody[0] = remainder;
    if (!remainder) introBody.shift();
  }

  const renderSection = (section: { title: string; blocks: string[] }, sectionIndex: number, prefix = "lesson") => {
    const step = section.title.match(/^Шаг\s*(\d+)/i)?.[1];
    const isDocument = /Полная методика|Системный промпт|Короткая инструкция/i.test(section.title);
    return <section className={`instruction-section ${isDocument ? "document-section" : ""}`} key={`${prefix}-${section.title}-${sectionIndex}`}>
      <div className="instruction-section-title">{step && <span>{step}</span>}<div><small>{isDocument ? "ГОТОВЫЙ ДОКУМЕНТ" : `РАЗДЕЛ ${String(sectionIndex + 1).padStart(2, "0")}`}</small><h4>{clean(section.title)}</h4></div></div>
      <div className="instruction-section-body">{/Установите студию одним файлом/i.test(section.title) ? <StudioInstallerSection blocks={section.blocks} title={section.title} /> : /Выберите способ создания Reels/i.test(section.title) ? <ReelsMethodCards blocks={section.blocks} /> : renderBlocks(section.blocks, section.title)}</div>
    </section>;
  };

  const toneClass = moduleId != null ? moduleToneClass[moduleId] || "" : "";

  return (
    <LessonNavigationContext.Provider value={navigation}><article className={`rich-lesson-article ${toneClass}`.trim()}>
      {phaseInfo && <PhaseTrack info={phaseInfo} />}

      {outcome && <div className="outcome-card"><span>✓</span><div><small>РЕЗУЛЬТАТ УРОКА</small><strong><InlineRich value={outcome} /></strong></div></div>}

      {showTools && tools.length > 0 && <section className="lesson-tools"><div className="rich-section-heading"><div><p>ИНСТРУМЕНТЫ УРОКА</p><h4>Что будем использовать</h4></div><span>{tools.length}</span></div><div className="lesson-tools-grid">{tools.map((app) => <a href={app.url} target="_blank" rel="noreferrer" key={app.name}><AppIcon app={app} /><span><strong>{app.name}</strong><small>{app.label}</small></span><b>↗</b></a>)}</div></section>}

      {introBody.length > 0 && <section className="instruction-section intro-section"><div className="instruction-section-body">{renderBlocks(introBody, "Введение")}</div></section>}

      <div className="instruction-sections">
        {sections.map((section, sectionIndex) => renderSection(section, sectionIndex))}
      </div>

      {pathCta && <div className="path-cta"><InlineRich value={pathCta} /></div>}

    </article></LessonNavigationContext.Provider>
  );
}
