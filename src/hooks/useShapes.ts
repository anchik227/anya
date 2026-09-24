import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point, Shape, ShapeType, Tool, Viewport } from '../types/shape';
import { rectFromPoints, screenToWorld, translatePoint } from '../utils/geometry';

/** Входные данные для создания фигуры (рисуется рамкой мыши). */
export interface CreateShapeInput {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Обработчики указателя для рисования фигуры перетаскиванием по холсту. */
export interface DrawHandlers {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * Обработчики выделения и перетаскивания фигур (инструмент select).
 * Нажатие на фигуру выделяет её и начинает перетаскивание, движение и отпускание
 * слушают саму фигуру (указатель захвачен), клик по пустому холсту снимает выделение.
 */
export interface SelectHandlers {
  /** Клик по пустому месту холста — снять выделение. */
  onCanvasPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  /** Клик/перетаскивание по фигуре — выделить и двигать. */
  onShapePointerDown: (e: ReactPointerEvent<HTMLDivElement>, shape: Shape) => void;
  onShapePointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onShapePointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

let nextId = 1;
const nextShapeId = (): string => `shape-${nextId++}`;

/** Фиксированный id превью: фигуры, которую тянут мышью прямо сейчас. */
const DRAFT_ID = 'draft';

/** Минимальный размер в экранных px: меньший «клик» считается промахом. */
const MIN_DRAW_SIZE_PX = 3;

const isDrawTool = (tool: Tool): boolean => tool === 'rect' || tool === 'ellipse';

const makeDraft = (type: ShapeType, origin: Point): Shape => ({
  id: DRAFT_ID,
  name: type === 'ellipse' ? 'Ellipse' : 'Rectangle',
  type,
  x: origin.x,
  y: origin.y,
  width: 0,
  height: 0,
  fill: '#9747ff',
  stroke: '#000000',
  strokeWidth: 0,
  opacity: 1,
  rotation: 0,
});

/**
 * Состояние фигур мини-фигмы: список, добавление, изменение, удаление,
 * выделение. Плюс рисование фигур: перетаскивание мышью по холсту
 * с пересчётом экранных координат в мировые (зум + панорамирование).
 */
export function useShapes(viewport: Viewport, activeTool: Tool) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  /** Превью фигуры, которую тянем («null» — не рисуем). */
  const [draft, setDraft] = useState<Shape | null>(null);

  // Актуальные значения для стабильных обработчиков указателя
  // (зум/панорамирование и инструмент меняются независимо от рисования).
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const toolRef = useRef(activeTool);
  toolRef.current = activeTool;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const dragRef = useRef<{ start: Point; current: Point } | null>(null);
  /** Данные для перетаскивания фигуры: фиксированная стартовая позиция + точка мыши. */
  const moveRef = useRef<{ id: string; origin: Point; start: Point } | null>(null);

  const addShape = useCallback((input: CreateShapeInput): Shape => {
    const shape: Shape = {
      id: nextShapeId(),
      name: input.type === 'rect' ? 'Rectangle' : 'Ellipse',
      type: input.type,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      fill: '#9747ff',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      rotation: 0,
    };
    setShapes((prev) => [...prev, shape]);
    return shape;
  }, []);

  const updateShape = useCallback(
    (id: string, patch: Partial<Omit<Shape, 'id'>>) => {
      setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const removeShapes = useCallback((ids: readonly string[]) => {
    setShapes((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  }, []);

  const select = useCallback((id: string | null, additive = false) => {
    setSelectedIds((prev) => {
      if (id === null) return [];
      if (additive) {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  /** Начали тянуть рамку: экранные координаты -> мировые с учётом камеры. */
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDrawTool(toolRef.current)) return;
    const start = screenToWorld({ x: e.clientX, y: e.clientY }, viewportRef.current);
    dragRef.current = { start, current: start };
    // Захват указателя, чтобы move/up доходили даже вне границ холста.
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraft(makeDraft(toolRef.current as ShapeType, start));
  }, []);

  /** Тянем рамку: обновляем превью в мировых координатах. */
  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const current = screenToWorld({ x: e.clientX, y: e.clientY }, viewportRef.current);
    drag.current = current;
    setDraft((prev) =>
      prev ? { ...prev, ...rectFromPoints(drag.start, current) } : prev,
    );
  }, []);

  /** Отпустили мышь: фиксируем фигуру либо отменяем промах-клик. */
  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const rect = rectFromPoints(drag.start, drag.current);
    setDraft(null);
    const minSize = MIN_DRAW_SIZE_PX / viewportRef.current.zoom;
    if (rect.width < minSize || rect.height < minSize) return;
    const shape = addShape({ type: toolRef.current as ShapeType, ...rect });
    select(shape.id);
  }, [addShape, select]);

  /** Клик по пустому холсту (инструмент select) — снять выделение. */
  const onCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (toolRef.current !== 'select') return;
      // Клик по фигуре обрабатывает сама фигура (onShapePointerDown) — не трогаем.
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-shape-id]')) return;
      select(null);
    },
    [select],
  );

  /** Клик по фигуре: выделяем и готовим перетаскивание в мировых координатах. */
  const onShapePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, shape: Shape) => {
      if (toolRef.current !== 'select') return;
      const isAlreadySelected = selectedIdsRef.current.includes(shape.id);
      select(shape.id, e.shiftKey);
      // Shift+клик по уже выделенной фигуре снимает выделение — не двигаем.
      if (e.shiftKey && isAlreadySelected) return;
      const start = screenToWorld({ x: e.clientX, y: e.clientY }, viewportRef.current);
      moveRef.current = { id: shape.id, origin: { x: shape.x, y: shape.y }, start };
      // Захват указателя: move/up доходят даже если мышь выехала за границы фигуры.
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [select],
  );

  /** Тянем фигуру: сдвиг мыши в мировых координатах прибавляем к стартовой позиции. */
  const onShapePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const move = moveRef.current;
      if (!move) return;
      const current = screenToWorld({ x: e.clientX, y: e.clientY }, viewportRef.current);
      const next = translatePoint(move.origin, current.x - move.start.x, current.y - move.start.y);
      updateShape(move.id, { x: next.x, y: next.y });
    },
    [updateShape],
  );

  /** Отпустили фигуру — перетаскивание закончено. */
  const onShapePointerUp = useCallback(() => {
    moveRef.current = null;
  }, []);

  return {
    shapes,
    selectedIds,
    draft,
    addShape,
    updateShape,
    removeShapes,
    select,
    drawHandlers: { onPointerDown, onPointerMove, onPointerUp },
    selectHandlers: {
      onCanvasPointerDown,
      onShapePointerDown,
      onShapePointerMove,
      onShapePointerUp,
    },
  };
}