"use client";

import {
  SlideData,
  ChartConfig,
  isTableData,
  isImageData,
  TableData,
  EChartsData,
  ImageData,
} from "@/types/slide";
import { TableChart } from "./TableChart";
import { EChartsChart } from "./EChartsChart";
import { ImageChart } from "./ImageChart";
import Image from "next/image";

interface SlideRendererProps {
  slide: SlideData;
  pageNumber?: number;
  className?: string;
  scale?: number;
  isThumbnail?: boolean;
  isFullscreen?: boolean;
}

// Render a single chart based on type
function ChartRenderer({ chart, isFullscreen = false }: { chart: ChartConfig; isFullscreen?: boolean }) {
  switch (chart.type) {
    case "table":
      return <TableChart data={chart.data as TableData} isFullscreen={isFullscreen} />;
    case "echarts":
      return <EChartsChart data={chart.data as EChartsData} isFullscreen={isFullscreen} />;
    case "image":
      return <ImageChart data={chart.data as ImageData} />;
    default:
      return null;
  }
}

// Content item component
function ContentItem({ text, textSize }: { text: string; textSize?: string }) {
  return (
    <div className={`flex items-start gap-2 text-slate-700 ${textSize || ""}`} style={{ lineHeight: '1', marginBottom: '-8px' }}>
      <span className="text-slate-400 select-none">-</span>
      <span>{text}</span>
    </div>
  );
}

export function SlideRenderer({
  slide,
  pageNumber,
  className = "",
  scale = 1,
  isThumbnail = false,
  isFullscreen = false,
}: SlideRendererProps) {
  const { title, content, charts } = slide;
  const contentCount = content.length;
  const chartCount = charts.length;

  // Adjust sizes based on view mode
  // Priority: isThumbnail > isFullscreen > normal
  const titleSize = isThumbnail ? "text-sm" : isFullscreen ? "text-3xl" : "text-xl";
  const contentTextSize = isThumbnail ? "text-xs" : isFullscreen ? "text-2xl" : "text-xs";
  const padding = isThumbnail ? "p-2" : isFullscreen ? "pt-6 px-6 pb-14" : "p-6";
  const gap = isThumbnail ? "gap-1" : "gap-4";
  const titleMargin = isThumbnail ? "mb-2" : isFullscreen ? "mb-8" : "mb-5";
  const contentChartGap = isThumbnail ? "gap-2" : "gap-12";

  // Gap between content and charts
  // Use larger gap in fullscreen mode
  const contentToChartGap = isThumbnail ? '0.5rem' : isFullscreen ? '3rem' : '2rem';

  // Gap between chart components (horizontal and vertical)
  const chartHGap = isThumbnail ? 'gap-2' : isFullscreen ? 'gap-12' : 'gap-8';
  const chartVGap = isThumbnail ? 'gap-1' : isFullscreen ? 'gap-10' : 'gap-6';

  // Padding for chart area container (left/right, bottom)
  const chartAreaPaddingX = isThumbnail ? 'px-1' : isFullscreen ? 'px-12' : 'px-8';
  const chartAreaPaddingBottom = isThumbnail ? 'pb-1' : isFullscreen ? 'pb-8' : 'pb-6';
  const chartAreaPadding = `${chartAreaPaddingX} ${chartAreaPaddingBottom}`;

  // Determine layout based on content and chart counts
  const renderLayout = () => {
    // Empty slide
    if (contentCount === 0 && chartCount === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          {title ? "" : "空白幻灯片"}
        </div>
      );
    }

    // Layout: 2 content + 1 chart (or less)
    if (contentCount <= 2 && chartCount <= 1) {
      return (
        <div className="flex-1 flex flex-col" style={{ gap: contentToChartGap }}>
          {/* Content row */}
          {contentCount > 0 && (
            <div className="flex gap-8">
              {contentCount === 1 ? (
                <div className="flex-1">
                  <ContentItem text={content[0]} textSize={contentTextSize} />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <ContentItem text={content[0]} textSize={contentTextSize} />
                  </div>
                  <div className="flex-1">
                    <ContentItem text={content[1]} textSize={contentTextSize} />
                  </div>
                </>
              )}
            </div>
          )}
          {/* Chart area */}
          {chartCount === 1 && (
            <div className={`flex-1 min-h-0 overflow-hidden ${chartAreaPadding}`}>
              <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
            </div>
          )}
        </div>
      );
    }

    // Layout: 2 content + 2 charts
    if (contentCount <= 2 && chartCount === 2) {
      return (
        <div className="flex-1 flex flex-col" style={{ gap: contentToChartGap }}>
          {/* Content row */}
          {contentCount > 0 && (
            <div className="flex gap-8">
              <div className="flex-1">
                {content[0] && <ContentItem text={content[0]} textSize={contentTextSize} />}
              </div>
              <div className="flex-1">
                {content[1] && <ContentItem text={content[1]} textSize={contentTextSize} />}
              </div>
            </div>
          )}
          {/* Charts row */}
          <div className={`flex-1 min-h-0 flex ${chartHGap} ${chartAreaPadding}`}>
            <div className="flex-1 overflow-hidden">
              <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
            </div>
            <div className="flex-1 overflow-hidden">
              <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
            </div>
          </div>
        </div>
      );
    }

    // Layout: 3 content + 3 charts
    if (contentCount === 3 && chartCount === 3) {
      return (
        <div className="flex-1 flex flex-col" style={{ gap: contentToChartGap }}>
          {/* Content row: 论点1+论点2 在左，论点3 在右 */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-0">
              <ContentItem text={content[0]} textSize={contentTextSize} />
              <ContentItem text={content[1]} textSize={contentTextSize} />
            </div>
            <div className="flex-1">
              <ContentItem text={content[2]} textSize={contentTextSize} />
            </div>
          </div>
          {/* Charts area: 左列两个小图表(上下)，右列一个大图表 */}
          <div className={`flex-1 min-h-0 flex ${chartHGap} ${chartAreaPadding}`}>
            {/* 左列：图表1(上) + 图表2(下) - 使用 flex 确保等高 */}
            <div className={`flex-1 flex flex-col ${chartVGap} min-h-0`}>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
              </div>
            </div>
            {/* 右列：图表3 占满整个高度 */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ChartRenderer chart={charts[2]} isFullscreen={isFullscreen} />
            </div>
          </div>
        </div>
      );
    }

    // Layout: 4 content + 4 charts
    if (contentCount === 4 && chartCount === 4) {
      return (
        <div className="flex-1 flex flex-col" style={{ gap: contentToChartGap }}>
          {/* Content row */}
          <div className="flex gap-8">
            <div className="flex-1 flex flex-col gap-0">
              <ContentItem text={content[0]} textSize={contentTextSize} />
              <ContentItem text={content[1]} textSize={contentTextSize} />
            </div>
            <div className="flex-1 flex flex-col gap-0">
              <ContentItem text={content[2]} textSize={contentTextSize} />
              <ContentItem text={content[3]} textSize={contentTextSize} />
            </div>
          </div>
          {/* Charts grid 2x2 - 使用 flex 确保高度一致 */}
          <div className={`flex-1 min-h-0 flex flex-col ${chartVGap} ${chartAreaPadding}`}>
            <div className={`flex-1 flex ${chartHGap} min-h-0`}>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[2]} isFullscreen={isFullscreen} />
              </div>
            </div>
            <div className={`flex-1 flex ${chartHGap} min-h-0`}>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <ChartRenderer chart={charts[3]} isFullscreen={isFullscreen} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default fallback layout: flexible grid
    return (
      <div className="flex-1 flex flex-col" style={{ gap: contentToChartGap }}>
        {/* Content section */}
        {contentCount > 0 && (
          <div
            className={`grid gap-4 ${contentCount <= 2 ? "grid-cols-2" : "grid-cols-2"
              }`}
          >
            {content.map((text, index) => (
              <div key={index}>
                <ContentItem text={text} textSize={contentTextSize} />
              </div>
            ))}
          </div>
        )}
        {/* Charts section */}
        {chartCount > 0 && (
          <>
            {chartCount === 1 && (
              <div className={`flex-1 min-h-0 overflow-hidden ${chartAreaPadding}`}>
                <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
              </div>
            )}
            {chartCount === 2 && (
              <div className={`flex-1 min-h-0 flex ${chartHGap} ${chartAreaPadding}`}>
                <div className="flex-1 overflow-hidden">
                  <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
                </div>
              </div>
            )}
            {chartCount === 3 && (
              <div className={`flex-1 min-h-0 flex ${chartHGap} ${chartAreaPadding}`}>
                {/* 左列：前两个图表上下排列 */}
                <div className={`flex-1 flex flex-col ${chartVGap} min-h-0`}>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
                  </div>
                </div>
                {/* 右列：第3个图表占满高度 */}
                <div className="flex-1 overflow-hidden min-h-0">
                  <ChartRenderer chart={charts[2]} isFullscreen={isFullscreen} />
                </div>
              </div>
            )}
            {chartCount === 4 && (
              <div className={`flex-1 min-h-0 flex flex-col ${chartVGap} ${chartAreaPadding}`}>
                <div className={`flex-1 flex ${chartHGap} min-h-0`}>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[0]} isFullscreen={isFullscreen} />
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[1]} isFullscreen={isFullscreen} />
                  </div>
                </div>
                <div className={`flex-1 flex ${chartHGap} min-h-0`}>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[2]} isFullscreen={isFullscreen} />
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChartRenderer chart={charts[3]} isFullscreen={isFullscreen} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
      style={{
        width: isThumbnail ? "960px" : "100%",
        height: isThumbnail ? "540px" : "100%",
        aspectRatio: "16/9",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
      }}
    >
      <div className={`w-full h-full flex flex-col ${padding} relative`}>
        {/* Title */}
        {title && (
          <h1 className={`${titleSize} font-bold ${titleMargin} shrink-0 leading-none`} style={{ color: '#1a4f99' }}>
            {title}
          </h1>
        )}

        {/* Main content area */}
        {renderLayout()}

        {/* Page number */}
        {pageNumber !== undefined && (
          <div className={`absolute ${isThumbnail ? "bottom-1 right-2 text-xs" : isFullscreen ? "bottom-4 right-6 text-xl" : "bottom-3 right-4 text-sm"}`} style={{ color: '#1a4f99' }}>
            {pageNumber}
          </div>
        )}

        {/* WeBank Logo - Bottom Left */}
        <div className={`absolute ${isThumbnail ? "bottom-1 left-2" : isFullscreen ? "bottom-4 left-6" : "bottom-3 left-4"} flex items-center`}>
          <Image
            src="/webank-logo.png"
            alt="WeBank Logo"
            width={isThumbnail ? 36 : isFullscreen ? 100 : 60}
            height={isThumbnail ? 12 : isFullscreen ? 33 : 20}
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

