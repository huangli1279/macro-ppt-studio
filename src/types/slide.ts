// Cell value type for tables - can be a simple value or styled value
export interface StyledCellValue {
  value: string | number;
  "font-weight"?: string;
  color?: string;
  [key: string]: string | number | undefined; // Allow other CSS properties
}

export type CellValue = string | number | StyledCellValue;

// Table data: column name -> array of cell values
export interface TableData {
  [columnName: string]: CellValue[];
}

// Image data
export interface ImageData {
  src: string;
}

// ECharts configuration (using a flexible type to support all ECharts options)
export type EChartsData = Record<string, unknown>;

// Chart configuration
export interface ChartConfig {
  type: "table" | "echarts" | "image";
  data: TableData | EChartsData | ImageData;
}

// Single slide data
export interface SlideData {
  title?: string;
  content: string[];
  charts: ChartConfig[];
}

// Complete PPT report (array of slides)
export type PPTReport = SlideData[];

// Helper type guards
export function isTableData(data: unknown): data is TableData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Object.values(obj).every((val) => Array.isArray(val));
}

export function isImageData(data: unknown): data is ImageData {
  if (typeof data !== "object" || data === null) return false;
  return "src" in data && typeof (data as ImageData).src === "string";
}

export function isStyledCellValue(value: CellValue): value is StyledCellValue {
  return typeof value === "object" && value !== null && "value" in value;
}

// Get display value from cell
export function getCellDisplayValue(cell: CellValue): string | number {
  if (isStyledCellValue(cell)) {
    return cell.value;
  }
  return cell;
}

// Get cell style from cell value
export function getCellStyle(cell: CellValue): React.CSSProperties {
  if (!isStyledCellValue(cell)) {
    return {};
  }

  const style: React.CSSProperties = {};
  const { value, ...cssProps } = cell;

  // Map common properties
  if (cssProps["font-weight"]) {
    style.fontWeight = cssProps["font-weight"] as string;
  }
  if (cssProps.color) {
    style.color = cssProps.color as string;
  }

  // Add any other CSS properties
  Object.entries(cssProps).forEach(([key, val]) => {
    if (key !== "font-weight" && val !== undefined) {
      // Convert kebab-case to camelCase for React
      const camelKey = key.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      (style as Record<string, unknown>)[camelKey] = val;
    }
  });

  return style;
}

