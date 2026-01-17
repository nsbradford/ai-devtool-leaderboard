import { DevTool } from '@/types/api';
import type { LegendPayload } from 'recharts/types/component/DefaultLegendContent';

export function CustomLegend({
  payload,
  selectedTools,
  setSelectedTools,
  devtools,
}: {
  payload?: LegendPayload[];
  selectedTools: Set<number>;
  setSelectedTools: (tools: Set<number>) => void;
  devtools?: DevTool[];
}) {
  if (!payload || !devtools) return null;

  const getToolIdFromDisplayName = (displayName: string): number | null => {
    const devtool = devtools.find((dt: DevTool) => dt.name === displayName);
    return devtool ? devtool.id : null;
  };

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 sm:gap-3 items-center justify-center mt-2 w-full">
      {payload.map((entry) => {
        const toolId = getToolIdFromDisplayName(entry.value ?? '');
        const isSelected = toolId ? selectedTools.has(toolId) : true;
        const opacity = isSelected ? 1 : 0.5;

        return (
          <label
            key={entry.value ?? ''}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-200"
            style={{ opacity }}
            title={`Click to ${isSelected ? 'hide' : 'show'} ${entry.value ?? ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {
                if (toolId) {
                  const newSelected = new Set(selectedTools);
                  if (isSelected) {
                    newSelected.delete(toolId);
                  } else {
                    newSelected.add(toolId);
                  }
                  setSelectedTools(newSelected);
                }
              }}
              className="w-4 h-4 cursor-pointer appearance-none rounded-sm border"
              style={{
                backgroundColor: isSelected ? entry.color : 'transparent',
                borderColor: entry.color,
              }}
            />
            <span className="text-xs sm:text-sm" style={{ color: entry.color }}>
              {entry.value ?? ''}
            </span>
          </label>
        );
      })}
    </div>
  );
}
