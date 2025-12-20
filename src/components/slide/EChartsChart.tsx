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

    // Set options
    chartInstance.current.setOption(data as echarts.EChartsOption, true);

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
      className={`w-full h-full min-h-[200px] ${className}`}
    />
  );
}

