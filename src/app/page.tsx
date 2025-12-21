"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ThumbnailPanel,
  SlidePreview,
  SlideModal,
  CodeEditor,
} from "@/components/editor";
import { FullscreenPresenter } from "@/components/presentation/FullscreenPresenter";
import { PPTReport, SlideData } from "@/types/slide";
import {
  Save,
  FileDown,
  Code,
  Eye,
  Maximize,
  Loader2,
  Check,
} from "lucide-react";

export default function Home() {
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
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideData | undefined>();
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const [insertIndex, setInsertIndex] = useState<number | undefined>();

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

  // Load initial data
  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/report");
        const data = await response.json();
        if (data.report) {
          setSlides(data.report);
          setSourceCode(JSON.stringify(data.report, null, 2));
        }
      } catch (error) {
        console.error("Failed to load report:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, []);

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

  // Publish report
  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: slides }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1000);
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("保存失败，请重试或检查网络连接");
    } finally {
      setIsSaving(false);
    }
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
    if (editingIndex !== undefined) {
      // Editing existing slide
      setSlides((prev) =>
        prev.map((s, i) => (i === editingIndex ? slide : s))
      );
    } else if (insertIndex !== undefined) {
      // Insert at specific position
      setSlides((prev) => [
        ...prev.slice(0, insertIndex),
        slide,
        ...prev.slice(insertIndex),
      ]);
      setSelectedIndex(insertIndex);
    } else {
      // Add at end
      setSlides((prev) => [...prev, slide]);
      setSelectedIndex(slides.length);
    }
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
          <h1 className="text-lg font-semibold text-slate-800">
            个金宏观经济报告Studio
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {showSaveSuccess && (
                <span className="text-sm text-slate-800 font-medium animate-in fade-in slide-in-from-right-2">
                  保存成功
                </span>
              )}
              <Tooltip>
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
                <TooltipContent>保存</TooltipContent>
              </Tooltip>
            </div>

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
        {isFullscreen && (
          <FullscreenPresenter
            slides={slides}
            initialIndex={selectedIndex}
            onClose={() => setIsFullscreen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
