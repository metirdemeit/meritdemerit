// Глобальный обработчик ошибок для API

/**
 * Обработка ошибок авторизации для Telegram Mini App
 */
export const handleAuthError = (error) => {
  // 403 = невалидный initData → уже обработано в handleRequest
  // Для остальных ошибок авторизации не делаем автоматический logout
  return false; // Не обработано
};

/**
 * Обработка сетевых ошибок для Telegram Mini App
 */
export const handleNetworkError = (error) => {
  if (!error.response) {
    // Показываем "Проблемы с сетью", но НЕ выходим из аккаунта
    return true;
  }
  return false;
};

/**
 * Глобальный обработчик ошибок API для Telegram Mini App
 */
export const handleApiError = (error) => {
  // 403 ошибки уже обработаны в handleRequest (редирект на логин)
  
  // Обрабатываем сетевые ошибки (показываем "Проблемы с сетью")
  if (handleNetworkError(error)) {
    return;
  }

  // Для всех остальных ошибок просто обрабатываем
};

/**
 * Обработчик для apiWrapper - возвращает true если ошибка обработана
 */
export const handleApiWrapperError = (error) => {
  // 403 ошибки уже обработаны в handleRequest (редирект на логин)
  // Для остальных ошибок просто обрабатываем
  return false;
};
