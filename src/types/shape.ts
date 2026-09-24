/**
 * Типы — единый язык проекта.
 * Все модули говорят о фигурах, инструментах и координатах одними словами,
 * а TypeScript ловит ошибки ещё до запуска.
 */

/** Инструменты, доступные на панели слева. */
export type Tool = 'select' | 'rect' | 'ellipse';

/** Геометрические примитивы, которые умеет рисовать mini-figma. */
export type ShapeType = 'rect' | 'ellipse';

/** Точка на плоскости (внутренние, «мировые» координаты канваса). */
export interface Point {
  x: number;
  y: number;
}

/**
 * Прямоугольная область в мировых координатах: x/y — левый верхний угол,
 * width/height — всегда неотрицательные размеры (как у фигур на холсте).
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Фигура на холсте. x/y — левый верхний угол в мировых координатах,
 * width/height — размеры в мировых единицах (не в пикселях экрана).
 */
export interface Shape {
  id: string;
  name: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
}

/**
 * Состояние камеры: сдвиг холста (в экранных px) и зум (0.1–4).
 * Используется и в математике (utils/geometry.ts), и в рендере (Canvas/Shape).
 */
export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}