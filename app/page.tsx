"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SubscriptionLesson from "./components/SubscriptionLesson";
import RichLessonArticle from "./components/RichLessonArticle";
import { module0Content, type CourseLessonContent } from "./content/module-0";
import { module1Content } from "./content/module-1";
import { module2Content } from "./content/module-2";
import { module3Content } from "./content/module-3";
import { module4Content } from "./content/module-4";
import { module5Content } from "./content/module-5";
import { resourceContent } from "./content/resources";

type Lesson = { id: string; title: string; note?: string; content?: string; sourceUrl?: string };
type Module = {
  id: number; category: string; eyebrow: string; title: string;
  description: string; result: string; icon: string; tone: string;
  duration: string; packages: Array<"flagship" | "content" | "marketing">; lessons: Lesson[];
};

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
  const line = content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`]/g, "")
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 35) || "";

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
    packages: ["flagship", "content", "marketing"], lessons: toLessons(module0Content),
  },
  {
    id: 1, category: "Маркетинг", eyebrow: "Модуль 1", title: "Фундамент бизнеса",
    description: "Собираем базу, благодаря которой агенты понимают вас, продукт и аудиторию.",
    result: "Готова база знаний бренда", icon: "◎", tone: "violet", duration: "4 блока",
    packages: ["flagship", "marketing"], lessons: toLessons(module1Content),
  },
  {
    id: 2, category: "Контент", eyebrow: "Модуль 2", title: "Контент-команда",
    description: "Создаём агентов с отдельными ролями и превращаем одну тему в несколько форматов.",
    result: "Тема превращается в контент-связку", icon: "✦", tone: "coral", duration: "5 уроков",
    packages: ["flagship", "content"], lessons: toLessons(module2Content),
  },
  {
    id: 3, category: "Reels", eyebrow: "Модуль 3", title: "Создание Reels",
    description: "Своё видео, ИИ-аватар, Captions или собственная нейромонтажная студия.",
    result: "Первый готовый Reels", icon: "▶", tone: "lime", duration: "9 уроков",
    packages: ["flagship", "content"], lessons: toLessons(module3Content),
  },
  {
    id: 4, category: "Маркетинг", eyebrow: "Модуль 4", title: "Контент, который продаёт",
    description: "Связываем упаковку, лид-магнит, прогрев и продукт в одну понятную систему.",
    result: "Контент ведёт к продукту", icon: "◇", tone: "peach", duration: "6 уроков",
    packages: ["flagship", "marketing"], lessons: toLessons(module4Content),
  },
  {
    id: 5, category: "Масштаб", eyebrow: "Модуль 5", title: "Масштабирование",
    description: "Адаптируем одну сильную тему под новые площадки без увеличения хаоса.",
    result: "Одна тема работает везде", icon: "↟", tone: "blue", duration: "7 уроков",
    packages: ["flagship", "content"], lessons: toLessons(module5Content),
  },
  {
    id: 6, category: "Реалити", eyebrow: "Модуль 6", title: "Реалити: как устроено у меня",
    description: "Показываю, как всё устроено в моём блоге — как ориентир, а не пошаговая инструкция.",
    result: "Система проверена на практике", icon: "●", tone: "pink", duration: "6 этапов",
    packages: ["flagship", "marketing"],
    lessons: [
      { id: "reality-1", title: "Фундамент бизнеса и точка А", note: "Стратегия на реальном проекте", content: "## Что вы увидите\nКак я фиксирую текущую точку, цель, продукт и основную гипотезу продвижения. После выпуска вы повторяете этот этап на своём проекте и сохраняете свою точку А." },
      { id: "reality-2", title: "Сборка контент-команды", note: "Каких агентов создаю первой", content: "## Что вы увидите\nКак я выбираю первые роли в AI-команде, какие знания передаю агентам и как проверяю, что они понимают мой продукт и стиль." },
      { id: "reality-3", title: "Форматы и нейропроизводство", note: "Как выбираю рабочую связку", content: "## Что вы увидите\nКак я выбираю формат блога, готовлю исходники и связываю сценарий, визуал и монтаж в один понятный процесс." },
      { id: "reality-4", title: "Контент-пайплайн и тест гипотез", note: "Что проверяю до масштабирования", content: "## Что вы увидите\nКак одна идея проходит путь до публикации, что я проверяю на первых материалах и какие выводы сохраняю для следующей серии." },
      { id: "reality-5", title: "Упаковка, прогрев и воронка", note: "Как контент приводит к продукту", content: "## Что вы увидите\nКак я связываю публикацию, целевое действие, лид-магнит и продукт, чтобы контент приводил человека к следующему шагу." },
      { id: "reality-6", title: "Масштабирование и корректировка", note: "Что меняю после первых данных", content: "## Что вы увидите\nКак я анализирую результаты, выбираю дополнительную площадку и меняю систему после реального теста, а не по ощущениям." },
    ],
  },
];

const filters = ["Все", "Старт", "Контент", "Reels", "Маркетинг", "Масштаб", "Реалити"];

const packages = [
  { id: "flagship" as const, label: "Флагман", title: "Вся AI CONTENT STUDIA", description: "Все модули, маркетинг, контент, монтаж, масштабирование и реалити.", mark: "FULL" },
  { id: "content" as const, label: "AI-контент", title: "Контент-команда + нейромонтаж", description: "Агенты для контента, создание Reels и масштабирование на новые площадки.", mark: "CREATE" },
  { id: "marketing" as const, label: "Маркетинг", title: "Система продаж через контент", description: "Стратегия, упаковка, продуктовая линейка, лид-магниты, воронки и реалити.", mark: "SYSTEM" },
];

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
  const [filter, setFilter] = useState("Все");
  const [packageFilter, setPackageFilter] = useState<"flagship" | "content" | "marketing">("flagship");
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeResource, setActiveResource] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<"home" | "learning">("home");
  const lessonSheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const telegram = (window as typeof window & {
      Telegram?: { WebApp?: { ready?: () => void; expand?: () => void; initDataUnsafe?: { user?: { first_name?: string } } } };
    }).Telegram?.WebApp;
    telegram?.ready?.();
    telegram?.expand?.();
    const telegramName = telegram?.initDataUnsafe?.user?.first_name;
    if (telegramName) setFirstName(telegramName);
  }, []);

  useEffect(() => {
    if (!activeLesson && !activeResource) return;
    requestAnimationFrame(() => lessonSheetRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, [activeLesson?.id, activeResource?.id]);

  const visibleModules = useMemo(
    () => modules.filter((item) => item.packages.includes(packageFilter) && (filter === "Все" || item.category === filter)),
    [filter, packageFilter]
  );
  const activePackage = packages.find((item) => item.id === packageFilter)!;
  const activeLessonIndex = activeModule && activeLesson ? activeModule.lessons.findIndex((item) => item.id === activeLesson.id) : -1;
  const nextLesson = activeModule && activeLessonIndex >= 0 ? activeModule.lessons[activeLessonIndex + 1] : undefined;
  const resources = useMemo(() => toLessons(resourceContent), []);
  const courseLessonLinks = useMemo(() => [
    ...modules.flatMap((module) => module.lessons.map(({ id, title, sourceUrl }) => ({ id, title, sourceUrl }))),
    ...resources.map(({ id, title, sourceUrl }) => ({ id, title, sourceUrl })),
  ], [resources]);

  const openModule = (module: Module) => { setActiveModule(module); setActiveLesson(null); setActiveResource(null); };
  const openLessonById = (lessonId: string) => {
    const resource = resources.find((item) => item.id === lessonId);
    if (resource) { setActiveResource(resource); return; }
    const targetModule = modules.find((module) => module.lessons.some((lesson) => lesson.id === lessonId));
    const targetLesson = targetModule?.lessons.find((lesson) => lesson.id === lessonId);
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
              <button onClick={() => openModule(modules[0])}>Начать обучение <span>→</span></button>
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
            <div><strong>{modules.filter((item) => item.packages.includes(packageFilter)).length}</strong><span>модулей в пакете</span></div>
            <div><strong>{modules.filter((item) => item.packages.includes(packageFilter)).reduce((sum, item) => sum + item.lessons.length, 0)}</strong><span>материалов</span></div>
            <div><strong>1</strong><span>готовая система</span></div>
          </section>
          <section className="packages-section">
            <div className="packages-title"><div><p>ВЫБЕРИТЕ ПРОГРАММУ</p><h2>Пакеты обучения</h2></div><span>ДЕМО</span></div>
            <div className="package-switcher">
              {packages.map((item) => (
                <button
                  key={item.id}
                  className={packageFilter === item.id ? "active" : ""}
                  onClick={() => { setPackageFilter(item.id); setFilter("Все"); }}
                >
                  <small>{item.mark}</small><strong>{item.label}</strong><span>{item.title}</span>
                </button>
              ))}
            </div>
            <div className="package-summary"><span>✓</span><div><strong>{activePackage.title}</strong><small>{activePackage.description}</small></div></div>
            <div className="personal-service"><span>ЛИЧНОЕ ВНЕДРЕНИЕ</span><p>Дополнительная услуга: вместе собираем систему под ваш проект и доводим её до рабочего результата.</p><button>Узнать подробнее</button></div>
          </section>
          <nav className="filters" aria-label="Фильтр модулей">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </nav>
          <section className="catalog-head">
            <div><p>ПРОГРАММА</p><h2>{filter === "Все" ? "Все модули" : filter}</h2></div><span>{visibleModules.length}</span>
          </section>
          <section className="module-grid">
            {visibleModules.map((module) => (
              <button className={`module-card ${module.tone}`} key={module.id} onClick={() => openModule(module)}>
                <div className="module-art"><span className="module-icon">{module.icon}</span><span className="module-number">0{module.id}</span></div>
                <div className="module-content">
                  <div className="module-meta"><span>{module.eyebrow}</span><span>{module.duration}</span></div>
                  <h3>{module.title}</h3><p>{module.description}</p>
                  <div className="module-result"><span>✓</span>{module.result}</div>
                </div>
              </button>
            ))}
          </section>
        </> : (
          <section className="learning-page">
            <p className="section-kicker">МОЁ ОБУЧЕНИЕ</p><h1>Продолжить обучение</h1>
            <div className="progress-card">
              <div className="progress-top"><span>{activePackage.label}</span><strong>0%</strong></div>
              <div className="progress-track"><i /></div>
              <p>После подключения доступа здесь появится ваш реальный прогресс.</p>
            </div>
            <h2>Ваш маршрут</h2>
            <div className="route-list">
              {modules.filter((module) => module.packages.includes(packageFilter)).map((module, index) => (
                <button key={module.id} onClick={() => openModule(module)}>
                  <span className={`route-index ${module.tone}`}>{index + 1}</span>
                  <span><strong>{module.title}</strong><small>{module.duration}</small></span><b>›</b>
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
    </main>
  );
}
