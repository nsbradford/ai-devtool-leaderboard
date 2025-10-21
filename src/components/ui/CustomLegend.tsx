import { DevTool } from '@/types/api';
import React from 'react';
import type { LegendPayload } from 'recharts/types/component/DefaultLegendContent';

/**
 * Custom legend component for the chart with interactive tool selection.
 * Allows users to click on legend items to show/hide specific tools in the chart.
 * @param payload - Legend data from Recharts
 * @param selectedTools - Set of currently selected tool IDs
 * @param setSelectedTools - Function to update selected tools
 * @param devtools - Array of available devtools for mapping names to IDs
 */
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
          <div
            key={entry.value ?? ''}
            className="flex items-center gap-0.5 cursor-pointer transition-opacity duration-200"
            style={{ opacity }}
            onClick={() => {
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
            title={`Click to ${isSelected ? 'hide' : 'show'} ${entry.value ?? ''}`}
          >
            <span
              className="inline-block w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm border"
              style={{
                backgroundColor: entry.color,
                borderColor: '#ccc',
              }}
            />
            <span className="text-xs sm:text-sm" style={{ color: entry.color }}>
              {entry.value ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
