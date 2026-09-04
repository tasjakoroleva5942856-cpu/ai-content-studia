"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RichLessonArticle from "./components/RichLessonArticle";
import ModulePreview from "./components/ModulePreview";
import ImplementationPage from "./components/ImplementationPage";
import { lessonMetaByModule, resourceMeta } from "./content/lessonMeta";
import { modulePreviews } from "./content/modulePreviews";

// ВАЖНО: полный текст уроков сюда больше не импортируется напрямую (раньше
// это был реальный баг — весь платный курс уходил в публичный JS-бандл и
// читался без подписки). lessonMetaByModule/resourceMeta несут только
// заголовок и короткую сводку; сам текст урока запрашивается с сервера
// (/api/lesson-content) в момент открытия конкретного урока — см. эффект
// ниже, который следит за activeLesson/activeResource.
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

const installLessonId = "3c6b382816718159b68ccd9fbfbad560";
const lessonVideos: Record<string, string> = {};

const modules: Module[] = [
  {
    id: 0, category: "Старт", eyebrow: "Модуль 0", title: "Вход в студию",
    description: "Настраиваем сервисы, папки и первый рабочий проект без технической путаницы.",
    result: "Инструменты готовы к работе", icon: "↗", tone: "sky", duration: "5 уроков",
    lessons: lessonMetaByModule[0],
  },
  {
    id: 1, category: "Маркетинг", eyebrow: "Модуль 1", title: "Фундамент бизнеса",
    description: "Собираем базу, благодаря которой агенты понимают вас, продукт и аудиторию.",
    result: "Готова база знаний бренда", icon: "◎", tone: "violet", duration: "4 блока",
    lessons: lessonMetaByModule[1],
  },
  {
    id: 2, category: "Контент", eyebrow: "Модуль 2", title: "Контент-команда",
    description: "Создаём агентов с отдельными ролями и превращаем одну тему в несколько форматов.",
    result: "Тема превращается в контент-связку", icon: "✦", tone: "coral", duration: "5 уроков",
    lessons: lessonMetaByModule[2],
  },
  {
    id: 3, category: "Reels", eyebrow: "Модуль 3", title: "Создание Reels",
    description: "Своё видео, ИИ-аватар, Captions или собственная нейромонтажная студия.",
    result: "Первый готовый Reels", icon: "▶", tone: "lime", duration: "11 уроков",
    lessons: lessonMetaByModule[3],
  },
  {
    id: 4, category: "Маркетинг", eyebrow: "Модуль 4", title: "Контент, который продаёт",
    description: "Связываем упаковку, лид-магнит, прогрев и продукт в одну понятную систему.",
    result: "Контент ведёт к продукту", icon: "◇", tone: "peach", duration: "6 уроков",
    lessons: lessonMetaByModule[4],
  },
  {
    id: 5, category: "Масштаб", eyebrow: "Модуль 5", title: "Масштабирование",
    description: "Адаптируем одну сильную тему под новые площадки без увеличения хаоса.",
    result: "Одна тема работает везде", icon: "↟", tone: "blue", duration: "7 уроков",
    lessons: lessonMetaByModule[5],
  },
];

const moduleToneClass: Record<number, string> = { 0: "", 1: "mod1", 2: "mod2", 3: "mod3", 4: "mod4", 5: "mod5" };

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
// Один тариф в Tribute ("AI Content Studio — доступ") с двумя периодами —
// обе кнопки ведут на одну и ту же страницу, там пользователь сам выбирает
// период (1 или 3 месяца) перед оплатой.
const TRIBUTE_LINK = process.env.NEXT_PUBLIC_TRIBUTE_LINK || "";

function plainText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

// Проход для автора: разовая ссылка вида ?key=СЕКРЕТ один раз сохраняет ключ
// в этом браузере, дальше подписка не нужна. Сверяется на сервере с
// OWNER_ACCESS_KEY (см. app/api/access/route.ts, app/lib/resolveAccess.ts).
const OWNER_KEY_STORAGE = "acs_owner_key";

// Общий способ получить initData/ownerKey — используется и при первой
// проверке доступа, и при каждом запросе текста урока (см.
// /api/lesson-content). window.Telegram появляется синхронно, читать его
// можно в любой момент после монтирования.
function getAuthPayload(): { initData?: string; ownerKey?: string } {
  if (typeof window === "undefined") return {};
  const telegram = (window as typeof window & {
    Telegram?: { WebApp?: { initData?: string } };
  }).Telegram?.WebApp;
  const initData = telegram?.initData;
  const ownerKey = window.localStorage.getItem(OWNER_KEY_STORAGE) || undefined;
  return { initData, ownerKey };
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
  // activeContent — текст последнего успешно загруженного урока;
  // activeContentKey — id урока, которому он принадлежит. Раз эти два поля
  // обновляются только внутри колбэков fetch (не синхронно в теле эффекта),
  // "загрузка" ниже вычисляется, а не хранится отдельным состоянием — так
  // эффект не делает синхронных setState (см. react-hooks/set-state-in-effect).
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [activeContentKey, setActiveContentKey] = useState<string | null>(null);
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

    const urlKey = new URLSearchParams(window.location.search).get("key");
    if (urlKey) {
      window.localStorage.setItem(OWNER_KEY_STORAGE, urlKey);
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Доступ к модулям 1-5 проверяем на сервере по подписи initData — см.
    // app/api/access и app/lib/resolveAccess.ts. Без initData (например,
    // открыли страницу не из Telegram) и без ownerKey доступ считается
    // закрытым.
    const { initData, ownerKey } = getAuthPayload();
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

  // Текст урока больше не лежит в клиентском бандле (см. комментарий у
  // lessonMetaByModule выше) — запрашиваем его здесь, когда пользователь
  // открывает конкретный урок или материал. Сервер (app/api/lesson-content)
  // сам решает, отдавать текст или нет, по тому же принципу, что и /api/access.
  useEffect(() => {
    const target = activeResource || activeLesson;
    if (!target) return;
    let cancelled = false;
    const { initData, ownerKey } = getAuthPayload();
    fetch("/api/lesson-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: target.id, initData, ownerKey }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        setActiveContent(data?.content ?? null);
        setActiveContentKey(target.id);
      })
      .catch(() => {
        if (cancelled) return;
        setActiveContent(null);
        setActiveContentKey(target.id);
      });
    return () => { cancelled = true; };
  }, [activeLesson?.id, activeResource?.id]);

  const isLocked = (module: Module) => module.id !== FREE_MODULE_ID && !hasAccess;

  const activeLessonIndex = activeModule && activeLesson ? activeModule.lessons.findIndex((item) => item.id === activeLesson.id) : -1;
  const nextLesson = activeModule && activeLessonIndex >= 0 ? activeModule.lessons[activeLessonIndex + 1] : undefined;
  const resources = resourceMeta;
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
                {!activeResource && activeLesson.id !== installLessonId && (lessonVideos[activeLesson.id]
                  ? <div className="lesson-video"><iframe src={lessonVideos[activeLesson.id]} title={`Видео: ${activeLesson.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
                  : <div className="video-placeholder"><div className="play-button">▶</div><span>Здесь будет видео урока</span><small>Видео появится здесь после добавления ссылки YouTube</small></div>)}
                <p className="lesson-label">{activeResource ? "МАТЕРИАЛ" : "УРОК"}</p><h3>{(activeResource || activeLesson).title}</h3><p className="lesson-note">{(activeResource || activeLesson).note}</p>
                {activeContentKey !== (activeResource || activeLesson).id && <p className="lesson-note">Загружаем урок…</p>}
                {activeContentKey === (activeResource || activeLesson).id && activeContent && <RichLessonArticle lessonId={(activeResource || activeLesson).id} title={(activeResource || activeLesson).title} content={activeContent.replace(/\n## Дополнительный материал для пользователей из России\s*\n?/g, "\n")} courseLessons={courseLessonLinks} onOpenLesson={openLessonById} moduleId={activeModule.id} />}
                {activeResource ? <footer className="lesson-footer resource-footer">
                  <button className={`complete-button ${moduleToneClass[activeModule.id] || ""}`} onClick={() => setActiveResource(null)}>Вернуться к уроку</button>
                </footer> : <footer className="lesson-footer">
                  <div><strong>Урок {activeLessonIndex + 1} из {activeModule.lessons.length}</strong><span>{activeModule.eyebrow} · {activeModule.title}</span></div>
                  <button className="all-lessons-button" onClick={() => setActiveLesson(null)}>Все уроки</button>
                  <button className={`complete-button ${moduleToneClass[activeModule.id] || ""}`} onClick={() => { setActiveResource(null); nextLesson ? setActiveLesson(nextLesson) : setActiveLesson(null); }}>
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
                  <p className="note">Автоматически продлевается каждый месяц, пока вы не отмените подписку в настройках Tribute.</p>
                  <a
                    className="paywall-cta"
                    href={TRIBUTE_LINK || undefined}
                    target="_blank" rel="noreferrer"
                    aria-disabled={!TRIBUTE_LINK}
                    onClick={(event) => { if (!TRIBUTE_LINK) event.preventDefault(); }}
                  >
                    {TRIBUTE_LINK ? "Оформить за 3 900 ₽" : "Скоро откроем оплату"}
                  </a>
                </div>
                <div className="paywall-option highlight">
                  <span className="badge">Экономия 1 800 ₽</span>
                  <div className="top-row"><span className="label">3 месяца сразу</span><span className="price">9 900 ₽<span> за 3 мес.</span></span></div>
                  <p className="note">Фиксирует сегодняшнюю цену на 3 месяца вперёд, даже если стоимость подписки успеет вырасти.</p>
                  <a
                    className="paywall-cta"
                    href={TRIBUTE_LINK || undefined}
                    target="_blank" rel="noreferrer"
                    aria-disabled={!TRIBUTE_LINK}
                    onClick={(event) => { if (!TRIBUTE_LINK) event.preventDefault(); }}
                  >
                    {TRIBUTE_LINK ? "Оформить за 9 900 ₽" : "Скоро откроем оплату"}
                  </a>
                </div>
              </div>
              <p className="store-fineprint" style={{ marginTop: "-8px" }}>Обе кнопки открывают одну страницу оплаты — нужный период (1 или 3 месяца) выбирается уже там.</p>
              <p className="store-fineprint">Оплата проходит через Tribute. После оплаты доступ откроется автоматически в течение минуты — если модуль всё ещё закрыт, откройте студию заново.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
