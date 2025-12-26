# 幻灯片 JSON 编写规则文档

本文档描述了 Macro PPT Studio 中幻灯片数据的 JSON 结构、渲染规则以及各种图表类型的配置方法。

## 核心数据结构

整个演示文稿 (`PPTReport`) 是一个 `SlideData` 对象的数组。

### SlideData (单页幻灯片)

每个幻灯片对象包含标题、文本内容列表和图表配置列表。

```typescript
interface SlideData {
  title?: string;         // 幻灯片标题（可选）
  content: string[];      // 文本内容列表（论点）
  charts: ChartConfig[];  // 图表配置列表
}
```

### ChartConfig (图表配置)

图表配置支持三种类型：`table` (表格), `echarts` (ECharts 图表), `image` (图片)。

```typescript
interface ChartConfig {
  type: "table" | "echarts" | "image";
  data: TableData | EChartsData | ImageData;
}
```

---

## 布局渲染规则

系统根据 `content` (文本段落数) 和 `charts` (图表数) 的数量自动选择最佳布局。

### 1. 基础布局 (≤2 文本, ≤1 图表)
*   **适用场景**: 少量文本，单图表或无图表。
*   **布局**: 垂直排列。上方为文本列表，下方为图表（全宽）。

### 2. 双图并行 (≤2 文本, 2 图表)
*   **适用场景**: 少量文本，主要展示两个对比图表。
*   **布局**: 垂直排列。上方为文本列表，下方为两个图表并排显示（左右平分）。

### 3. 三点三图 (3 文本, 3 图表)
*   **适用场景**: 复杂的论证，需要三个论点和三个对应图表。
*   **布局**:
    *   **文本区**: 分为左右两列。左列显示前2个论点，右列显示第3个论点。
    *   **图表区**:
        *   **左侧**: 第1个图表占据左半部分（全高）。
        *   **右侧**: 第2和第3个图表垂直堆叠在右半部分。

### 4. 四点四图 (4 文本, 4 图表)
*   **适用场景**: 四象限分析或四组数据对比。
*   **布局**:
    *   **文本区**: 左右两列，每列2个论点。
    *   **图表区**: 2x2 网格布局。
        *   第一行: 图表1, 图表3 (注意顺序)
        *   第二行: 图表2, 图表4

### 5. 通用网格 (Fallback)
*   **适用场景**: 不符合上述特定规则的其他情况。
*   **布局**:
    *   **文本区**: 超过2条文本时自动分两列显示。
    *   **图表区**: 根据图表数量自动网格化（1个全宽，2个并排，3个左1右2，4个2x2）。

---

## 图表数据配置详解

### 1. 表格 (Table)

表格数据采用 **按列存储** 的结构。

```typescript
// type: "table"
interface TableData {
  [columnName: string]: CellValue[];
}

type CellValue = string | number | StyledCellValue;
```

#### 样式化单元格 (StyledCellValue)
单元格不仅可以是简单的字符串或数字，也可以是包含样式信息的对象。

```typescript
interface StyledCellValue {
  value: string | number;
  "font-weight"?: string; // 例如: "bold"
  color?: string;         // 例如: "#ff0000", "red"
  [key: string]: any;     // 支持其他 CSS 属性（kebab-case）
}
```

**示例 JSON**:
```json
{
  "type": "table",
  "data": {
    "指标": ["GDP", "CPI", "PPI"],
    "数值": [
      { "value": "5.2%", "font-weight": "bold", "color": "red" },
      "0.3%",
      "-2.5%"
    ]
  }
}
```

### 2. ECharts 图表 (ECharts)

直接透传 ECharts 的配置对象 (Option)。支持 ECharts 所有标准配置。

```typescript
// type: "echarts"
type EChartsData = Record<string, unknown>; // ECharts Option 对象
```

**示例 JSON**:
```json
{
  "type": "echarts",
  "data": {
    "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
    "yAxis": { "type": "value" },
    "series": [{ "data": [820, 932, 901], "type": "line" }]
  }
}
```

### 3. 图片 (Image)

用于引用外部图片链接。

```typescript
// type: "image"
interface ImageData {
  src: string; // 图片 URL
}
```

**示例 JSON**:
```json
{
  "type": "image",
  "data": {
    "src": "https://example.com/chart.png"
  }
}
```

---

## 完整示例

```json
[
  {
    "title": "2024年宏观经济展望",
    "content": [
      "经济增长预期保持稳健，预计全年GDP增速目标为5%左右。",
      "通胀水平温和可控，CPI预计小幅回升。"
    ],
    "charts": [
      {
        "type": "echarts",
        "data": {
          "title": { "text": "GDP增速预测" },
          "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3", "Q4"] },
          "yAxis": { "type": "value" },
          "series": [{ "type": "bar", "data": [4.5, 5.0, 5.2, 5.5] }]
        }
      },
      {
        "type": "table",
        "data": {
          "季度": ["Q1", "Q2", "Q3", "Q4"],
          "预测值": [
             "4.5%",
             { "value": "5.0%", "font-weight": "bold" },
             "5.2%",
             "5.5%"
          ]
        }
      }
    ]
  }
]
```
