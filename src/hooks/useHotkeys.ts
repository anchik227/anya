import { useEffect } from 'react';
import type { Tool } from '../types/shape';
import { TOOL_BY_KEY } from '../constants/tools';

export interface UseHotkeysArgs {
  /** Вызывается при нажатии клавиши инструмента (v / r / o). */
  onToolChange?: (tool: Tool) => void;
}

/**
 * Горячие клавиши: клавиши инструментов (v / r / o) переключают активный
 * инструмент в App — тот же обработчик, что и клики на панели слева.
 */
export function useHotkeys({ onToolChange }: UseHotkeysArgs = {}): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tool = TOOL_BY_KEY[e.key.toLowerCase()];
      if (tool) onToolChange?.(tool);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToolChange]);
}
