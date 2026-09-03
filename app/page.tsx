"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SubscriptionLesson from "./components/SubscriptionLesson";
import RichLessonArticle from "./components/RichLessonArticle";
import ModulePreview from "./components/ModulePreview";
import ImplementationPage from "./components/ImplementationPage";
import { module0Content, type CourseLessonContent } from "./content/module-0";
import { module1Content } from "./content/module-1";
import { module2Content } from "./content/module-2";
import { module3Content } from "./content/module-3";
import { module4Content } from "./content/module-4";
import { module5Content } from "./content/module-5";
import { resourceContent } from "./content/resources";
import { modulePreviews } from "./content/modulePreviews";

type Lesson = { id: string; title: string; note?: string; content?: string; sourceUrl?: string };
type Module = {
  id: number; category: string; eyebrow: string; title: string;
  description: string; result: string; icon: string; tone: string;
  duration: string; lessons: Lesson[];
};

// Модуль 0 открыт всем бесплатно. Модули 1-5 требуют активной подписки
// (см. app/lib/access.ts и app/api/tribute-webhook — доступ выдаётся после
// оплаты через Tribute). Модуль 6 показывается вместе с остальными по подписке.
const FREE_MODULE_ID = 0;

const subscriptionLessonId = "3c3b3828167181a6a64bf70b02c9dd27";
const installLessonId = "3c6b382816718159b68ccd9fbfbad560";
const lessonVideos: Record<string, string> = {};

const lessonOverrides: Record<string, { title?: string; note?: string }> = {
  [subscriptionLessonId]: {
    title: "Вход в студию: инструменты и стоимость",
    note: "Какие сервисы понадобятся, для чего они нужны и сколько стоит начать.",
  },
};

function lessonSummary(content: string) {
  // Абзацы вида "**Результат урока:** ..." (см. article-callout в LessonArticle
  // ниже) уже показываются отдельной карточкой в теле урока — если взять их же
  // сюда, подзаголовок над видео дословно повторит эту карточку. Пропускаем
  // такие строки и ищем следующую содержательную.
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

const toLessons = (items: CourseLessonContent[]): Lesson[] => items.map((item) => ({
  ...item,
  title: lessonOverrides[item.id]?.title || item.title,
  note: lessonOverrides[item.id]?.note || lessonSummary(item.content),
}));

const modules: Module[] = [
  {
    id: 0, category: "Старт", eyebrow: "Модуль 0", title: "Вход в студию",
    description: "Настраиваем сервисы, папки и первый рабочий проект без технической путаницы.",
    result: "Инструменты готовы к работе", icon: "↗", tone: "sky", duration: "5 уроков",
    lessons: toLessons(module0Content),
  },
  {
    id: 1, category: "Маркетинг", eyebrow: "Модуль 1", title: "Фундамент бизнеса",
    description: "Собираем базу, благодаря которой агенты понимают вас, продукт и аудиторию.",
    result: "Готова база знаний бренда", icon: "◎", tone: "violet", duration: "4 блока",
    lessons: toLessons(module1Content),
  },
  {
    id: 2, category: "Контент", eyebrow: "Модуль 2", title: "Контент-команда",
    description: "Создаём агентов с отдельными ролями и превращаем одну тему в несколько форматов.",
    result: "Тема превращается в контент-связку", icon: "✦", tone: "coral", duration: "5 уроков",
    lessons: toLessons(module2Content),
  },
  {
    id: 3, category: "Reels", eyebrow: "Модуль 3", title: "Создание Reels",
    description: "Своё видео, ИИ-аватар, Captions или собственная нейромонтажная студия.",
    result: "Первый готовый Reels", icon: "▶", tone: "lime", duration: "11 уроков",
    lessons: toLessons(module3Content),
  },
  {
    id: 4, category: "Маркетинг", eyebrow: "Модуль 4", title: "Контент, который продаёт",
    description: "Связываем упаковку, лид-магнит, прогрев и продукт в одну понятную систему.",
    result: "Контент ведёт к продукту", icon: "◇", tone: "peach", duration: "6 уроков",
    lessons: toLessons(module4Content),
  },
  {
    id: 5, category: "Масштаб", eyebrow: "Модуль 5", title: "Масштабирование",
    description: "Адаптируем одну сильную тему под новые площадки без увеличения хаоса.",
    result: "Одна тема работает везде", icon: "↟", tone: "blue", duration: "7 уроков",
    lessons: toLessons(module5Content),
  },
];

// Модуль 6 «Реалити» полностью убран из пути ученика по прямому решению
// Натали (student-path-plan.md, версия 76) — не тизерится студенту ни в
// каком виде, ни как готовый, ни как «скоро появится».
const moduleIcons: Record<number, string> = { 0: "🔑", 1: "🧠", 2: "✍️", 3: "🎬", 4: "💰", 5: "📈" };

const valuePropSlides = [
  "🤖 Агенты пишут в вашем голосе — не обезличенным ИИ-текстом",
  "🎬 Один Reels превращается в статью, сторис и пост для Threads",
  "🔁 Настроили агента один раз — дальше он работает на вас",
  "📈 Система растёт вместе с вами: от первого поста до масштаба",
];

// Ссылки на оплату в Tribute — задаются в переменных окружения на Vercel,
// т.к. это реальные платёжные ссылки, которые появятся после того, как
// в @tribute будут созданы два товара («1 месяц» и «3 месяца»).
const TRIBUTE_LINK_1M = process.env.NEXT_PUBLIC_TRIBUTE_LINK_1M || "";
const TRIBUTE_LINK_3M = process.env.NEXT_PUBLIC_TRIBUTE_LINK_3M || "";

function plainText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}

function InlineText({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return <>{parts.map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]} ↗</a>;
    return <span key={index}>{part}</span>;
  })}</>;
}

const tableSpecs: Record<string, { columns: number; header: boolean }> = {
  "Вариант": { columns: 3, header: true },
  "Сервис": { columns: 4, header: true },
  "Маршрут": { columns: 3, header: true },
  "Результат": { columns: 2, header: true },
  "Формат": { columns: 3, header: true },
  "Этап": { columns: 3, header: true },
  "Время": { columns: 2, header: false },
  "Подготовить": { columns: 2, header: false },
};

function LessonArticle({ content }: { content: string }) {
  const usefulContent = content
    .split(/\n---\n## Продолжить обучение/)[0]
    .replace(/\n(?=#{2,5}\s)/g, "\n\n")
    .replace(/(#{2,5}\s[^\n]+)\n(?!\n)/g, "$1\n\n");
  const blocks = usefulContent.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const nodes = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const value = blocks[index];
    const tableSpec = tableSpecs[plainText(value)];

    if (tableSpec) {
      const cells: string[] = [];
      let cursor = index;
      while (cursor < blocks.length) {
        const candidate = blocks[cursor];
        if (cursor > index && (/^#{2,5}\s/.test(candidate) || candidate.startsWith("```") || /^[-*]\s/.test(candidate))) break;
        if (cursor > index && cells.length >= tableSpec.columns * 2 && cells.length % tableSpec.columns === 0 && (candidate.length > 200 || (candidate.startsWith("**") && candidate.length > 90))) break;
        cells.push(candidate);
        cursor += 1;
      }
      const headers = tableSpec.header ? cells.slice(0, tableSpec.columns) : [];
      const data = tableSpec.header ? cells.slice(tableSpec.columns) : cells;
      const rows = Array.from({ length: Math.ceil(data.length / tableSpec.columns) }, (_, rowIndex) => data.slice(rowIndex * tableSpec.columns, (rowIndex + 1) * tableSpec.columns));
      nodes.push(
        <div className="lesson-data" key={`table-${index}`}>
          {rows.map((row, rowIndex) => (
            <div className="lesson-data-row" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <div className="lesson-data-cell" key={cellIndex}>
                  {headers[cellIndex] && <small>{plainText(headers[cellIndex])}</small>}
                  <span><InlineText value={cell} /></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
      index = cursor - 1;
      continue;
    }

    if (value.startsWith("```")) {
      const code = value.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim();
      nodes.push(<div className="code-card" key={index}><div><span>ГОТОВЫЙ ПРОМПТ</span><button onClick={() => navigator.clipboard?.writeText(code)}>Скопировать</button></div><pre>{code}</pre></div>);
      continue;
    }
    if (value.startsWith("## ")) { nodes.push(<h4 key={index}>{plainText(value)}</h4>); continue; }
    if (value.startsWith("### ")) { nodes.push(<h5 key={index}>{plainText(value)}</h5>); continue; }

    const lines = value.split("\n");
    const isList = lines.every((line) => /^[-*]\s/.test(line) || /^\d+[.)]\s/.test(line) || /^- \[[ x]\]/.test(line));
    if (isList) {
      const checklist = lines.some((line) => /^- \[[ x]\]/.test(line));
      nodes.push(<ul className={checklist ? "check-list" : ""} key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}><InlineText value={line.replace(/^[-*]\s|^\d+[.)]\s|^- \[[ x]\]\s?/, "")} /></li>)}</ul>);
      continue;
    }

    const callout = /^\*\*(Результат|Главное|Важно|Можно|Альтернатива|Самый простой|Никогда)/i.test(value) || value.includes("⚠️");
    nodes.push(
      <p className={callout ? "article-callout" : index === 0 ? "article-lead" : ""} key={index}>
        {lines.map((line, lineIndex) => <span key={lineIndex}><InlineText value={line} />{lineIndex < lines.length - 1 && <br />}</span>)}
      </p>
    );
  }

  return (
    <article className="lesson-article">{nodes}</article>
  );
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

export default function Home() {
  const [firstName, setFirstName] = useState("Наталья");
  const [hasAccess, setHasAccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);
  const [activePreview, setActivePreview] = useState<Module | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeResource, setActiveResource] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<"home" | "learning">("home");
  const lessonSheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const telegram = (window as typeof window & {
      Telegram?: { WebApp?: { ready?: () => void; expand?: () => void; initData?: string; initDataUnsafe?: { user?: { first_name?: string } } } };
    }).Telegram?.WebApp;
    telegram?.ready?.();
    telegram?.expand?.();
    const telegramName = telegram?.initDataUnsafe?.user?.first_name;
    if (telegramName) setFirstName(telegramName);

    // Доступ к модулям 1-5 проверяем на сервере по подписи initData — см.
    // app/api/access и app/lib/access.ts. Без initData (например, открыли
    // страницу не из Telegram) доступ считается закрытым — кроме прохода
    // автора через ?key= (см. ниже).
    const initData = telegram?.initData;

    // Проход для автора: разовая ссылка вида ?key=СЕКРЕТ один раз сохраняет
    // ключ в этом браузере, дальше подписка не нужна. Сверяется на сервере
    // с OWNER_ACCESS_KEY (см. app/api/access/route.ts и .env.example).
    const OWNER_KEY_STORAGE = "acs_owner_key";
    const urlKey = new URLSearchParams(window.location.search).get("key");
    if (urlKey) {
      window.localStorage.setItem(OWNER_KEY_STORAGE, urlKey);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const ownerKey = urlKey || window.localStorage.getItem(OWNER_KEY_STORAGE) || undefined;

    if (!initData && !ownerKey) return;
    fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData, ownerKey }) })
      .then((response) => (response.ok ? response.json() : { active: false }))
      .then((data) => setHasAccess(Boolean(data.active)))
      .catch(() => setHasAccess(false));
  }, []);

  useEffect(() => {
    if (!activeLesson && !activeResource) return;
    requestAnimationFrame(() => lessonSheetRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, [activeLesson?.id, activeResource?.id]);

  const isLocked = (module: Module) => module.id !== FREE_MODULE_ID && !hasAccess;

  const activeLessonIndex = activeModule && activeLesson ? activeModule.lessons.findIndex((item) => item.id === activeLesson.id) : -1;
  const nextLesson = activeModule && activeLessonIndex >= 0 ? activeModule.lessons[activeLessonIndex + 1] : undefined;
  const resources = useMemo(() => toLessons(resourceContent), []);
  const courseLessonLinks = useMemo(() => [
    ...modules.flatMap((module) => module.lessons.map(({ id, title, sourceUrl }) => ({ id, title, sourceUrl }))),
    ...resources.map(({ id, title, sourceUrl }) => ({ id, title, sourceUrl })),
  ], [resources]);

  // Каждый модуль сначала открывает бесплатную страницу-обзор (боли аудитории,
  // кому подходит, что внутри, бесплатная полезность) — см. app/components/
  // ModulePreview.tsx и student-path-plan.md, версии 79-81. Только кнопка
  // «Начать модуль N» на этой странице ведёт дальше — к урокам (модуль 0)
  // или к экрану подписки (модули 1-5), если доступа ещё нет.
  const openPreview = (module: Module) => { setActivePreview(module); };
  const closePreview = () => { setActivePreview(null); };
  const startModule = (module: Module) => {
    setActivePreview(null);
    if (isLocked(module)) { setShowPaywall(true); return; }
    setActiveModule(module); setActiveLesson(null); setActiveResource(null);
  };
  const openLessonById = (lessonId: string) => {
    const resource = resources.find((item) => item.id === lessonId);
    if (resource) { setActiveResource(resource); return; }
    const targetModule = modules.find((module) => module.lessons.some((lesson) => lesson.id === lessonId));
    const targetLesson = targetModule?.lessons.find((lesson) => lesson.id === lessonId);
    if (targetModule && isLocked(targetModule)) { setShowPaywall(true); return; }
    if (targetModule && targetLesson) { setActiveModule(targetModule); setActiveLesson(targetLesson); setActiveResource(null); }
  };
  const closeModule = () => { setActiveModule(null); setActiveLesson(null); setActiveResource(null); };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="app-frame">
        <header className="topbar">
          <div className="brand-pill"><BrandMark /><span>AI CONTENT STUDIA</span></div>
          <button className="avatar" aria-label="Профиль">НК</button>
        </header>

        {tab === "home" ? <>
          <section className="welcome"><p>ДОБРО ПОЖАЛОВАТЬ</p><h1>Привет, {firstName}</h1></section>
          <section className="hero-card">
            <div className="hero-copy">
              <span className="hero-label">ВАША AI-КОМАНДА</span>
              <h2>От идеи до готового контента в одной системе</h2>
              <p>Начните с настройки студии и двигайтесь по модулям в своём темпе.</p>
              <button onClick={() => openPreview(modules[0])}>Начать обучение <span>→</span></button>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="orbit orbit-a"><span>AI</span></div>
              <div className="orbit orbit-b"><span>✦</span></div>
              <div className="core">N</div>
              <span className="floating-chip chip-one">Reels</span>
              <span className="floating-chip chip-two">Контент</span>
              <span className="floating-chip chip-three">Продажи</span>
            </div>
          </section>
          <section className="quick-stats" aria-label="Кратко о курсе">
            <div><strong>{modules.length}</strong><span>модулей в программе</span></div>
            <div><strong>{modules.reduce((sum, item) => sum + item.lessons.length, 0)}</strong><span>материалов</span></div>
            <div><strong>1</strong><span>готовая система</span></div>
          </section>
          <div className="value-carousel" aria-hidden="true">
            {valuePropSlides.map((text) => <div className="slide" key={text}>{text}</div>)}
          </div>
          <section className="packages-section">
            <div className="packages-title"><div><p>КАК ЭТО УСТРОЕНО</p><h2>Начните бесплатно с Модуля 0</h2></div></div>
            <p className="store-fineprint">Модуль 0 — настройка сервисов и первый рабочий агент — открыт для всех бесплатно, без подписки. Модули 1–5 открываются по подписке, когда вы решите продолжить.</p>
            <div className="personal-service"><span>ЛИЧНОЕ ВНЕДРЕНИЕ</span><p>Дополнительная услуга: вместе собираем систему под ваш проект и доводим её до рабочего результата.</p><button onClick={() => setShowImplementation(true)}>Узнать подробнее</button></div>
          </section>
          <section className="catalog-head">
            <div><p>ПРОГРАММА</p><h2>Что внутри</h2></div><span>{modules.length}</span>
          </section>
          <div className="store-modules">
            {modules.map((module) => (
              <button className="store-module" key={module.id} onClick={() => openPreview(module)}>
                <span className={`ic ${module.tone}`}>{moduleIcons[module.id]}</span>
                <span className="body"><b>{module.eyebrow} · {module.title}</b><span>{module.description}</span></span>
                <span className="arrow">›</span>
              </button>
            ))}
          </div>
          <div className="closing-cta">
            <h3>Хватит откладывать свой контент-завод</h3>
            <p>Модуль 0 открыт для всех бесплатно — установите рабочего агента и проверьте его на реальной задаче уже сегодня, а дальше решите, продолжать ли по подписке.</p>
            <button onClick={() => openPreview(modules[0])}>Начать обучение <span>→</span></button>
          </div>
        </> : (
          <section className="learning-page">
            <p className="section-kicker">МОЁ ОБУЧЕНИЕ</p><h1>Продолжить обучение</h1>
            <div className="progress-card">
              <div className="progress-top"><span>Вся программа</span><strong>0%</strong></div>
              <div className="progress-track"><i /></div>
              <p>После подключения доступа здесь появится ваш реальный прогресс.</p>
            </div>
            <h2>Ваш маршрут</h2>
            <div className="route-list">
              {modules.map((module, index) => (
                <button key={module.id} onClick={() => openPreview(module)}>
                  <span className={`route-index ${module.tone}`}>{isLocked(module) ? "🔒" : index + 1}</span>
                  <span><strong>{module.title}</strong><small>{isLocked(module) ? "По подписке" : module.duration}</small></span><b>›</b>
                </button>
              ))}
            </div>
          </section>
        )}

        <nav className="bottom-nav" aria-label="Главное меню">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}><span className="nav-icon">⌂</span><span>Главная</span></button>
          <button className={tab === "learning" ? "active" : ""} onClick={() => setTab("learning")}><span className="nav-icon">◉</span><span>Обучение</span></button>
        </nav>
      </div>

      {activePreview && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={closePreview}>
          <section className="lesson-sheet" role="dialog" aria-modal="true" aria-label={`${activePreview.title} — обзор`} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            {modulePreviews[activePreview.id] && (
              <ModulePreview
                content={modulePreviews[activePreview.id]}
                onStart={() => startModule(activePreview)}
                onClose={closePreview}
              />
            )}
          </section>
        </div>
      )}

      {activeModule && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={closeModule}>
          <section ref={lessonSheetRef} className="lesson-sheet" role="dialog" aria-modal="true" aria-label={activeModule.title} onMouseDown={(event) => event.stopPropagation()}>
            {!activeLesson && <div className="sheet-handle" />}
            {!activeLesson && <header className={`sheet-hero ${activeModule.tone}`}>
              <button className="close-button" onClick={closeModule} aria-label="Закрыть">×</button>
              <span className="sheet-eyebrow">{activeModule.eyebrow} · {activeModule.category}</span>
              <h2>{activeModule.title}</h2><p>{activeModule.description}</p>
              <div className="sheet-result"><span>Результат</span>{activeModule.result}</div>
            </header>}
            {activeLesson ? (
              <div className="lesson-view">
                <div className="lesson-screen-head"><button className="back-link" onClick={() => activeResource ? setActiveResource(null) : setActiveLesson(null)}>{activeResource ? "‹ К уроку" : "‹ Все уроки"}</button><button className="lesson-close" onClick={closeModule} aria-label="Закрыть">×</button></div>
                {!activeResource && activeLesson.id !== subscriptionLessonId && activeLesson.id !== installLessonId && (lessonVideos[activeLesson.id]
                  ? <div className="lesson-video"><iframe src={lessonVideos[activeLesson.id]} title={`Видео: ${activeLesson.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
                  : <div className="video-placeholder"><div className="play-button">▶</div><span>Здесь будет видео урока</span><small>Видео появится здесь после добавления ссылки YouTube</small></div>)}
                {(activeResource || activeLesson.id !== subscriptionLessonId) && <p className="lesson-label">{activeResource ? "МАТЕРИАЛ" : "УРОК"}</p>}<h3>{(activeResource || activeLesson).title}</h3><p className="lesson-note">{(activeResource || activeLesson).note}</p>
                {!activeResource && activeLesson.id === subscriptionLessonId
                  ? <SubscriptionLesson />
                  : (activeResource || activeLesson).content && <RichLessonArticle lessonId={(activeResource || activeLesson).id} title={(activeResource || activeLesson).title} content={(activeResource || activeLesson).content!.replace(/\n## Дополнительный материал для пользователей из России\s*\n?/g, "\n")} courseLessons={courseLessonLinks} onOpenLesson={openLessonById} />}
                {activeResource ? <footer className="lesson-footer resource-footer">
                  <button className="complete-button" onClick={() => setActiveResource(null)}>Вернуться к уроку</button>
                </footer> : <footer className="lesson-footer">
                  <div><strong>Урок {activeLessonIndex + 1} из {activeModule.lessons.length}</strong><span>{activeModule.eyebrow} · {activeModule.title}</span></div>
                  <button className="all-lessons-button" onClick={() => setActiveLesson(null)}>Все уроки</button>
                  <button className="complete-button" onClick={() => { setActiveResource(null); nextLesson ? setActiveLesson(nextLesson) : setActiveLesson(null); }}>
                    {nextLesson ? `Дальше: ${plainText(nextLesson.title).replace(/^Урок\s*[\w.]+\s*/i, "")}` : "Завершить модуль"}
                  </button>
                </footer>}
              </div>
            ) : (
              <div className="lesson-list">
                <div className="lesson-list-head"><h3>Уроки модуля</h3><span>{activeModule.lessons.length}</span></div>
                {activeModule.lessons.map((lesson, index) => (
                  <button key={lesson.title} onClick={() => setActiveLesson(lesson)}>
                    <span className="lesson-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="lesson-copy"><strong>{lesson.title}</strong><small>{lesson.note}</small></span><span className="lesson-arrow">›</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showImplementation && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setShowImplementation(false)}>
          <section className="lesson-sheet" role="dialog" aria-modal="true" aria-label="Личное внедрение" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <ImplementationPage onClose={() => setShowImplementation(false)} />
          </section>
        </div>
      )}

      {showPaywall && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setShowPaywall(false)}>
          <section className="lesson-sheet paywall-sheet" role="dialog" aria-modal="true" aria-label="Подписка" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="paywall-body">
              <button className="close-button" onClick={() => setShowPaywall(false)} aria-label="Закрыть">×</button>
              <p className="section-kicker">Модуль 0 — ваш навсегда. Дальше — по подписке</p>
              <h2 className="paywall-title">Откройте все модули студии</h2>
              <p className="paywall-sub">Агенты и файлы, которые вы настроите на уроках, остаются у вас навсегда — даже если подписка закончится.</p>
              <div className="payment-warning">
                <span>!</span>
                <div>
                  <small>ЧЕСТНО О ЦЕНЕ</small>
                  <h4>Сейчас курс в открытом тестировании</h4>
                  <p>Цена ниже реальной ценности продукта. По мере роста курса стоимость подписки тоже будет расти. Оформив подписку сейчас, вы фиксируете сегодняшнюю цену на всё время, пока она у вас активна.</p>
                </div>
              </div>
              <div className="paywall-options">
                <div className="paywall-option">
                  <div className="top-row"><span className="label">1 месяц</span><span className="price">3 900 ₽<span> /мес</span></span></div>
                  <p className="note">Доступ на 30 дней с момента оплаты. Захотите продолжить — оформите ещё раз.</p>
                  <a
                    className="paywall-cta"
                    href={TRIBUTE_LINK_1M || undefined}
                    target="_blank" rel="noreferrer"
                    aria-disabled={!TRIBUTE_LINK_1M}
                    onClick={(event) => { if (!TRIBUTE_LINK_1M) event.preventDefault(); }}
                  >
                    {TRIBUTE_LINK_1M ? "Оформить за 3 900 ₽" : "Скоро откроем оплату"}
                  </a>
                </div>
                <div className="paywall-option highlight">
                  <span className="badge">Экономия 1 800 ₽</span>
                  <div className="top-row"><span className="label">3 месяца сразу</span><span className="price">9 900 ₽<span> за 3 мес.</span></span></div>
                  <p className="note">Фиксирует сегодняшнюю цену на 3 месяца вперёд, даже если стоимость подписки успеет вырасти.</p>
                  <a
                    className="paywall-cta"
                    href={TRIBUTE_LINK_3M || undefined}
                    target="_blank" rel="noreferrer"
                    aria-disabled={!TRIBUTE_LINK_3M}
                    onClick={(event) => { if (!TRIBUTE_LINK_3M) event.preventDefault(); }}
                  >
                    {TRIBUTE_LINK_3M ? "Оформить за 9 900 ₽" : "Скоро откроем оплату"}
                  </a>
                </div>
              </div>
              <p className="store-fineprint">Оплата проходит через Tribute. После оплаты доступ откроется автоматически в течение минуты — если модуль всё ещё закрыт, откройте студию заново.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
