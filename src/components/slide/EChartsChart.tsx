"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsData } from "@/types/slide";

interface EChartsChartProps {
  data: EChartsData;
  className?: string;
}

export function EChartsChart({ data, className = "" }: EChartsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Merge default grid settings to maximize chart space
    const option = data as echarts.EChartsOption;
    
    // Calculate appropriate top margin based on title and legend presence
    const hasTitle = option.title && (
      (typeof option.title === 'object' && !Array.isArray(option.title) && option.title.text) ||
      (Array.isArray(option.title) && option.title.length > 0)
    );
    const hasLegend = option.legend && (
      (typeof option.legend === 'object' && !Array.isArray(option.legend)) ||
      (Array.isArray(option.legend) && option.legend.length > 0)
    );
    
    // Only apply tight grid margins if there's no title/legend that needs space
    const defaultTop = hasTitle || hasLegend ? undefined : 8;
    const defaultBottom = hasLegend ? undefined : 8;
    
    const mergedOption: echarts.EChartsOption = {
      ...option,
      grid: {
        left: undefined,
        right: undefined,
        ...(defaultTop !== undefined ? { top: defaultTop } : {}),
        ...(defaultBottom !== undefined ? { bottom: defaultBottom } : {}),
        containLabel: true,
        ...(option.grid as object || {}),
      },
    };

    // Set options
    chartInstance.current.setOption(mergedOption, true);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className={`w-full h-full ${className}`}
    />
  );
}

