import type { NextConfig } from "next";

// Без X-Frame-Options: это Telegram Mini App, Telegram Web показывает его
// именно во встроенном iframe со своего домена — заголовок SAMEORIGIN
// заблокировал бы показ приложения всем, кто открывает бота не из мобильного
// клиента, а из web.telegram.org. Кликджекинг тут не критичен: сайт не
// содержит действий, которые можно спровоцировать одним кликом снаружи —
// сама оплата происходит на отдельной странице Tribute, не в iframe этого сайта.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
