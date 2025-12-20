"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, X } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { SlideData, ChartConfig } from "@/types/slide";

interface SlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide?: SlideData;
  onSave: (slide: SlideData) => void;
  isEdit?: boolean;
}

const emptySlide: SlideData = {
  title: "",
  content: [],
  charts: [],
};

const defaultChartData = {
  table: {
    col1: [1, 2, 3],
    col2: [4, 5, 6],
  },
  echarts: {
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [150, 230, 224, 218, 135],
        type: "line",
      },
    ],
  },
  image: {
    src: "https://via.placeholder.com/400x300",
  },
};

export function SlideModal({
  open,
  onOpenChange,
  slide,
  onSave,
  isEdit = false,
}: SlideModalProps) {
  const [mode, setMode] = useState<"config" | "source">("config");
  const [formData, setFormData] = useState<SlideData>(slide || emptySlide);
  const [sourceCode, setSourceCode] = useState("");
  // Store chart data as strings for editing
  const [chartDataStrings, setChartDataStrings] = useState<string[]>([]);

  // Sync form data when slide changes
  useEffect(() => {
    const data = slide || emptySlide;
    setFormData(data);
    setSourceCode(JSON.stringify(data, null, 2));
    // Initialize chart data strings
    setChartDataStrings(
      data.charts.map((chart) => JSON.stringify(chart.data, null, 2))
    );
  }, [slide, open]);

  // Sync source code when form data changes in config mode
  useEffect(() => {
    if (mode === "config") {
      setSourceCode(JSON.stringify(formData, null, 2));
    }
  }, [formData, mode]);

  // Update title
  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, title: value }));
  };

  // Content management
  const addContent = () => {
    if (formData.content.length < 4) {
      setFormData((prev) => ({
        ...prev,
        content: [...prev.content, ""],
      }));
    }
  };

  const removeContent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index),
    }));
  };

  const updateContent = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content.map((c, i) => (i === index ? value : c)),
    }));
  };

  // Chart management
  const addChart = () => {
    if (formData.charts.length < 4) {
      const newChart = { type: "echarts" as const, data: defaultChartData.echarts };
      setFormData((prev) => ({
        ...prev,
        charts: [...prev.charts, newChart],
      }));
      // Add new chart data string
      setChartDataStrings((prev) => [
        ...prev,
        JSON.stringify(newChart.data, null, 2),
      ]);
    }
  };

  const removeChart = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      charts: prev.charts.filter((_, i) => i !== index),
    }));
    setChartDataStrings((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChartType = (index: number, type: ChartConfig["type"]) => {
    const newData = defaultChartData[type];
    setFormData((prev) => ({
      ...prev,
      charts: prev.charts.map((c, i) =>
        i === index ? { type, data: newData } : c
      ),
    }));
    // Update the chart data string for this chart
    setChartDataStrings((prev) =>
      prev.map((str, i) =>
        i === index ? JSON.stringify(newData, null, 2) : str
      )
    );
  };

  const updateChartDataString = (index: number, dataStr: string) => {
    // Always update the string state to allow editing
    setChartDataStrings((prev) =>
      prev.map((str, i) => (i === index ? dataStr : str))
    );

    // Try to parse and update formData if valid JSON
    try {
      const data = JSON.parse(dataStr);
      setFormData((prev) => ({
        ...prev,
        charts: prev.charts.map((c, i) =>
          i === index ? { ...c, data } : c
        ),
      }));
    } catch {
      // Invalid JSON, keep the string but don't update formData
      // This allows users to continue editing
    }
  };

  // Handle source code change
  const handleSourceChange = (value: string) => {
    setSourceCode(value);
    try {
      const parsed = JSON.parse(value);
      setFormData(parsed);
    } catch {
      // Invalid JSON, don't update formData
    }
  };

  // Handle save
  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="flex items-center gap-3">
            {isEdit ? "编辑幻灯片" : "新增幻灯片"}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode(mode === "config" ? "source" : "config")}
              className="text-xs"
            >
              {mode === "config" ? "源码" : "配置"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {mode === "config" ? (
            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  标题
                </label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="输入幻灯片标题（可选）"
                />
              </div>

              {/* Content/论点 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    论点 ({formData.content.length}/4)
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={addContent}
                      disabled={formData.content.length >= 4}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        removeContent(formData.content.length - 1)
                      }
                      disabled={formData.content.length === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {formData.content.map((content, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={content}
                        onChange={(e) => updateContent(index, e.target.value)}
                        placeholder={`论点 ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => removeContent(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    图表 ({formData.charts.length}/4)
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={addChart}
                      disabled={formData.charts.length >= 4}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeChart(formData.charts.length - 1)}
                      disabled={formData.charts.length === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {formData.charts.map((chart, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            类型
                          </span>
                          <Select
                            value={chart.type}
                            onValueChange={(value) =>
                              updateChartType(
                                index,
                                value as ChartConfig["type"]
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="table">表格</SelectItem>
                              <SelectItem value="echarts">
                                ECharts图形
                              </SelectItem>
                              <SelectItem value="image">图片</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeChart(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500 block mb-2">
                          配置
                        </span>
                        <Textarea
                          value={chartDataStrings[index] || ""}
                          onChange={(e) =>
                            updateChartDataString(index, e.target.value)
                          }
                          className="font-mono text-sm min-h-[150px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] py-4">
              <CodeEditor
                value={sourceCode}
                onChange={handleSourceChange}
                height="100%"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? "保存" : "添加"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

