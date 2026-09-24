import { TOOLS } from '../constants/tools';
import type { Tool } from '../types/shape';

interface ToolbarProps {
  /** Какой инструмент активен сейчас (подсвечен на панели). */
  activeTool: Tool;
  /** Пользователь выбрал инструмент (клик по кнопке). */
  onToolChange: (tool: Tool) => void;
}

/**
 * Панель инструментов слева: выбор (курсор / прямоугольник / эллипс).
 * Активный инструмент живёт в App и передаётся сюда — один источник правды.
 */
export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <aside className="absolute left-0 top-0 z-10 flex h-full w-12 flex-col items-center gap-1 border-r border-slate-800 bg-slate-950 px-1.5 py-3 shadow-sm">
      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.shortcut})`}
            aria-pressed={isActive}
            onClick={() => onToolChange(tool.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
              isActive
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tool.icon}
          </button>
        );
      })}
    </aside>
  );
}
