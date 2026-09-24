import type { Shape as ShapeModel } from '../types/shape';

interface PropertiesPanelProps {
  /** Выделенные фигуры (пустой массив — ничего не выбрано). */
  selectedShapes: ShapeModel[];
  /** Патч фигуры из useShapes: меняем fill/stroke/размеры. */
  onUpdateShape: (id: string, patch: Partial<Omit<ShapeModel, 'id'>>) => void;
}

type ColorKey = 'fill' | 'stroke';

const COLOR_FIELDS: Array<{ key: ColorKey; label: string }> = [
  { key: 'fill', label: 'Fill' },
  { key: 'stroke', label: 'Stroke' },
];

/**
 * Панель свойств справа: цвета выбранной фигуры (заливка и обводка)
 * и толщина обводки. При нескольких выделенных фигурах правка применяется
 * ко всем сразу — берём значения первой для отображения.
 */
export function PropertiesPanel({ selectedShapes, onUpdateShape }: PropertiesPanelProps) {
  const first = selectedShapes[0];

  const setColor = (key: ColorKey, value: string) => {
    selectedShapes.forEach((shape) => onUpdateShape(shape.id, { [key]: value }));
  };

  const setStrokeWidth = (value: string) => {
    const width = Number(value);
    if (!Number.isFinite(width)) return;
    selectedShapes.forEach((shape) =>
      onUpdateShape(shape.id, { strokeWidth: Math.max(0, width) }),
    );
  };

  return (
    <section className="w-64 shrink-0 border-l border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Properties
      </h2>
      {selectedShapes.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing selected</p>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            {selectedShapes.length === 1 ? first.name : `${selectedShapes.length} selected`}
          </p>

          {COLOR_FIELDS.map(({ key, label }) => (
            <label
              key={key}
              className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-400"
            >
              {label}
              <input
                type="color"
                value={first[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-7 w-16 cursor-pointer rounded border border-slate-700 bg-slate-900 p-0.5"
              />
            </label>
          ))}

          <label className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-400">
            Stroke width
            <input
              type="number"
              min={0}
              max={50}
              value={first.strokeWidth}
              onChange={(e) => setStrokeWidth(e.target.value)}
              className="h-7 w-16 rounded border border-slate-700 bg-slate-900 px-1.5 text-right text-sm text-slate-100"
            />
          </label>
        </>
      )}
    </section>
  );
}
