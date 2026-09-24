import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Shape as ShapeModel, Tool, Viewport } from '../types/shape';
import type { SelectHandlers } from '../hooks/useShapes';
import { worldToScreen } from '../utils/geometry';

/** Цвет рамки выделения — фирменный синий Figma. */
const SELECT_COLOR = '#0d99ff';

/** Размер маркера (квадрат) в экранных px — не зависит от зума. */
const HANDLE_SIZE = 8;

/** 8 маркеров на рамке выделения: углы и середины сторон (позиции в % от рамки). */
const HANDLE_POSITIONS: Array<{ top: number; left: number }> = [
  { top: 0, left: 0 },
  { top: 0, left: 50 },
  { top: 0, left: 100 },
  { top: 50, left: 0 },
  { top: 50, left: 100 },
  { top: 100, left: 0 },
  { top: 100, left: 50 },
  { top: 100, left: 100 },
];

interface ShapeProps {
  shape: ShapeModel;
  viewport: Viewport;
  /** Выделена ли фигура — решает, рисовать рамку с маркерами. */
  selected: boolean;
  /** Активный инструмент: в режиме select фигура кликабельна и перетаскиваема. */
  activeTool: Tool;
  /** Пробел зажат — фигура не перехватывает указатель (работает панорамирование). */
  spacePressed: boolean;
  /** Обработчики выделения/перетаскивания из useShapes. */
  selectHandlers: SelectHandlers;
}

/**
 * Рендер одной фигуры на холсте.
 * Координаты и размеры переводятся из мировых в экранные с учётом камеры.
 * Поверх фигуры — рамка выделения с 8 маркерами (у выделенной фигуры),
 * а в режиме select сама фигура ловит клики и перетаскивание.
 */
export function Shape({
  shape,
  viewport,
  selected,
  activeTool,
  spacePressed,
  selectHandlers,
}: ShapeProps) {
  const pos = worldToScreen({ x: shape.x, y: shape.y }, viewport);
  const isEllipse = shape.type === 'ellipse';
  const interactive = activeTool === 'select';

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Пробел зажат — указателем панорамируют холст, фигуру не трогаем.
    if (!interactive || spacePressed) return;
    selectHandlers.onShapePointerDown(e, shape);
  };

  return (
    <div
      data-shape-id={shape.id}
      onPointerDown={onPointerDown}
      onPointerMove={interactive ? selectHandlers.onShapePointerMove : undefined}
      onPointerUp={interactive ? selectHandlers.onShapePointerUp : undefined}
      className={`pointer-events-auto absolute ${
        interactive && !spacePressed ? 'cursor-move' : ''
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        width: shape.width * viewport.zoom,
        height: shape.height * viewport.zoom,
        transform: `rotate(${shape.rotation}deg)`,
      }}
    >
      {/* Сама фигура */}
      <div
        className="h-full w-full"
        style={{
          borderRadius: isEllipse ? '9999px' : 0,
          backgroundColor: shape.fill,
          border: `${shape.strokeWidth}px solid ${shape.stroke}`,
          opacity: shape.opacity,
        }}
      />

      {/* Рамка выделения с маркерами: поверх фигуры, клики не перехватывает */}
      {selected && (
        <div
          className="pointer-events-none absolute"
          style={{
            inset: -(HANDLE_SIZE / 2 + 2),
            border: `1.5px solid ${SELECT_COLOR}`,
            borderRadius: isEllipse ? '9999px' : 0,
          }}
        >
          {HANDLE_POSITIONS.map(({ top, left }) => (
            <span
              key={`${top}-${left}`}
              className="absolute"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ffffff',
                border: `1.5px solid ${SELECT_COLOR}`,
                borderRadius: HANDLE_SIZE / 4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}