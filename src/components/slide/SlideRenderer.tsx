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

interface SlideRendererProps {
  slide: SlideData;
  pageNumber?: number;
  className?: string;
  scale?: number;
  isThumbnail?: boolean;
}

// Render a single chart based on type
function ChartRenderer({ chart }: { chart: ChartConfig }) {
  switch (chart.type) {
    case "table":
      return <TableChart data={chart.data as TableData} />;
    case "echarts":
      return <EChartsChart data={chart.data as EChartsData} />;
    case "image":
      return <ImageChart data={chart.data as ImageData} />;
    default:
      return null;
  }
}

// Content item component
function ContentItem({ text, isThumbnail }: { text: string; isThumbnail?: boolean }) {
  return (
    <div className={`flex items-start gap-2 text-slate-700 ${isThumbnail ? "text-xs" : ""}`}>
      <span className="text-slate-400 select-none">-</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

export function SlideRenderer({
  slide,
  pageNumber,
  className = "",
  scale = 1,
  isThumbnail = false,
}: SlideRendererProps) {
  const { title, content, charts } = slide;
  const contentCount = content.length;
  const chartCount = charts.length;
  
  // Adjust sizes for thumbnail view
  const titleSize = isThumbnail ? "text-sm" : "text-2xl";
  const contentTextSize = isThumbnail ? "text-xs" : "text-base";
  const padding = isThumbnail ? "p-2" : "p-6";
  const gap = isThumbnail ? "gap-1" : "gap-4";

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
        <div className="flex-1 flex flex-col gap-4">
          {/* Content row */}
          {contentCount > 0 && (
            <div className="flex gap-8">
              {contentCount === 1 ? (
                <div className="flex-1">
                  <ContentItem text={content[0]} />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <ContentItem text={content[0]} />
                  </div>
                  <div className="flex-1">
                    <ContentItem text={content[1]} />
                  </div>
                </>
              )}
            </div>
          )}
          {/* Chart area */}
          {chartCount === 1 && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChartRenderer chart={charts[0]} />
            </div>
          )}
        </div>
      );
    }

    // Layout: 2 content + 2 charts
    if (contentCount <= 2 && chartCount === 2) {
      return (
        <div className="flex-1 flex flex-col gap-4">
          {/* Content row */}
          {contentCount > 0 && (
            <div className="flex gap-8">
              <div className="flex-1">
                {content[0] && <ContentItem text={content[0]} />}
              </div>
              <div className="flex-1">
                {content[1] && <ContentItem text={content[1]} />}
              </div>
            </div>
          )}
          {/* Charts row */}
          <div className="flex-1 min-h-0 flex gap-4">
            <div className="flex-1 overflow-hidden">
              <ChartRenderer chart={charts[0]} />
            </div>
            <div className="flex-1 overflow-hidden">
              <ChartRenderer chart={charts[1]} />
            </div>
          </div>
        </div>
      );
    }

    // Layout: 3 content + 3 charts
    if (contentCount === 3 && chartCount === 3) {
      return (
        <div className="flex-1 flex gap-4">
          {/* Left column: 2 content + 2 charts */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="space-y-1">
              <ContentItem text={content[0]} />
              <ContentItem text={content[1]} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChartRenderer chart={charts[0]} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChartRenderer chart={charts[1]} />
            </div>
          </div>
          {/* Right column: 1 content + 1 tall chart */}
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <ContentItem text={content[2]} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChartRenderer chart={charts[2]} />
            </div>
          </div>
        </div>
      );
    }

    // Layout: 4 content + 4 charts
    if (contentCount === 4 && chartCount === 4) {
      return (
        <div className="flex-1 flex flex-col gap-3">
          {/* Content row */}
          <div className="flex gap-8">
            <div className="flex-1 space-y-1">
              <ContentItem text={content[0]} />
              <ContentItem text={content[1]} />
            </div>
            <div className="flex-1 space-y-1">
              <ContentItem text={content[2]} />
              <ContentItem text={content[3]} />
            </div>
          </div>
          {/* Charts grid 2x2 */}
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-3">
            <div className="overflow-hidden">
              <ChartRenderer chart={charts[0]} />
            </div>
            <div className="overflow-hidden">
              <ChartRenderer chart={charts[2]} />
            </div>
            <div className="overflow-hidden">
              <ChartRenderer chart={charts[1]} />
            </div>
            <div className="overflow-hidden">
              <ChartRenderer chart={charts[3]} />
            </div>
          </div>
        </div>
      );
    }

    // Default fallback layout: flexible grid
    return (
      <div className="flex-1 flex flex-col gap-4">
        {/* Content section */}
        {contentCount > 0 && (
          <div
            className={`grid gap-4 ${
              contentCount <= 2 ? "grid-cols-2" : "grid-cols-2"
            }`}
          >
            {content.map((text, index) => (
              <div key={index}>
                <ContentItem text={text} />
              </div>
            ))}
          </div>
        )}
        {/* Charts section */}
        {chartCount > 0 && (
          <div
            className={`flex-1 min-h-0 grid gap-4 ${
              chartCount === 1
                ? "grid-cols-1"
                : chartCount === 2
                ? "grid-cols-2"
                : chartCount === 3
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {charts.map((chart, index) => (
              <div
                key={index}
                className={`overflow-hidden ${
                  chartCount === 3 && index === 2 ? "col-span-2" : ""
                }`}
              >
                <ChartRenderer chart={chart} />
              </div>
            ))}
          </div>
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
          <h1 className={`${titleSize} font-bold text-slate-800 mb-${isThumbnail ? "2" : "4"} shrink-0`}>
            {title}
          </h1>
        )}

        {/* Main content area */}
        {renderLayout()}

        {/* Page number */}
        {pageNumber !== undefined && (
          <div className={`absolute bottom-${isThumbnail ? "1" : "3"} right-${isThumbnail ? "2" : "4"} ${isThumbnail ? "text-xs" : "text-sm"} text-black`}>
            {pageNumber}
          </div>
        )}
      </div>
    </div>
  );
}

