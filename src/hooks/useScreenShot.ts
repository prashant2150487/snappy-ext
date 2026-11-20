import { useCallback, useMemo, useState } from 'react';
import { getTargetTabId, requestCapture } from '../utils/capture';

export type CaptureStatus = 'idle' | 'capturing' | 'done' | 'error';

export function useScreenshot() {
  const tabId = useMemo(() => getTargetTabId(), []);
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    if (tabId == null) {
      setStatus('error');
      setError('No page to capture. Click the extension icon while viewing the page you want to capture.');
      return;
    }
    setStatus('capturing');
    setError(null);

    const res = await requestCapture(tabId);
    if (res.ok) {
      setStatus('done');
    } else {
      setStatus('error');
      setError(res.error);
    }
  }, [tabId]);

  return { status, error, capture };
}