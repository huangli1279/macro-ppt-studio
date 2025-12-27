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

    // Set font size based on fullscreen mode
    const fontSize = isFullscreen ? 16 : 8;

    // Default Configuration
    const defaultColor = [
      "#D80C18",
      "#1E53A4",
      "#C1EBFF",
      "#CADBF5",
      "#FFC000",
      "#DAF2D0",
      "#AFABAB",
    ];

    const defaultTitle = {
      left: "center",
      top: "top",
    };

    const defaultLegend = {
      top: "bottom",
      left: "center",
    };

    const defaultTooltip = {
      trigger: "axis",
    };

    // Helper to deeply merge simple objects (1-level deep for config objects)
    const mergeConfig = (def: Record<string, any>, user: any) => {
      if (!user) return { ...def };
      if (typeof user !== "object" || Array.isArray(user)) return user;
      return { ...def, ...user };
    };

    // Merge configurations
    const mergedTitle = mergeConfig(defaultTitle, option.title);
    const mergedLegend = mergeConfig(defaultLegend, option.legend);
    const mergedTooltip = mergeConfig(defaultTooltip, option.tooltip);
    const mergedColor = option.color || defaultColor;

    const mergedOption: echarts.EChartsOption = {
      ...option,
      color: mergedColor,
      textStyle: {
        fontSize: fontSize,
        ...(option.textStyle as object || {}),
      },
      title: Array.isArray(mergedTitle)
        ? mergedTitle
        : {
          ...mergedTitle,
          textStyle: {
            fontSize: isFullscreen ? 22 : 12,
            ...(mergedTitle.textStyle || {}),
          },
        },
      legend: Array.isArray(mergedLegend)
        ? mergedLegend
        : {
          ...mergedLegend,
          textStyle: {
            fontSize: fontSize,
            ...(mergedLegend.textStyle || {}),
          },
        },
      tooltip: Array.isArray(mergedTooltip)
        ? mergedTooltip
        : {
          ...mergedTooltip,
          textStyle: {
            fontSize: isFullscreen ? 14 : 8,
            ...((mergedTooltip.textStyle as object) || {}),
          },
        },
      grid: {
        left: isFullscreen ? 24 : 16,
        right: isFullscreen ? 24 : 16,
        top: isFullscreen ? 72 : 42,
        bottom: isFullscreen ? 68 : 32,
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

