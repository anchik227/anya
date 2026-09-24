import { useMemo, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { useShapes } from './hooks/useShapes';
import { useViewport } from './hooks/useViewport';
import { useHotkeys } from './hooks/useHotkeys';
import { DEFAULT_TOOL } from './constants/tools';
import type { Tool } from './types/shape';

/**
 * Сборка приложения: холст на весь экран + три панели.
 * Камера (useViewport) и фигуры (useShapes) живут здесь — так холсту,
 * панели инструментов и панели свойств нужны одни и те же данные:
 * один и тот же viewport и один активный инструмент.
 */
export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>(DEFAULT_TOOL);
  const { viewport, isPanning, spacePressed, canvasRef, handlers } = useViewport();
  const { shapes, selectedIds, draft, updateShape, select, drawHandlers, selectHandlers } =
    useShapes(viewport, activeTool);
  useHotkeys({ onToolChange: setActiveTool });

  const selectedShapes = useMemo(
    () => shapes.filter((shape) => selectedIds.includes(shape.id)),
    [shapes, selectedIds],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 font-sans text-slate-100">
      <Canvas
        shapes={shapes}
        draft={draft}
        activeTool={activeTool}
        viewport={viewport}
        canvasRef={canvasRef}
        isPanning={isPanning}
        spacePressed={spacePressed}
        selectedIds={selectedIds}
        viewportHandlers={handlers}
        drawHandlers={drawHandlers}
        selectHandlers={selectHandlers}
      />

      {/* Левая панель — инструменты */}
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* Правая колонка — слои сверху, свойства снизу */}
      <div className="absolute right-0 top-0 z-10 flex h-full flex-col">
        <LayersPanel shapes={shapes} selectedIds={selectedIds} onSelect={(id) => select(id)} />
        <PropertiesPanel selectedShapes={selectedShapes} onUpdateShape={updateShape} />
      </div>
    </div>
  );
}
