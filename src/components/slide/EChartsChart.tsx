"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsData } from "@/types/slide";

interface EChartsChartProps {
  data: EChartsData;
  className?: string;
  isFullscreen?: boolean;
}

export function EChartsChart({ data, className = "", isFullscreen = false }: EChartsChartProps) {
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

    // Set font size based on fullscreen mode
    const fontSize = isFullscreen ? 18 : 10;

    const mergedOption: echarts.EChartsOption = {
      ...option,
      textStyle: {
        fontSize: fontSize,
        ...(option.textStyle as object || {}),
      },
      title: option.title ? {
        ...(typeof option.title === 'object' && !Array.isArray(option.title) ? option.title : {}),
        textStyle: {
          fontSize: isFullscreen ? 22 : 12,
          ...((typeof option.title === 'object' && !Array.isArray(option.title) && option.title.textStyle) || {}),
        },
      } : undefined,
      legend: option.legend ? {
        ...(typeof option.legend === 'object' && !Array.isArray(option.legend) ? option.legend : {}),
        textStyle: {
          fontSize: fontSize,
          ...((typeof option.legend === 'object' && !Array.isArray(option.legend) && option.legend.textStyle) || {}),
        },
      } : undefined,
      grid: {
        left: 8,
        right: 8,
        bottom: 42,
        containLabel: true,
        ...(option.grid as object || {}),
      },
    };

    // Apply font size to xAxis
    if (option.xAxis) {
      const xAxisConfig = option.xAxis as Record<string, unknown>;
      if (Array.isArray(xAxisConfig)) {
        (mergedOption as Record<string, unknown>).xAxis = xAxisConfig.map(axis => ({
          ...axis,
          axisLabel: { fontSize: fontSize, ...(axis.axisLabel || {}) },
          nameTextStyle: { fontSize: fontSize, ...(axis.nameTextStyle || {}) },
        }));
      } else {
        (mergedOption as Record<string, unknown>).xAxis = {
          ...xAxisConfig,
          axisLabel: { fontSize: fontSize, ...(xAxisConfig.axisLabel as object || {}) },
          nameTextStyle: { fontSize: fontSize, ...(xAxisConfig.nameTextStyle as object || {}) },
        };
      }
    }

    // Apply font size to yAxis
    if (option.yAxis) {
      const yAxisConfig = option.yAxis as Record<string, unknown>;
      if (Array.isArray(yAxisConfig)) {
        (mergedOption as Record<string, unknown>).yAxis = yAxisConfig.map(axis => ({
          ...axis,
          axisLabel: { fontSize: fontSize, ...(axis.axisLabel || {}) },
          nameTextStyle: { fontSize: fontSize, ...(axis.nameTextStyle || {}) },
        }));
      } else {
        (mergedOption as Record<string, unknown>).yAxis = {
          ...yAxisConfig,
          axisLabel: { fontSize: fontSize, ...(yAxisConfig.axisLabel as object || {}) },
          nameTextStyle: { fontSize: fontSize, ...(yAxisConfig.nameTextStyle as object || {}) },
        };
      }
    }

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
  }, [data, isFullscreen]);

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

