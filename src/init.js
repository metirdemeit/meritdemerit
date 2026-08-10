import {
  setDebug,
  mountBackButton,
  restoreInitData,
  init as initSDK,
  mountMiniApp,
  bindThemeParamsCssVars,
  mountViewport,
  bindViewportCssVars,
  mockTelegramEnv,
  themeParamsState,
  retrieveLaunchParams,
  emitEvent,
  postEvent,
} from "@telegram-apps/sdk-react";

/**
 * Initializes the application and configures its dependencies safely for Desktop & Mobile.
 */
export async function init(options) {
  // Set @telegram-apps/sdk-react debug mode and initialize it.
  try {
    setDebug(options.debug);
  } catch {}

  // В режиме разработки мокируем окружение Telegram для SDK
  try {
    if (import.meta.env && import.meta.env.DEV) {
      mockTelegramEnv();
    }
  } catch {}

  try {
    initSDK();
  } catch (e) {
    if (import.meta.env.DEV) console.warn("initSDK failed:", e);
  }

  // Add Eruda if needed.
  if (options.eruda) {
    try {
      void import("eruda").then(({ default: eruda }) => {
        eruda.init();
        eruda.position({ x: window.innerWidth - 50, y: 0 });
      });
    } catch {}
  }

  // Telegram for macOS workaround
  if (options.mockForMacOS) {
    try {
      let firstThemeSent = false;
      mockTelegramEnv({
        onEvent(event, next) {
          if (event[0] === "web_app_request_theme") {
            let tp = {};
            if (firstThemeSent) {
              tp = themeParamsState();
            } else {
              firstThemeSent = true;
              tp ||= retrieveLaunchParams().tgWebAppThemeParams;
            }
            return emitEvent("theme_changed", { theme_params: tp });
          }

          if (event[0] === "web_app_request_safe_area") {
            return emitEvent("safe_area_changed", {
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            });
          }

          next();
        },
      });
    } catch {}
  }

  // Mount components safely
  try {
    if (mountBackButton.ifAvailable) mountBackButton.ifAvailable();
  } catch {}

  try {
    restoreInitData();
  } catch {}

  try {
    await Promise.all([
      mountMiniApp.isAvailable && mountMiniApp.isAvailable()
        ? mountMiniApp().then(() => {
            try { bindThemeParamsCssVars(); } catch {}
          }).catch(() => {})
        : Promise.resolve(),
      mountViewport.isAvailable && mountViewport.isAvailable()
        ? mountViewport().then(() => {
            try { bindViewportCssVars(); } catch {}
          }).catch(() => {})
        : Promise.resolve(),
  ]);
  } catch {}

  // Определение платформы для безопасного вызова эвентов
  let platform = 'unknown';
  try {
    const lp = retrieveLaunchParams();
    platform = lp.tgWebAppPlatform || 'unknown';
  } catch {}

  // Вызовы только для мобильных устройств (iOS / Android),
  // чтобы избежать 'Webview crashed.' на ПК в Telegram Desktop
  const isMobile = ['ios', 'android'].includes(platform);

  if (isMobile) {
    try {
      postEvent("web_app_setup_swipe_behavior", { allow_vertical_swipe: false });
    } catch {}
  }

  // Управление полноэкранным режимом
  try {
    const lp = retrieveLaunchParams();
    const version = String(lp.tgWebAppVersion || '0.0');
    const [majStr, minStr] = version.split('.');
    const maj = parseInt(majStr || '0', 10);
    const min = parseInt(minStr || '0', 10);
    const supportsExitFullscreen = maj > 7 || (maj === 7 && min >= 13);

    if (!import.meta.env.DEV) {
      if (platform === 'tdesktop' || platform === 'macos' || platform === 'weba' || platform === 'web') {
        if (supportsExitFullscreen) {
          postEvent('web_app_exit_fullscreen');
        }
      } else if (isMobile) {
        postEvent('web_app_request_fullscreen');
      }
    }
  } catch {}
}
