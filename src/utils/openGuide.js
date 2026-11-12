export const GUIDE_PATH = '/guide/index.html';

/**
 * Open the illustrated user guide. Inside Telegram the Mini App webview has no
 * tabs, so hand the link to Telegram (opens in its in-app browser); elsewhere
 * open a new tab.
 */
export function openGuide() {
  const url = `${window.location.origin}${GUIDE_PATH}`;
  const tg = window.Telegram?.WebApp;
  if (tg?.initData && typeof tg.openLink === 'function') {
    tg.openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener');
}
