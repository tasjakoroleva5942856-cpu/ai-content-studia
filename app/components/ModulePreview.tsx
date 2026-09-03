"use client";

import type { ModulePreviewContent } from "../content/modulePreviews";

// Открытая страница-продажа модуля — показывается всем без подписки, ПЕРЕД
// уроками модуля (см. student-path-plan.md, версии 79-81). Кнопка внизу либо
// сразу открывает уроки (Модуль 0, он бесплатный), либо запускает экран
// подписки (Модули 1-5) — решает вызывающий код через onStart.

const moduleToneClass: Record<number, string> = {
  0: "",
  1: "mod1",
  2: "mod2",
  3: "mod3",
  4: "mod4",
  5: "mod5",
};

export default function ModulePreview({
  content,
  onStart,
  onClose,
}: {
  content: ModulePreviewContent;
  onStart: () => void;
  onClose: () => void;
}) {
  const toneClass = moduleToneClass[content.moduleId] || "";

  return (
    <div className={`module-preview ${toneClass}`}>
      <div className="crumb">
        <span className="crumb-text">{content.crumb}</span>
        <button className="lesson-close" onClick={onClose} aria-label="Закрыть">×</button>
      </div>

      <h1 className="lesson-title">{content.title}</h1>
      <p className="lesson-sub">{content.sub}</p>

      {content.warningCallout && (
        <div className="callout amber">
          <span className="ic">⛔</span>
          <div>{content.warningCallout}</div>
        </div>
      )}

      <div className="section">
        <div className="section-head"><span className="num">{content.painsIcon}</span><h2>Узнаёте себя?</h2></div>
        <div className="scenario-grid">
          {content.pains.map((text, index) => (
            <div className="item" key={index}><span className="ic">❌</span>{text}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">01</span><h2>Кому подходит</h2></div>
        <div className="info-rows">
          {content.audience.map((row) => (
            <div className="row" key={row.name}>
              <div className="head"><span className="name"><span className="dot-ic">{row.icon}</span><b>{row.name}</b></span></div>
              <div className="sub">{row.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">02</span><h2>Что вы получите</h2></div>
        <div className="scenario-grid">
          {content.benefits.map((item, index) => (
            <div className="item" key={index}><span className="ic">{item.icon}</span>{item.text}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">03</span><h2>Что внутри</h2></div>
        <div className="scenario-grid">
          {content.inside.map((item, index) => (
            <div className="item" key={index}><span className="ic">{item.icon}</span>{item.text}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><span className="num">04</span><h2>{content.freebie.heading}</h2></div>
        <p className="plain-info">{content.freebie.intro}</p>
        {content.freebie.kind === "list" ? (
          <div className="scenario-grid">
            {content.freebie.items.map((item, index) => (
              <div className="item" key={index}><span className="ic">{item.icon}</span>{item.text}</div>
            ))}
          </div>
        ) : (
          <div className="info-rows">
            {content.freebie.rows.map((row) => (
              <div className="row" key={row.name}>
                <div className="head"><span className="name"><span className="dot-ic">{row.icon}</span><b>{row.name}</b></span></div>
                <div className="sub">{row.text}</div>
              </div>
            ))}
          </div>
        )}
        <div className="callout accent-callout">
          <span className="ic">💡</span>
          <div>{content.freebie.calloutText}</div>
        </div>
      </div>

      <div className="section">
        <div className="callout accent-callout">
          <span className="ic">🚀</span>
          <div>{content.closingCallout}</div>
        </div>
      </div>

      <div className="nextbar">
        <button onClick={onStart}>{content.ctaLabel} <span>→</span></button>
        <small>{content.ctaNote}</small>
      </div>
    </div>
  );
}
