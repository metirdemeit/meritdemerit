// src/utils/devHelpers.js
// Утилиты для dev режима

/**
 * Генерирует стабильный Telegram ID на основе username
 * @param {string} username - имя пользователя
 * @returns {number} уникальный Telegram ID
 */
export const generateTelegramId = (username) => {
  if (!username) return 123456789; // Дефолтный ID
  
  // Создаем стабильный ID на основе имени пользователя
  // Telegram ID обычно начинаются с больших чисел (100000000+)
  const baseId = 100000000;
  const usernameHash = username.charCodeAt(0) * 1000 + username.length * 100;
  
  return baseId + usernameHash;
};

/**
 * Генерирует мок initData для dev режима
 * @param {string} username - имя пользователя
 * @returns {string} мок initData строка
 */
export const generateMockInitData = (username) => {
  const authDate = Math.floor(Date.now() / 1000);
  const userId = generateTelegramId(username);
  
  const userData = {
    id: userId,
    first_name: "Dev",
    last_name: "User"
  };
  
  return `auth_date=${authDate}&user=${encodeURIComponent(JSON.stringify(userData))}&hash=dev_mock_${userId}`;
};

/**
 * Получает сохраненный username из localStorage
 * @returns {string|null} username или null
 */
export const getSavedUsername = () => {
  return localStorage.getItem('dev_username');
};

/**
 * Сохраняет username в localStorage
 * @param {string} username - имя пользователя
 */
export const saveUsername = (username) => {
  localStorage.setItem('dev_username', username);
};

/**
 * Очищает сохраненный username из localStorage
 */
export const clearSavedUsername = () => {
  localStorage.removeItem('dev_username');
};

/**
 * Проверяет, находимся ли мы в dev режиме
 * @returns {boolean}
 */
export const isDevMode = () => {
  return import.meta.env.DEV;
};

/**
 * Извлекает telegram_id из initData строки
 * @param {string} initData - строка initData
 * @returns {number|null} telegram_id или null
 */
export const extractTelegramIdFromInitData = (initData) => {
  if (!initData) return null;
  
  try {
    let rawStr = initData;
    if (typeof rawStr === 'string' && (rawStr.includes('%3D') || rawStr.includes('%26'))) {
      try {
        rawStr = decodeURIComponent(rawStr);
      } catch {}
    }

    const params = new URLSearchParams(rawStr);
    const userParam = params.get('user');
    
    if (userParam) {
      let userData;
      if (typeof userParam === 'object') {
        userData = userParam;
      } else {
        try {
          userData = JSON.parse(userParam);
        } catch {
          userData = JSON.parse(decodeURIComponent(userParam));
        }
      }
      return userData?.id ? Number(userData.id) : null;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error extracting telegram_id from initData:', error);
  }
  
  return null;
};

