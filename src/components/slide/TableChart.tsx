"use client";

import {
  TableChartData,
  TableData,
  CellValue,
  getCellDisplayValue,
  getCellStyle,
  isTableWithTitle,
} from "@/types/slide";

interface TableChartProps {
  data: TableChartData;
  className?: string;
  isFullscreen?: boolean;
}

export function TableChart({ data, className = "", isFullscreen = false }: TableChartProps) {
  let tableData: TableData;
  let title: string | undefined;

  if (isTableWithTitle(data)) {
    tableData = data.data;
    title = data.title;
  } else {
    tableData = data as TableData;
  }

  const columns = Object.keys(tableData);
  if (columns.length === 0) return null;

  // Get the maximum row count
  const rowCount = Math.max(...columns.map((col) => tableData[col].length));

  // Adjust font size based on fullscreen mode
  const textSize = isFullscreen ? "text-base" : "text-[10px]";
  const titleSize = isFullscreen ? "text-3xl" : "text-base";

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {title && (
        <div className={`text-slate-600 text-center mb-3 ${titleSize}`}>
          {title}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto">
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
                  const cell: CellValue | undefined = tableData[col][rowIndex];
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
    </div>
  );
}

