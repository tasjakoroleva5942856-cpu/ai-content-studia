"use client";

const apps = [
  {
    name: "Claude",
    icon: "https://claude.ai/favicon.ico",
    tone: "orange",
    price: "Free / Pro около $20",
    when: "Основной инструмент",
    description: "Проекты, агенты, работа с инструкциями и файлами.",
    url: "https://claude.ai",
  },
  {
    name: "ChatGPT",
    icon: "https://chatgpt.com/favicon.ico",
    tone: "green",
    price: "Free / Plus около $20",
    when: "Основной инструмент",
    description: "Тексты, документы, изображения, визуальный контент и Codex.",
    url: "https://chatgpt.com",
  },
  {
    name: "Google Drive",
    icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    tone: "yellow",
    price: "Можно бесплатно",
    when: "Нужен сразу",
    description: "Хранение базы знаний, видео, исходников и готовых материалов.",
    url: "https://drive.google.com",
  },
  {
    name: "Apify",
    icon: "https://apify.com/favicon.ico",
    tone: "blue",
    price: "Free / от $29",
    when: "Подключается позже",
    description: "Сбор открытых данных, конкурентов, отзывов и материалов для анализа.",
    url: "https://apify.com",
  },
  {
    name: "PostMyPost",
    icon: "https://postmypost.io/favicon.ico",
    tone: "purple",
    price: "Ориентир от $19.49",
    when: "Перед публикацией",
    description: "Планирование, публикация и аналитика контента.",
    url: "https://postmypost.io",
  },
  {
    name: "HeyGen",
    icon: "https://www.heygen.com/favicon.ico",
    tone: "pink",
    price: "Ориентир около $29",
    when: "Только для AI-аватара",
    description: "Создание цифрового двойника и видео с аватаром.",
    url: "https://www.heygen.com",
  },
  {
    name: "ElevenLabs",
    icon: "https://elevenlabs.io/favicon.ico",
    tone: "black",
    price: "Ориентир от $6",
    when: "По желанию",
    description: "Клонирование голоса и качественная озвучка.",
    url: "https://elevenlabs.io",
  },
];

function AppLogo({ src, name, tone }: { src: string; name: string; tone: string }) {
  return (
    <span className={`app-logo ${tone}`} aria-hidden="true">
      <b>{name.slice(0, 1)}</b>
      <img src={src} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
    </span>
  );
}

export default function SubscriptionLesson() {
  return (
    <article className="structured-lesson start-tools-lesson">
      <section className="lesson-section lesson-intro">
        <p className="section-overline">ПЕРЕД НАЧАЛОМ</p>
        <h4>Что понадобится для работы</h4>
        <p>В студии мы будем создавать контент от идеи до публикации. Ниже указано, для какой задачи нужен каждый инструмент и какие расходы стоит предусмотреть.</p>
      </section>

      <section className="lesson-section">
        <div className="section-heading">
          <div><p>ИНСТРУМЕНТЫ</p><h4>Сервисы и стоимость</h4></div>
          <span>7 сервисов</span>
        </div>
        <p className="section-caption">Цены указаны как ориентир и могут отличаться в зависимости от страны, тарифа и способа оплаты.</p>
        <div className="apps-grid">
          {apps.map((app) => (
            <a className="app-card app-card-link" href={app.url} target="_blank" rel="noreferrer" key={app.name}>
              <div className="app-card-top"><AppLogo src={app.icon} name={app.name} tone={app.tone} /><span className="app-price">{app.price}</span></div>
              <h5>{app.name}</h5>
              <span className="app-when">{app.when}</span>
              <p>{app.description}</p>
              <span className="app-open-link">Перейти на сайт →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="start-cost-card">
        <p>МИНИМАЛЬНЫЙ НАБОР</p>
        <h4>Начать можно бесплатно</h4>
        <div className="start-cost-grid">
          <div><strong>$0</strong><span>Знакомство с Claude, ChatGPT и Google Drive на бесплатных тарифах</span></div>
          <div><strong>около $20</strong><span>Один платный основной инструмент для регулярной работы</span></div>
          <div><strong>около $40</strong><span>Платные Claude и ChatGPT, если хотите использовать возможности обоих</span></div>
        </div>
        <small>Apify, PostMyPost, HeyGen и ElevenLabs подключаются позже под конкретные задачи.</small>
      </section>
    </article>
  );
}
