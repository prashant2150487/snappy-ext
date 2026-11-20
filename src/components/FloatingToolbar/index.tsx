import { useLayoutEffect, useRef, useState } from 'react';
import { Camera, Copy, Download, Loader2, X } from 'lucide-react';
import { clamp, type CropResult, type Rect } from '../../utils/crop';
import ScreenshotPreview from '../ScreenShotPreview';

interface Props {
  rect: Rect;
  bounds: { width: number; height: number };
  crop: CropResult;
  busy: boolean;
  acted: boolean; // user already copied/downloaded
  onCancel: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onCaptureAgain: () => void;
}

const GAP = 10;
const EDGE = 8;

// Prefer below the selection, then above, then inside — always inside the viewport.
function place(rect: Rect, bounds: Props['bounds'], size: { w: number; h: number }) {
  let top = rect.y + rect.height + GAP;
  if (top + size.h > bounds.height - EDGE) {
    const above = rect.y - GAP - size.h;
    top = above >= EDGE ? above : rect.y + rect.height - size.h - GAP;
  }
  top = clamp(top, EDGE, Math.max(EDGE, bounds.height - size.h - EDGE));

  const centered = rect.x + rect.width / 2 - size.w / 2;
  const left = clamp(centered, EDGE, Math.max(EDGE, bounds.width - size.w - EDGE));
  return { top, left };
}

export default function FloatingToolbar({
  rect, bounds, crop, busy, acted, onCancel, onCopy, onDownload, onCaptureAgain,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pos = place(rect, bounds, size);

  return (
    <div
      ref={ref}
      className="ss-toolbar"
      style={{ top: pos.top, left: pos.left, visibility: size.w ? 'visible' : 'hidden' }}
      role="toolbar"
      aria-label="Screenshot actions"
    >
      <ScreenshotPreview url={crop.url} width={crop.width} height={crop.height} />
      <span className="ss-divider" />

      <button className="ss-btn" title="Cancel" aria-label="Cancel" onClick={onCancel}>
        <X size={18} />
      </button>
      <button className="ss-btn" title="Copy to clipboard" aria-label="Copy to clipboard" disabled={busy} onClick={onCopy}>
        {busy ? <Loader2 size={18} className="ss-spin" /> : <Copy size={18} />}
      </button>
      <button className="ss-btn" title="Download PNG" aria-label="Download PNG" onClick={onDownload}>
        <Download size={18} />
      </button>

      {acted && (
        <button className="ss-btn ss-btn-text" onClick={onCaptureAgain}>
          <Camera size={16} /> Capture again
        </button>
      )}
    </div>
  );
}