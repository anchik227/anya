import type { RefObject } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Shape as ShapeModel, Tool, Viewport } from '../types/shape';
import type { ViewportHandlers } from '../hooks/useViewport';
import type { DrawHandlers, SelectHandlers } from '../hooks/useShapes';
import { Shape } from './Shape';

/** Размер ячейки сетки в мировых координатах при zoom = 1. */
const GRID_SIZE = 20;

interface CanvasProps {
  shapes: ShapeModel[];
  /** Превью фигуры, которую тянем мышью (рисуется поверх остальных). */
  draft: ShapeModel | null;
  /** Активный инструмент — влияет на курсор и на разрешение рисования. */
  activeTool: Tool;
  viewport: Viewport;
  canvasRef: RefObject<HTMLDivElement>;
  isPanning: boolean;
  spacePressed: boolean;
  /** id выделенных фигур — им рисуется рамка с маркерами. */
  selectedIds: readonly string[];
  /** Обработчики камеры (пробел + перетаскивание) из useViewport. */
  viewportHandlers: ViewportHandlers;
  /** Обработчики рисования фигуры из useShapes. */
  drawHandlers: DrawHandlers;
  /** Обработчики выделения/перетаскивания фигур из useShapes. */
  selectHandlers: SelectHandlers;
}

/**
 * Холст на весь экран с сеткой на фоне.
 * Сетка «живёт» вместе с камерой: background-size и background-position
 * пересчитываются от зума и панорамирования — сразу видно, что камера работает.
 * Указатель сюда приходят два потока: панорамирование (пробел) и рисование
 * (инструмент rect/ellipse) — они не пересекаются, каждый проверяет своё.
 */
export function Canvas({
  shapes,
  draft,
  activeTool,
  viewport,
  canvasRef,
  isPanning,
  spacePressed,
  selectedIds,
  viewportHandlers,
  drawHandlers,
  selectHandlers,
}: CanvasProps) {
  const gridPx = GRID_SIZE * viewport.zoom;
  const gridOffsetX = viewport.panX % gridPx;
  const gridOffsetY = viewport.panY % gridPx;

  const isDrawTool = activeTool === 'rect' || activeTool === 'ellipse';
  const cursor = isPanning
    ? 'grabbing'
    : spacePressed
      ? 'grab'
      : isDrawTool
        ? 'crosshair'
        : 'default';

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    viewportHandlers.onPointerDown(e); // панорамирование: работает только с пробелом
    if (!spacePressed) {
      drawHandlers.onPointerDown(e);
      selectHandlers.onCanvasPointerDown(e); // select: клик по пустому месту снимает выделение
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    viewportHandlers.onPointerMove(e);
    drawHandlers.onPointerMove(e);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    viewportHandlers.onPointerUp();
    drawHandlers.onPointerUp(e);
  };
  const onPointerLeave = () => {
    viewportHandlers.onPointerLeave();
  };

  return (
    <div
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className="absolute inset-0 overflow-hidden bg-slate-900"
      style={{
        cursor,
        touchAction: 'none',
        backgroundImage:
          'linear-gradient(to right, #1e293b 1px, transparent 1px),' +
          'linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
        backgroundSize: `${gridPx}px ${gridPx}px`,
        backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
      }}
    >
      {shapes.map((shape) => (
        <Shape
          key={shape.id}
          shape={shape}
          viewport={viewport}
          selected={selectedIds.includes(shape.id)}
          activeTool={activeTool}
          spacePressed={spacePressed}
          selectHandlers={selectHandlers}
        />
      ))}
      {/* Превью пока тянем рамку: те же мировые координаты, что и у фигур */}
      {draft && (
        <Shape
          key={draft.id}
          shape={draft}
          viewport={viewport}
          selected={false}
          activeTool={activeTool}
          spacePressed={spacePressed}
          selectHandlers={selectHandlers}
        />
      )}
    </div>
  );
}
