import type { Rect } from '../../utils/crop';

export default function SelectionRectangle({ rect, dragging }: { rect: Rect; dragging: boolean }) {
  return (
    <div
      className="ss-selection"
      data-dragging={dragging}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      <span className={`ss-size${rect.y < 30 ? ' ss-size-in' : ''}`}>
        {Math.round(rect.width)} × {Math.round(rect.height)}
      </span>
    </div>
  );
}