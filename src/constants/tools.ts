import type { Tool } from '../types/shape';

/** Описание инструмента для панели и горячих клавиш. */
export interface ToolDefinition {
  id: Tool;
  label: string;
  /** Буква-клавиша для быстрого выбора (v / r / o). */
  shortcut: string;
  /** Символ для кнопки на панели. */
  icon: string;
}

/**
 * Список инструментов в порядке отображения на панели.
 * Захотели добавить инструмент или поменять клавишу — правим только этот файл.
 */
export const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Select', shortcut: 'v', icon: '🖱' },
  { id: 'rect', label: 'Rect', shortcut: 'r', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'o', icon: '◯' },
];

export const DEFAULT_TOOL: Tool = 'select';

/** shortcut -> Tool. Ключи намеренно в нижнем регистре. */
export const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((tool) => [tool.shortcut, tool.id]),
);