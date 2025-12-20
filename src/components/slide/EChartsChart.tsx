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
    const mergedOption: echarts.EChartsOption = {
      ...option,
      grid: {
        left: 8,
        right: 8,
        top: 8,
        bottom: 8,
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

