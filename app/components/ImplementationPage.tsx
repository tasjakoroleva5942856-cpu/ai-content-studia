"use client";

// Открытая страница про услугу «Личное внедрение» — платное сопровождение
// поверх курса. Цена на странице сознательно не указывается: она называется
// после брифа, в личной переписке (см. обсуждение с Натали). Кнопка внизу
// ведёт в личный Telegram, а не на оплату — заявок пока без формы на сайте.

const TELEGRAM_LINK = "https://t.me/natali_krown";

export default function ImplementationPage({ onClose }: { onClose: () => void }) {
  return (
    <div className="module-preview">
      <div className="crumb">
        <span className="crumb-text">Дополнительная услуга</span>
        <button className="lesson-close" onClick={onClose} aria-label="Закрыть">×</button>
      </div>

      <h1 className="lesson-title">Соберём вашу систему контента вместе</h1>
      <p className="lesson-sub">
        Курс даёт вам инструменты и уроки, чтобы собрать систему самостоятельно.
        Личное внедрение — для тех, кто хочет пройти этот путь не в одиночку:
        я лично помогаю настроить агентов и довести систему до рабочего
        результата на вашем реальном проекте.
      </p>

      <div className="section">
        <div className="section-head"><span className="num">01</span><h2>Кому подходит</h2></div>
        <div className="info-rows">
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">1</span><b>Нет времени разбираться самому</b></span></div>
            <div className="sub">Вы понимаете ценность ИИ-агентов, но не хотите тратить недели на настройку методом проб и ошибок.</div>
          </div>
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">2</span><b>Уже пробовали и застряли</b></span></div>
            <div className="sub">Прошли часть уроков или пробовали сами, но система не заработала на вашем конкретном продукте.</div>
          </div>
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">3</span><b>Нужен результат, а не только знания</b></span></div>
            <div className="sub">Важно не «пройти курс», а получить работающую систему контента к конкретному сроку.</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">02</span><h2>Что входит</h2></div>
        <div className="scenario-grid">
          <div className="item"><span className="ic">◎</span>Разбор вашего продукта и аудитории — база знаний собирается под ваш реальный бизнес, а не абстрактный пример.</div>
          <div className="item"><span className="ic">🤖</span>Настройка агентов вместе — от первого промпта до рабочей связки, которая создаёт контент в вашем голосе.</div>
          <div className="item"><span className="ic">🎬</span>Первая серия готового контента — доводим систему до реального результата: опубликованных материалов, а не только настроек.</div>
          <div className="item"><span className="ic">💬</span>Сопровождение в переписке — вопросы и правки по ходу настройки, без ожидания следующего урока.</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">03</span><h2>Как проходит</h2></div>
        <div className="info-rows">
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">1</span><b>Бриф</b></span></div>
            <div className="sub">Рассказываете о продукте, аудитории и цели — на основе этого я оцениваю объём работы и называю цену.</div>
          </div>
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">2</span><b>Настройка</b></span></div>
            <div className="sub">Собираем базу знаний и агентов под ваш проект, шаг за шагом, с проверкой на реальных задачах.</div>
          </div>
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">3</span><b>Первый результат</b></span></div>
            <div className="sub">Доводим до готового контента — вы видите, что система реально работает, не только в теории.</div>
          </div>
          <div className="row">
            <div className="head"><span className="name"><span className="dot-ic">4</span><b>Передача</b></span></div>
            <div className="sub">Система остаётся у вас — вы понимаете, как ей пользоваться и развивать дальше самостоятельно.</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="callout accent-callout">
          <span className="ic">💬</span>
          <div>Цена зависит от вашего продукта и объёма работы — назову её после брифа, в личной переписке. Ничего не покупается на этой странице.</div>
        </div>
      </div>

      <div className="nextbar">
        <a href={TELEGRAM_LINK} target="_blank" rel="noreferrer" className="nextbar-link">
          Написать в Telegram <span>→</span>
        </a>
        <small>Обсудим ваш проект и я отвечу на вопросы перед стартом</small>
      </div>
    </div>
  );
}
