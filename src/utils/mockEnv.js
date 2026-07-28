// Мокирование переменных окружения для работы вне Telegram
// Этот файл используется когда приложение запускается не в Telegram WebApp

// Создаем упрощенные данные для разработки
const mockUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en'
};

const mockAuthDate = Math.floor(Date.now() / 1000);
const mockChatInstance = 'test_chat_instance';

// Создаем строку для подписи (без hash)
const mockDataString = [
  `auth_date=${mockAuthDate}`,
  `chat_instance=${mockChatInstance}`,
  `chat_type=private`,
  `user=${JSON.stringify(mockUser)}`
].join('\n');

// Простая мок-подпись (в реальности это HMAC-SHA256)
const mockSignature = 'mock_signature_' + btoa(mockDataString).substring(0, 16);

// Создаем упрощенные данные для разработки
const mockTgWebAppData = [
  `auth_date=${mockAuthDate}`,
  `chat_instance=${mockChatInstance}`,
  `chat_type=private`,
  `user=${encodeURIComponent(JSON.stringify(mockUser))}`,
  `signature=${mockSignature}`,
  `hash=${mockSignature}`
].join('&');

// Сразу устанавливаем данные в localStorage для SDK
if (typeof window !== 'undefined') {
  try {
    // Совместимость (старые ключи)
    localStorage.setItem('telegram_web_app_data', mockTgWebAppData);
    localStorage.setItem('telegram_web_app_platform', 'web');
    localStorage.setItem('telegram_web_app_version', '7.12');
    localStorage.setItem('telegram_web_app_start_param', 'platformer_debug');
    localStorage.setItem('telegram_web_app_theme_params', JSON.stringify({
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
      hint_color: '#b3b3b3',
      link_color: '#9c27b0',
      button_color: '#9c27b0',
      button_text_color: '#ffffff',
      secondary_bg_color: '#1a1a1a'
    }));

    // Ключи, которые ожидает @telegram-apps/sdk-react
    localStorage.setItem('tgWebAppData', mockTgWebAppData);
    localStorage.setItem('tgWebAppPlatform', 'web');
    localStorage.setItem('tgWebAppVersion', '7.12');
    localStorage.setItem('tgWebAppStartParam', 'platformer_debug');
    localStorage.setItem('tgWebAppThemeParams', JSON.stringify({
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
      hint_color: '#b3b3b3',
      link_color: '#9c27b0',
      button_color: '#9c27b0',
      button_text_color: '#ffffff',
      secondary_bg_color: '#1a1a1a'
    }));
  } catch (e) {
    // localStorage может быть недоступен
  }
  
  // Также устанавливаем данные в URL только в режиме разработки
  if (window.location && import.meta.env.DEV) {
    const urlParams = new URLSearchParams(window.location.search);
    // Добавляем параметры только если их еще нет
    if (!urlParams.has('tgWebAppData')) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('tgWebAppData', mockTgWebAppData);
      newUrl.searchParams.set('tgWebAppPlatform', 'web');
      newUrl.searchParams.set('tgWebAppVersion', '7.12');
      newUrl.searchParams.set('tgWebAppStartParam', 'platformer_debug');
      // Упрощенные параметры темы
      newUrl.searchParams.set('tgWebAppThemeParams', '{"bg_color":"#0a0a0a","text_color":"#ffffff"}');
      window.history.replaceState({}, '', newUrl);
    }
  }
}

// Мокируем объект window.Telegram если его нет
if (typeof window !== 'undefined' && !window.Telegram) {
  window.Telegram = {
    WebApp: {
      initData: mockTgWebAppData,
      initDataUnsafe: {
        user: mockUser,
        chat_instance: mockChatInstance,
        chat_type: 'private',
        auth_date: mockAuthDate,
        // Некоторые клиенты ожидают "signature" вместо "hash"
        signature: mockSignature,
        hash: mockSignature
      },
      version: '7.12', // Более новая версия
      platform: 'web', // Изменено с 'unknown' на 'web'
      colorScheme: 'dark',
      themeParams: {
        bg_color: '#0a0a0a',
        text_color: '#ffffff',
        hint_color: '#b3b3b3',
        link_color: '#9c27b0',
        button_color: '#9c27b0',
        button_text_color: '#ffffff',
        secondary_bg_color: '#1a1a1a'
      },
      isExpanded: true,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: '#0a0a0a',
      backgroundColor: '#0a0a0a',
      isClosingConfirmationEnabled: false,
      isVerticalSwipesEnabled: true,
      ready: () => {},
      expand: () => {},
      close: () => {},
      sendData: () => {},
      openLink: (url) => window.open(url, '_blank'),
      openTelegramLink: (url) => window.open(url, '_blank'),
      openInvoice: () => {},
      showPopup: () => {},
      showAlert: (message, callback) => {
        alert(message);
        if (callback) callback();
      },
      showConfirm: (message, callback) => {
        const result = confirm(message);
        if (callback) callback(result);
      },
      showScanQrPopup: () => {},
      closeScanQrPopup: () => {},
      readTextFromClipboard: (callback) => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(callback);
        } else {
          callback('');
        }
      },
      requestWriteAccess: (callback) => {
        if (callback) callback(true);
      },
      requestContact: (callback) => {
        if (callback) callback(false);
      },
      // Добавляем методы для совместимости с SDK
      onEvent: (event, callback) => {
        // Мокируем обработчики событий
        if (event === 'ready') {
          setTimeout(callback, 100);
        }
      },
      offEvent: () => {},
      // Добавляем поддержку новых методов API
      requestWriteAccess: (callback) => {
        if (callback) callback(true);
      },
      requestContact: (callback) => {
        if (callback) callback(false);
      },
      requestLocation: (callback) => {
        if (callback) callback(false);
      },
      requestPoll: (callback) => {
        if (callback) callback(false);
      },
      requestCamera: (callback) => {
        if (callback) callback(false);
      },
      requestMicrophone: (callback) => {
        if (callback) callback(false);
      },
      requestPhoto: (callback) => {
        if (callback) callback(false);
      },
      requestVideo: (callback) => {
        if (callback) callback(false);
      },
      requestFile: (callback) => {
        if (callback) callback(false);
      }
    }
  };
}

// Мокируем переменные окружения если они не установлены
if (typeof process !== 'undefined' && process.env) {
  // Базовые переменные окружения для разработки
  if (!process.env.VITE_API_URL) {
    process.env.VITE_API_URL = 'http://localhost:3000/api';
  }
  if (!process.env.VITE_APP_NAME) {
    process.env.VITE_APP_NAME = 'Merits & Demerits';
  }
  if (!process.env.VITE_APP_VERSION) {
    process.env.VITE_APP_VERSION = '1.0.0';
  }
}

// Мокируем глобальные переменные для SDK
if (typeof window !== 'undefined') {
  // Добавляем поддержку для retrieveLaunchParams
  window.__TELEGRAM_WEB_APP_DATA__ = {
    tgWebAppPlatform: 'web',
    tgWebAppVersion: '7.12',
    tgWebAppStartParam: 'platformer_debug',
    tgWebAppThemeParams: {
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
      hint_color: '#b3b3b3',
      link_color: '#9c27b0',
      button_color: '#9c27b0',
      button_text_color: '#ffffff',
      secondary_bg_color: '#1a1a1a'
    },
    // Включаем строку данных с обоими ключами: signature и hash
    tgWebAppData: mockTgWebAppData
  };
}

console.log('Mock environment loaded for development outside Telegram');
