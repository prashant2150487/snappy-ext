import {  AlertTriangle, Camera, CheckCircle2, Crop, Loader2 } from 'lucide-react';
import "./styles.scss"
import { useScreenshot } from '../../hooks/useScreenShot';

export default function LandingPage() {
  const { status,error , capture } = useScreenshot();
  const capturing = status === 'capturing';

  return (
    <main className="landing">
      {/* Blurred backdrop */}
      <div className="landing__backdrop" aria-hidden>
        <div className="blob blob--indigo" />
        <div className="blob blob--fuchsia" />
        <div className="blob blob--sky" />
        <div className="ghost-window ghost-window--left" />
        <div className="ghost-window ghost-window--right" />
      </div>

      <section className="landing__content">
        {/* Screenshot illustration */}
        <div className="illustration">
          <div className="mock-window">
            <div className="mock-window__bar">
              <span className="dot dot--red" />
              <span className="dot dot--amber" />
              <span className="dot dot--green" />
            </div>
            <div className="mock-window__lines">
              <div className="line line--long" />
              <div className="line line--full" />
              <div className="line line--short" />
            </div>
            <div className="mock-window__selection">
              <span className="handle handle--tl" />
              <span className="handle handle--tr" />
              <span className="handle handle--bl" />
              <span className="handle handle--br" />
            </div>
            <div className="mock-window__badge">
              <Crop size={24} />
            </div>
          </div>
        </div>

        <h1 className="landing__title">Screenshot &amp; Smart Crop</h1>
        <p className="landing__subtitle">Select an area of your screen to capture.</p>

        <button className="capture-btn" onClick={capture} disabled={capturing}>
          {capturing ? <Loader2 size={20} className="capture-btn__spinner" /> : <Camera size={20} />}
          {capturing ? 'Capturing…' : 'Capture Screenshot'}
        </button>

        <div className="landing__status" aria-live="polite">
          {status === 'error' && error && (
            <div className="alert alert--error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          {status === 'done' && (
            <div className="status-ok">
              <CheckCircle2 size={16} />
              Selection mode is open on your previous tab. Come back here to capture again.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}