import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { isDevMode, generateMockInitData, getSavedUsername } from "./devHelpers";
import { getCookie } from "./cookies";

/**
 * Checks if the app is running in Telegram WebView
 * @returns {boolean} true if running in Telegram
 */
export const isTelegramWebView = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Telegram WebApp object (most reliable)
  if (window.Telegram?.WebApp) {
    return true;
  }

  // Check for Telegram WebApp script injection
  if (window.TelegramWebviewProxy) {
    return true;
  }

  // Check User-Agent for Telegram WebView
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('telegram')) {
      return true;
    }
  }

  // Check for initData in URL (characteristic of Telegram Mini Apps)
  if (window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTelegramData = urlParams.has('tgWebAppData') || 
                           urlParams.has('tgWebAppVersion') ||
                           urlParams.has('tgWebAppPlatform') ||
                           urlParams.has('tgWebAppStartParam');
    if (hasTelegramData) {
      return true;
    }
  }

  // Check for Telegram-specific environment variables
  if (window.location?.href?.includes('t.me') || window.location?.href?.includes('telegram.me')) {
    return true;
  }

  // Check if we're in a WebView context (fallback)
  if (typeof window !== 'undefined') {
    // Check for WebView-specific properties
    if (window.navigator?.standalone === false && window.matchMedia('(display-mode: standalone)').matches === false) {
      // This might be a WebView
      if (window.location?.protocol === 'https:' && window.location?.hostname !== 'localhost') {
        // If we're on HTTPS and not localhost, assume it might be Telegram
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks if the app can run in the current environment
 * @returns {boolean} true if the app can run
 */
export const canRunApp = () => {
  // In dev mode, allow running in browser
  if (import.meta.env.DEV) {
    return true;
  }

  // TEMPORARY: Allow running in production until Telegram detection is fixed
  // TODO: Fix Telegram WebView detection and re-enable proper checks
  return true;

  // Original logic (commented out for now):
  /*
  // In production mode, check if we're in Telegram WebView
  const isTelegram = isTelegramWebView();
  
  // If we can't determine the environment clearly, allow running
  // This is a fallback for cases where Telegram detection might fail
  if (typeof window !== 'undefined') {
    // If we're on HTTPS and not localhost, likely a production environment
    if (window.location?.protocol === 'https:' && window.location?.hostname !== 'localhost') {
      return true; // Allow running in production HTTPS environments
    }
  }

  return isTelegram;
  */
};

/**
 * Gets information about the current environment
 * @returns {object} environment information
 */
export const getEnvironmentInfo = () => {
  const isDev = import.meta.env.DEV;
  const isTelegram = isTelegramWebView();
  const canRun = canRunApp();

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location?.search || '') : null;

  return {
    isDev,
    isTelegram,
    canRun,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    hasTelegramWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
    hasTelegramWebviewProxy: typeof window !== 'undefined' && !!window.TelegramWebviewProxy,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    protocol: typeof window !== 'undefined' ? window.location?.protocol : 'unknown',
    hostname: typeof window !== 'undefined' ? window.location?.hostname : 'unknown',
    urlParams: urlParams ? {
      tgWebAppData: urlParams.has('tgWebAppData'),
      tgWebAppVersion: urlParams.has('tgWebAppVersion'),
      tgWebAppPlatform: urlParams.has('tgWebAppPlatform'),
      tgWebAppStartParam: urlParams.has('tgWebAppStartParam')
    } : null
  };
};

/**
 * Robustly extracts Telegram initData from all available sources:
 * 1. window.Telegram.WebApp.initData
 * 2. retrieveLaunchParams().initDataRaw from Telegram SDK
 * 3. URL search params (tgWebAppData, initData, init_data)
 * 4. URL hash fragment (#tgWebAppData=...)
 * 5. localStorage / sessionStorage / Cookies
 * 6. DEV mock fallback
 */
export const getTelegramInitData = () => {
  if (typeof window === 'undefined') return null;

  // 1. Official Telegram WebApp window object
  let initData = window.Telegram?.WebApp?.initData;
  if (initData && typeof initData === 'string' && initData.trim() !== '') {
    return initData.trim();
  }

  // 2. Telegram SDK launch params
  try {
    const launchParams = retrieveLaunchParams();
    if (launchParams?.initDataRaw && typeof launchParams.initDataRaw === 'string') {
      return launchParams.initDataRaw.trim();
    }
  } catch {}

  // 3. Search and Hash URL parameters
  try {
    const searchParams = new URLSearchParams(window.location.search);
    let raw = searchParams.get('tgWebAppData') || searchParams.get('initData') || searchParams.get('init_data');
    if (raw) return raw.trim();

    const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashStr);
    raw = hashParams.get('tgWebAppData') || hashParams.get('initData') || hashParams.get('init_data');
    if (raw) return raw.trim();
  } catch (e) {
    console.warn('[getTelegramInitData] URL parse error:', e);
  }

  // 4. Stored in localStorage / sessionStorage / Cookies
  initData = localStorage.getItem('tg_init_data') || sessionStorage.getItem('tg_init_data') || getCookie('initData');
  if (initData && typeof initData === 'string' && initData.trim() !== '') {
    if (!import.meta.env.DEV && initData.includes('dev_mock_')) {
      localStorage.removeItem('tg_init_data');
      sessionStorage.removeItem('tg_init_data');
      return null;
    }
    return initData.trim();
  }

  // 5. DEV mode fallback
  if (isDevMode()) {
    return generateMockInitData(getSavedUsername());
  }

  return null;
};
