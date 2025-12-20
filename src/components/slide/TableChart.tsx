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
}

export function TableChart({ data, className = "" }: TableChartProps) {
  const columns = Object.keys(data);
  if (columns.length === 0) return null;

  // Get the maximum row count
  const rowCount = Math.max(...columns.map((col) => data[col].length));

  return (
    <div className={`w-full h-full overflow-auto ${className}`}>
      <table className="w-full h-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700"
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
                    className="border border-slate-200 px-3 py-2 text-slate-600"
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

