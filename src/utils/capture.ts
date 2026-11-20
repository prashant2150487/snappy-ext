import type { CaptureResponse, Message } from '../types';

export function getTargetTabId(): number | null {
  const raw = new URLSearchParams(window.location.search).get('tabId');
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) ? id : null;
}

export async function requestCapture(tabId: number): Promise<CaptureResponse> {
  try {
    const res = await chrome.runtime.sendMessage<Message, CaptureResponse>({
      type: 'START_CAPTURE',
      tabId,
    });
    return res ?? { ok: false, error: 'No response from the background worker.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Capture failed.' };
  }
}