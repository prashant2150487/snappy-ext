import { createRoot } from 'react-dom/client';
import ScreenshotOverlay from '../components/ScreenShotOverlay';
import overlayCss from './overlay.scss?inline';
import type { Message } from '../types';

const w = window as unknown as { __smartShotLoaded?: boolean };

let teardown: (() => void) | null = null;

function closeOverlay() {
  teardown?.();
  teardown = null;
}

function openOverlay(dataUrl: string) {
  closeOverlay();

  const host = document.createElement('div');
  host.id = 'smart-screenshot-host';
  host.style.cssText =
    'all:initial;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;';

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = overlayCss;
  const mountPoint = document.createElement('div');
  mountPoint.className = 'ss-root';
  shadow.append(style, mountPoint);

  // Hide page scrollbars while open so the overlay matches the screenshot exactly.
  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  html.style.overflow = 'hidden';
  html.appendChild(host);

  const root = createRoot(mountPoint);
  root.render(<ScreenshotOverlay dataUrl={dataUrl} onClose={closeOverlay} />);

  teardown = () => {
    root.unmount();
    host.remove();
    html.style.overflow = prevOverflow;
  };
}

// The worker re-injects this file on every capture; only register listeners once.
if (!w.__smartShotLoaded) {
  w.__smartShotLoaded = true;

  chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
    if (msg.type === 'SHOW_OVERLAY') {
      openOverlay(msg.dataUrl);
      sendResponse({ ok: true });
    } else if (msg.type === 'CLOSE_OVERLAY') {
      closeOverlay();
      sendResponse({ ok: true });
    }
  });
}