"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  ThumbnailPanel,
  SlidePreview,
  SlideModal,
  CodeEditor,
} from "@/components/editor";
import { FullscreenPresenter } from "@/components/presentation/FullscreenPresenter";
import { ChatBox } from "@/components/ai/ChatBox";
import { PPTReport, SlideData } from "@/types/slide";
import {
  Save,
  FileDown,
  Code,
  Eye,
  Maximize,
  Loader2,
  Check,
  Plus,
  RefreshCw,
  Edit,
  Sparkles,
} from "lucide-react";

interface Quarter {
  id: number;
  quarterId: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("type") === "write";
  const isReadOnly = !isEditMode;

  // State
  const [slides, setSlides] = useState<PPTReport>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [sourceCode, setSourceCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [saveTooltipOpen, setSaveTooltipOpen] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Add quarter dialog state
  const [addQuarterOpen, setAddQuarterOpen] = useState(false);
  const [newQuarterId, setNewQuarterId] = useState("");
  const [isAddingQuarter, setIsAddingQuarter] = useState(false);
  const [addQuarterError, setAddQuarterError] = useState("");

  // Quarter state
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideData | undefined>();
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const [insertIndex, setInsertIndex] = useState<number | undefined>();

  // AI Chat modal state
  const [chatOpen, setChatOpen] = useState(false);

  // Ref for preview container to handle wheel events
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Handle wheel navigation in preview mode
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || viewMode !== "preview" || slides.length === 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        // Scroll down - next slide
        setSelectedIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.deltaY < 0) {
        // Scroll up - previous slide
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [viewMode, slides.length]);

  // Load quarters on mount
  useEffect(() => {
    async function loadQuarters() {
      try {
        const response = await fetch("/api/quarters");
        const data = await response.json();
        if (data.quarters && data.quarters.length > 0) {
          setQuarters(data.quarters);
          // Select the first quarter (latest) by default
          setSelectedQuarter(data.quarters[0].id);
        }
      } catch (error) {
        console.error("Failed to load quarters:", error);
      }
    }
    loadQuarters();
  }, []);

  // Add new quarter
  const handleAddQuarter = async () => {
    if (!newQuarterId.trim()) {
      setAddQuarterError("请输入季度ID");
      return;
    }

    setIsAddingQuarter(true);
    setAddQuarterError("");

    try {
      const response = await fetch("/api/quarters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarterId: newQuarterId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddQuarterError(data.error || "创建季度失败");
        return;
      }

      // Add new quarter to list and select it (maintain descending order)
      setQuarters((prev) =>
        [data.quarter, ...prev].sort((a, b) => b.quarterId.localeCompare(a.quarterId))
      );
      setSelectedQuarter(data.quarter.id);
      setAddQuarterOpen(false);
      setNewQuarterId("");
    } catch (error) {
      console.error("Failed to add quarter:", error);
      setAddQuarterError("创建季度失败，请重试");
    } finally {
      setIsAddingQuarter(false);
    }
  };

  // Fetch report function
  const fetchReport = useCallback(async (quarterId: number, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(`/api/report?quarterId=${quarterId}`);
      const data = await response.json();
      if (data.report) {
        setSlides(data.report);
        setSourceCode(JSON.stringify(data.report, null, 2));
      } else {
        // No report for this quarter
        setSlides([]);
        setSourceCode("[]");
      }
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Load report when quarter changes
  useEffect(() => {
    if (selectedQuarter === null) return;
    fetchReport(selectedQuarter);
  }, [selectedQuarter, fetchReport]);

  // Handle reload
  const handleReload = async () => {
    if (selectedQuarter === null) return;
    setIsReloading(true);
    await fetchReport(selectedQuarter, false); // Don't show full screen loader
    setIsReloading(false);
  };

  // Sync source code when slides change
  useEffect(() => {
    if (viewMode === "preview") {
      setSourceCode(JSON.stringify(slides, null, 2));
    }
  }, [slides, viewMode]);

  // Handle source code change
  const handleSourceChange = useCallback((value: string) => {
    setSourceCode(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setSlides(parsed);
      }
    } catch {
      // Invalid JSON, don't update slides
    }
  }, []);

  // Save logic extracted for reusability
  const saveToApi = async (slidesToSave: PPTReport) => {
    if (selectedQuarter === null) {
      alert("请先选择季度");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: slidesToSave, quarterId: selectedQuarter }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setSaveTooltipOpen(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("保存失败，请重试或检查网络连接");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish report
  const handlePublish = async () => {
    await saveToApi(slides);
  };

  // Export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 1000);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("导出失败，请重试或检查网络连接");
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle view mode
  const toggleViewMode = () => {
    if (viewMode === "source") {
      // Switching to preview - try to parse source
      try {
        const parsed = JSON.parse(sourceCode);
        if (Array.isArray(parsed)) {
          setSlides(parsed);
        }
      } catch {
        alert("JSON格式错误，无法切换到预览模式，请检查JSON格式");
        return;
      }
    }
    setViewMode(viewMode === "preview" ? "source" : "preview");
  };

  // Add slide
  const handleAddSlide = (index?: number) => {
    setEditingSlide(undefined);
    setEditingIndex(undefined);
    setInsertIndex(index);
    setModalOpen(true);
  };

  // Edit slide
  const handleEditSlide = (index: number) => {
    setEditingSlide(slides[index]);
    setEditingIndex(index);
    setInsertIndex(undefined);
    setModalOpen(true);
  };

  // Save slide from modal
  const handleSaveSlide = (slide: SlideData) => {
    let newSlides: PPTReport;

    if (editingIndex !== undefined) {
      // Editing existing slide
      newSlides = slides.map((s, i) => (i === editingIndex ? slide : s));
    } else if (insertIndex !== undefined) {
      // Insert at specific position
      newSlides = [
        ...slides.slice(0, insertIndex),
        slide,
        ...slides.slice(insertIndex),
      ];
      setSelectedIndex(insertIndex);
    } else {
      // Add at end
      newSlides = [...slides, slide];
      setSelectedIndex(slides.length);
    }

    setSlides(newSlides);
    // Also trigger API save
    saveToApi(newSlides);
  };

  // Fullscreen - open presenter and request fullscreen immediately
  const handleFullscreen = () => {
    // Use flushSync to force synchronous render, so the presenter container exists
    // in the same user gesture call stack
    flushSync(() => {
      setIsFullscreen(true);
    });

    // Now the presenter is rendered, request fullscreen on its container
    const container = document.getElementById("fullscreen-presenter-container");
    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => {
          console.warn("Could not enter fullscreen:", err);
        });
      } else if ((container as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        // Safari support
        (container as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    }
  };

  const currentSlide = slides[selectedIndex] || null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-slate-100">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              <span className="mr-2">📑</span>
              宏观经济分析报告Studio
            </h1>
            <div className="flex items-center gap-2">
              {quarters.length > 0 && (
                <Select
                  value={selectedQuarter?.toString()}
                  onValueChange={(value) => setSelectedQuarter(parseInt(value, 10))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="选择季度" />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter.id} value={quarter.id.toString()}>
                        {quarter.quarterId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setAddQuarterError("");
                      setNewQuarterId("");
                      setAddQuarterOpen(true);
                    }}
                    disabled={isReadOnly}
                    className={isReadOnly ? "hidden" : ""}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>新增季度</TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReload}
                  disabled={isReloading || selectedQuarter === null}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重新加载当前季度内容</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <Tooltip
                  open={saveTooltipOpen || showSaveSuccess}
                  onOpenChange={(open) => {
                    if (open && showSaveSuccess) return;
                    setSaveTooltipOpen(open);
                  }}
                >
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePublish}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {showSaveSuccess ? "保存成功" : "保存"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {process.env.NEXT_PUBLIC_ENABLE_PDF_EXPORT !== "false" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExportPDF}
                    disabled={isExporting || slides.length === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : showExportSuccess ? (
                      <Check className="h-4 w-4 text-slate-800" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>导出PDF</TooltipContent>
              </Tooltip>
            )}

            {!isReadOnly && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditSlide(selectedIndex)}
                    disabled={slides.length === 0}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>编辑当前幻灯片</TooltipContent>
              </Tooltip>
            )}

            {!isReadOnly && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleViewMode}
                  >
                    {viewMode === "preview" ? (
                      <Code className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === "preview" ? "源码模式" : "预览模式"}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setChatOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI 宏观经济分析助手</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFullscreen}
                  disabled={slides.length === 0}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>全屏演示</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {viewMode === "preview" ? (
            <>
              {/* Thumbnail panel */}
              <ThumbnailPanel
                slides={slides}
                selectedIndex={selectedIndex}
                onSelectSlide={setSelectedIndex}
                onSlidesChange={setSlides}
                onAddSlide={handleAddSlide}
                onEditSlide={handleEditSlide}
                onSave={saveToApi}
                isReadOnly={isReadOnly}
              />

              {/* Slide preview */}
              <div ref={previewContainerRef} className="flex-1 p-6">
                <SlidePreview
                  slide={currentSlide}
                  pageNumber={
                    currentSlide ? selectedIndex + 1 : undefined
                  }
                  className="w-full h-full"
                />
              </div>
            </>
          ) : (
            /* Source code editor */
            <div className="flex-1 p-4">
              <div className="h-full rounded-lg overflow-hidden border border-slate-300">
                <CodeEditor
                  value={sourceCode}
                  onChange={handleSourceChange}
                  height="100%"
                />
              </div>
            </div>
          )}
        </div>

        {/* Slide Modal */}
        <SlideModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          slide={editingSlide}
          onSave={handleSaveSlide}
          isEdit={editingIndex !== undefined}
        />

        {/* Fullscreen Presenter */}
        {/* AI Chat Modal */}
        {/* Fullscreen Presenter */}
        {/* AI Chat Modal */}
        <ChatBox
          open={chatOpen}
          onOpenChange={setChatOpen}
          slides={slides}
          currentSlideIndex={selectedIndex}
          isReadOnly={isReadOnly}
          onAddSlide={async (slide) => {
            // Reusing handleSaveSlide logic but adapting for AI arg structure
            // The AI gives { title, content, type }. We need to form a SlideData.
            // Defaulting charts to empty array for now as AI adding charts is complex, 
            // but we can support basic structure.
            const newSlide: SlideData = {
              title: slide.title,
              content: slide.content || [],
              charts: []
            };
            // Add to end or after current? Let's add after current for better context? 
            // Or append to end. AI prompt says "add a new slide". Usually append is safer unless specified.
            // Let's reuse the logic: insert after current index
            const newSlides = [
              ...slides.slice(0, selectedIndex + 1),
              newSlide,
              ...slides.slice(selectedIndex + 1),
            ];
            setSlides(newSlides);
            setSelectedIndex(selectedIndex + 1);
            await saveToApi(newSlides);
          }}
          onUpdateSlide={async (data) => {
            const current = slides[selectedIndex];
            if (!current) return;

            const updatedSlide = { ...current };
            if (data.title) updatedSlide.title = data.title;
            if (data.content) updatedSlide.content = data.content;

            const newSlides = slides.map((s, i) => i === selectedIndex ? updatedSlide : s);
            setSlides(newSlides);
            await saveToApi(newSlides);
          }}
          onDeleteSlide={async () => {
            const newSlides = slides.filter((_, i) => i !== selectedIndex);
            setSlides(newSlides);
            // Adjust selection
            if (selectedIndex >= newSlides.length) {
              setSelectedIndex(Math.max(0, newSlides.length - 1));
            }
            await saveToApi(newSlides);
          }}
        />

        {isFullscreen && (
          <FullscreenPresenter
            slides={slides}
            initialIndex={selectedIndex}
            onClose={() => setIsFullscreen(false)}
          />
        )}

        {/* Add Quarter Dialog */}
        <Dialog open={addQuarterOpen} onOpenChange={setAddQuarterOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>新增季度</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  季度ID
                </label>
                <Input
                  placeholder="例如：2024Q4"
                  value={newQuarterId}
                  onChange={(e) => {
                    setNewQuarterId(e.target.value.toUpperCase());
                    setAddQuarterError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAddingQuarter) {
                      handleAddQuarter();
                    }
                  }}
                />
                <p className="text-xs text-slate-500">
                  请使用 YYYYQ1-Q4 格式（如 2024Q1、2025Q2）
                </p>
                {addQuarterError && (
                  <p className="text-xs text-red-500">{addQuarterError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddQuarterOpen(false)}
                disabled={isAddingQuarter}
              >
                取消
              </Button>
              <Button
                onClick={handleAddQuarter}
                disabled={isAddingQuarter}
              >
                {isAddingQuarter ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    创建中...
                  </>
                ) : (
                  "创建"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-100">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
