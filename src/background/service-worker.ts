import type { CaptureResponse, Message } from '../types';

const RESTRICTED_URL =
  /^(chrome|chrome-extension|chrome-untrusted|edge|about|devtools|view-source):|^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/i;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 1. Icon click → open landing page, remembering which tab to capture.
chrome.action.onClicked.addListener(async (tab) => {
  const query = tab.id != null ? `?tabId=${tab.id}` : '';
  await chrome.tabs.create({
    url: chrome.runtime.getURL('index.html') + query,
    index: tab.index + 1,
  });
});

// 2. Landing page asks us to capture.
chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  if (msg.type !== 'START_CAPTURE') return;

  startCapture(msg.tabId)
    .then(() => sendResponse({ ok: true } satisfies CaptureResponse))
    .catch((err) =>
      sendResponse({ ok: false, error: toFriendlyError(err) } satisfies CaptureResponse),
    );

  return true; // keep the channel open for the async response
});

async function startCapture(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId);

  if (tab.url && RESTRICTED_URL.test(tab.url)) {
    throw new Error('Cannot access this page');
  }

  // captureVisibleTab only captures the ACTIVE tab of a window.
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });

  // Remove any overlay from a previous capture so it isn't in the new screenshot.
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'CLOSE_OVERLAY' } satisfies Message);
  } catch {
    /* no content script yet — fine */
  }

  await delay(150); // let the tab repaint after being activated

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });

  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  await chrome.tabs.sendMessage(tabId, { type: 'SHOW_OVERLAY', dataUrl } satisfies Message);
}

function toFriendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (/cannot access|cannot be scripted|extensions gallery|chrome:\/\//i.test(msg)) {
    return "Chrome doesn't allow extensions to capture this page (internal pages and the Web Store are protected). Try a regular website.";
  }
  if (/activeTab|all_urls|permission/i.test(msg)) {
    return 'Permission for that tab has expired (the page navigated). Click the extension icon again while viewing the page you want to capture.';
  }
  if (/No tab with id|Receiving end does not exist/i.test(msg)) {
    return 'The original tab is gone or was reloaded. Click the extension icon again on the page you want to capture.';
  }
  if (/MAX_CAPTURE_VISIBLE_TAB_CALLS/i.test(msg)) {
    return 'Capturing too quickly. Wait a second and try again.';
  }
  return msg || 'Something went wrong while capturing.';
}