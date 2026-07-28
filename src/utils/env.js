// Утилиты окружения: определение режима разработки/продакшн
export const isDev = Boolean(import.meta.env && import.meta.env.DEV);
export const isProd = !isDev;

// Возвращает текущую строку окружения (dev|prod)
export const getEnv = () => (isDev ? 'dev' : 'prod');


