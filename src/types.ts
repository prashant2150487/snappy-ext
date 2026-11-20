export type Message =
  | { type: 'START_CAPTURE'; tabId: number }
  | { type: 'SHOW_OVERLAY'; dataUrl: string }
  | { type: 'CLOSE_OVERLAY' };

export type CaptureResponse = { ok: true } | { ok: false; error: string };