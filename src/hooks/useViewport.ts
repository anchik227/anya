import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { Viewport } from '../types/shape';
import { zoomAt } from '../utils/geometry';

/** Множитель зума за одно «щёлканье» колеса. */
export const ZOOM_STEP = 1.1;

/** Обработчики указателя для холста (spread — просто накинуть на div). */
export interface ViewportHandlers {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}

export interface UseViewportResult {
  viewport: Viewport;
  /** true, пока тянем холст с зажатым пробелом. */
  isPanning: boolean;
  /** true, пока зажат пробел (курсор — «ладонь», даже без перетаскивания). */
  spacePressed: boolean;
  /** ref для холста: на него вешаются wheel-слушатель и обработчики. */
  canvasRef: RefObject<HTMLDivElement>;
  handlers: ViewportHandlers;
}

/**
 * Камера в мини-фигме:
 * - панорамирование: зажать пробел + перетащить мышью;
 * - зум колесом от 10% до 400% вокруг курсора;
 * - центрирование мира (точка 0,0) при старте.
 */
export function useViewport(): UseViewportResult {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  const spaceRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Центрируем мир в центре холста при старте.
  useEffect(() => {
    const el = canvasRef.current;
    const w = el?.clientWidth ?? window.innerWidth;
    const h = el?.clientHeight ?? window.innerHeight;
    setViewport({ zoom: 1, panX: w / 2, panY: h / 2 });
  }, []);

  // Отслеживаем пробел на уровне окна.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spaceRef.current = true;
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setSpacePressed(false);
        setIsPanning(false);
        lastPointRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Зум колесом. Слушатель не-passive, иначе preventDefault() не сработает.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      setViewport((prev) =>
        zoomAt({ x: e.clientX, y: e.clientY }, prev.zoom * factor, prev),
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Панорамирование: пробел + перетаскивание.
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!spaceRef.current) return;
    e.preventDefault();
    // Захват указателя, чтобы move/up доходили даже вне границ холста.
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const last = lastPointRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setViewport((prev) => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }));
  }, []);

  const stopPanning = useCallback(() => {
    setIsPanning(false);
    lastPointRef.current = null;
  }, []);

  return {
    viewport,
    isPanning,
    spacePressed,
    canvasRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopPanning,
      onPointerLeave: stopPanning,
    },
  };
}