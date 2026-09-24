import type { Shape as ShapeModel } from '../types/shape';

interface LayersPanelProps {
  shapes: ShapeModel[];
  selectedIds: readonly string[];
  /** Клик по слою — выделяет фигуру на холсте (select из useShapes). */
  onSelect: (id: string) => void;
}

/** Иконка фигуры по типу — как на панели инструментов. */
const TYPE_ICON: Record<ShapeModel['type'], string> = {
  rect: '▭',
  ellipse: '◯',
};

/**
 * Панель слоёв справа: список всех фигур в порядке рисования.
 * Клик по слою выделяет фигуру на канвасе — подсвеченная строка
 * совпадает с рамкой выделения на холсте.
 */
export function LayersPanel({ shapes, selectedIds, onSelect }: LayersPanelProps) {
  return (
    <section className="w-64 grow overflow-y-auto border-l border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Layers
      </h2>
      {shapes.length === 0 && <p className="text-sm text-slate-400">No layers yet</p>}
      <ul className="flex flex-col gap-1">
        {shapes.map((shape) => {
          const isSelected = selectedIds.includes(shape.id);
          return (
            <li key={shape.id}>
              <button
                type="button"
                onClick={() => onSelect(shape.id)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                  isSelected
                    ? 'bg-violet-500/20 text-violet-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span aria-hidden className="w-4 text-center">
                  {TYPE_ICON[shape.type]}
                </span>
                {shape.name}
              </button>
            </li>
          );
        })}
      </ul>
      {/* Каркас: управление слоями — шаг 4 */}
    </section>
  );
}