import type { Rect } from '../../utils/crop';
import type { PointerEvent } from 'react';

const resizeEdges = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

interface Props {
  rect: Rect;
  dragging: boolean;
  handlers: {
    onPointerDown: (event: PointerEvent<HTMLElement>, edge: string | null) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  };
}

export default function SelectionRectangle({ rect, dragging, handlers }: Props) {
  return (
    <div
      className="ss-selection"
      data-dragging={dragging}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      onPointerDown={(event) => handlers.onPointerDown(event, null)}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
    >
      <span className={`ss-size${rect.y < 30 ? ' ss-size-in' : ''}`}>
        {Math.round(rect.width)} × {Math.round(rect.height)}
      </span>
      {resizeEdges.map((edge) => (
        <span
          key={edge}
          className={`ss-resize ss-resize-${edge}`}
          onPointerDown={(event) => handlers.onPointerDown(event, edge)}
        />
      ))}
    </div>
  );
}