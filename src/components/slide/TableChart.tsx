"use client";

import {
  TableData,
  CellValue,
  getCellDisplayValue,
  getCellStyle,
} from "@/types/slide";

interface TableChartProps {
  data: TableData;
  className?: string;
  isFullscreen?: boolean;
}

export function TableChart({ data, className = "", isFullscreen = false }: TableChartProps) {
  const columns = Object.keys(data);
  if (columns.length === 0) return null;

  // Get the maximum row count
  const rowCount = Math.max(...columns.map((col) => data[col].length));

  // Adjust font size based on fullscreen mode
  const textSize = isFullscreen ? "text-base" : "text-[10px]";

  return (
    <div className={`w-full h-full overflow-auto ${className}`}>
      <table className={`w-full h-full border-collapse ${textSize}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border border-slate-300 bg-slate-100 px-2 py-0.5 text-center font-semibold text-slate-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {columns.map((col) => {
                const cell: CellValue | undefined = data[col][rowIndex];
                const displayValue =
                  cell !== undefined ? getCellDisplayValue(cell) : "";
                const cellStyle = cell !== undefined ? getCellStyle(cell) : {};

                return (
                  <td
                    key={col}
                    className="border border-slate-200 px-2 py-0.5 text-slate-600 text-center"
                    style={cellStyle}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

