import type { Point, Rect, Viewport } from '../types/shape';

/** Точка в экранных координатах (px относительно окна). */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Экранные координаты мыши -> мировые координаты канваса
 * с учётом зума и панорамирования.
 * Без этого пересчёта фигуры «уезжают» относительно курсора при зуме и сдвиге холста.
 */
export function screenToWorld(screen: ScreenPoint, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.panX) / viewport.zoom,
    y: (screen.y - viewport.panY) / viewport.zoom,
  };
}

/** Обратный пересчёт: мировые координаты -> экранные (для рендера фигур). */
export function worldToScreen(world: Point, viewport: Viewport): ScreenPoint {
  return {
    x: world.x * viewport.zoom + viewport.panX,
    y: world.y * viewport.zoom + viewport.panY,
  };
}

/**
 * Прямоугольник по двум углам перетаскивания мыши.
 * Тянем рамку из любого угла — на выходе всегда x/y = левый верхний угол
 * и неотрицательные width/height, готовые для создания фигуры.
 */
export function rectFromPoints(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/**
 * Сдвиг точки в мировых координатах на вектор (dx, dy).
 * Используется при перетаскивании фигуры: стартовая позиция + перемещение мыши.
 */
export function translatePoint(point: Point, dx: number, dy: number): Point {
  return { x: point.x + dx, y: point.y + dy };
}

export const MIN_ZOOM = 0.1; // 10%
export const MAX_ZOOM = 4; // 400%

/**
 * Зум вокруг точки под курсором: экранная точка под курсором остаётся
 * неподвижной при смене зума. Чистая математика, без состояния.
 */
export function zoomAt(
  screen: ScreenPoint,
  nextZoom: number,
  viewport: Viewport,
): Viewport {
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const world = screenToWorld(screen, viewport);
  return {
    zoom,
    panX: screen.x - world.x * zoom,
    panY: screen.y - world.y * zoom,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}