import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cropImage, loadImage, type CropResult } from '../../utils/crop';
import { useSelection } from '../../hooks/useSelecttion';
import { defaultFilename, downloadBlob } from '../../utils/download';
import SelectionRectangle from '../SelectionReactangle';
import FloatingToolbar from '../FloatingToolbar';
import { copyPngToClipboard } from '../../utils/clipboard';


interface Props { dataUrl: string; onClose: () => void }
interface Toast { text: string; kind: 'success' | 'error' }

export default function ScreenshotOverlay({ dataUrl, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const jobRef = useRef(0); // guards against stale async crops
  const toastTimer = useRef<number | null>(null);

  const [bounds, setBounds] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [crop, setCrop] = useState<CropResult | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);
  const [acted, setActed] = useState(false);

  const notify = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Measure overlay once; load the full-resolution image.
  useLayoutEffect(() => {
    const b = containerRef.current?.getBoundingClientRect();
    if (b) setBounds({ width: b.width, height: b.height });
  }, []);

  useEffect(() => {
    let alive = true;
    loadImage(dataUrl)
      .then((img) => { if (alive) imageRef.current = img; })
      .catch(() => notify('Could not load the screenshot.', 'error'));
    return () => { alive = false; imageRef.current = null; };
  }, [dataUrl, notify]);

  // Revoke the blob URL whenever the crop changes or the overlay unmounts.
  useEffect(() => {
    if (!crop) return;
    return () => URL.revokeObjectURL(crop.url);
  }, [crop]);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  // Esc closes. A resize means the frozen screenshot no longer matches the page, so close too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const { rect, dragging, reset, handlers, selectionHandlers } = useSelection(containerRef, {
    onStart: () => {
      jobRef.current++;
      setCrop(null);
      setActed(false);
    },
    onComplete: async (r) => {
      const job = ++jobRef.current;
      const img = imageRef.current;
      const box = containerRef.current?.getBoundingClientRect();
      if (!img || !box) return;
      try {
        const result = await cropImage(img, r, { width: box.width, height: box.height });
        if (job === jobRef.current) setCrop(result);
        else URL.revokeObjectURL(result.url);
      } catch {
        notify('Could not crop that area.', 'error');
      }
    },
  });

  const clearSelection = useCallback(() => {
    jobRef.current++;
    setCrop(null);
    setActed(false);
    reset();
  }, [reset]);

  const handleCopy = async () => {
    if (!crop || busy) return;
    setBusy(true);
    try {
      await copyPngToClipboard(crop.blob);
      notify('Image copied to clipboard!');
      setActed(true);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Copy failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!crop) return;
    try {
      downloadBlob(crop.blob, defaultFilename());
      notify('Screenshot downloaded');
      setActed(true);
    } catch {
      notify('Download failed.', 'error');
    }
  };

  return (
    <div ref={containerRef} className="ss-overlay" role="dialog" aria-label="Select an area to capture">
      <img className="ss-image" src={dataUrl} alt="" draggable={false} />
      {!rect && <div className="ss-dim" />}

      <div className="ss-surface" {...handlers} />

      {rect && <SelectionRectangle rect={rect} dragging={dragging} handlers={selectionHandlers} />}

      {!rect && (
        <div className="ss-hint">
          Drag to select an area <kbd>Esc</kbd> to exit
        </div>
      )}
      <button className="ss-close" title="Exit (Esc)" aria-label="Exit screenshot mode" onClick={onClose}>
        <X size={18} />
      </button>

      {rect && crop && !dragging && (
        <FloatingToolbar
          rect={rect}
          bounds={bounds}
          crop={crop}
          busy={busy}
          acted={acted}
          onCancel={clearSelection}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onCaptureAgain={clearSelection}
        />
      )}

      {toast && <div className="ss-toast" data-kind={toast.kind} role="status">{toast.text}</div>}
    </div>
  );
}