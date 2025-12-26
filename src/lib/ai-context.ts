import { PPTReport, SlideData, ChartConfig, isTableData } from "@/types/slide";

/**
 * Extract text content from a single slide
 */
function extractSlideText(slide: SlideData, slideIndex: number): string {
    const parts: string[] = [];

    // Add slide number and title
    if (slide.title) {
        parts.push(`## 幻灯片 ${slideIndex + 1}: ${slide.title}`);
    } else {
        parts.push(`## 幻灯片 ${slideIndex + 1}`);
    }

    // Add content (arguments/bullet points)
    if (slide.content && slide.content.length > 0) {
        parts.push("\n### 内容要点:");
        slide.content.forEach((item, idx) => {
            parts.push(`- ${item}`);
        });
    }

    // Add chart information
    if (slide.charts && slide.charts.length > 0) {
        parts.push("\n### 图表数据:");
        slide.charts.forEach((chart, idx) => {
            parts.push(extractChartInfo(chart, idx));
        });
    }

    return parts.join("\n");
}

/**
 * Extract information from a chart configuration
 */
function extractChartInfo(chart: ChartConfig, chartIndex: number): string {
    const parts: string[] = [];

    if (chart.type === "table" && isTableData(chart.data)) {
        const tableData = chart.data; // Store narrowed type
        parts.push(`\n#### 表格 ${chartIndex + 1}:`);
        const columns = Object.keys(tableData);
        parts.push(`列: ${columns.join(", ")}`);

        // Extract first few rows of data as sample
        if (columns.length > 0) {
            const firstCol = columns[0];
            const rowCount = tableData[firstCol]?.length || 0;
            parts.push(`行数: ${rowCount}`);

            // Show first 3 rows as sample
            if (rowCount > 0) {
                parts.push("数据示例:");
                const sampleRows = Math.min(3, rowCount);
                for (let i = 0; i < sampleRows; i++) {
                    const rowValues = columns.map(col => {
                        const cell = tableData[col]?.[i];
                        if (typeof cell === "object" && cell !== null && "value" in cell) {
                            return String(cell.value);
                        }
                        return String(cell ?? "");
                    });
                    parts.push(`  ${rowValues.join(" | ")}`);
                }
            }
        }
    } else if (chart.type === "echarts") {
        parts.push(`\n#### ECharts 图表 ${chartIndex + 1}:`);
        const echartsData = chart.data as Record<string, unknown>;
        if (echartsData.title && typeof echartsData.title === "object") {
            const title = echartsData.title as Record<string, unknown>;
            if (title.text) {
                parts.push(`标题: ${title.text}`);
            }
        }
        if (echartsData.series && Array.isArray(echartsData.series)) {
            parts.push(`系列数量: ${echartsData.series.length}`);
        }
    } else if (chart.type === "image") {
        parts.push(`\n#### 图片 ${chartIndex + 1}`);
    }

    return parts.join("\n");
}

/**
 * Get context from current slide and surrounding slides (max 5 total)
 * @param currentIndex - Current slide index
 * @param slides - All slides
 * @returns Formatted context string for AI system prompt
 */
export function getSlideContext(currentIndex: number, slides: PPTReport): string {
    if (!slides || slides.length === 0) {
        return "当前没有幻灯片内容。";
    }

    // Calculate range: current ± 2 slides
    // Use all slides
    const startIndex = 0;
    const endIndex = slides.length - 1;

    const parts: string[] = [];
    parts.push("# 当前幻灯片上下文\n");
    parts.push(`总共 ${slides.length} 张幻灯片，当前查看第 ${currentIndex + 1} 张。\n`);

    for (let i = startIndex; i <= endIndex; i++) {
        const slide = slides[i];
        const isCurrent = i === currentIndex;

        if (isCurrent) {
            parts.push("\n---\n**【当前幻灯片】**");
        }

        parts.push(extractSlideText(slide, i));

        if (isCurrent) {
            parts.push("---\n");
        }
    }

    return parts.join("\n");
}
