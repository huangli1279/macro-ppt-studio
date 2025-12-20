"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PPTReport } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenPresenterProps {
  slides: PPTReport;
  initialIndex?: number;
  onClose: () => void;
}

export function FullscreenPresenter({
  slides,
  initialIndex = 0,
  onClose,
}: FullscreenPresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle wheel navigation
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        // Scroll down - next slide
        setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.deltaY < 0) {
        // Scroll up - previous slide
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    [slides.length]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "PageDown":
          e.preventDefault();
          setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Escape":
          onClose();
          break;
        case "Home":
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentIndex(slides.length - 1);
          break;
      }
    },
    [slides.length, onClose]
  );

  // Enter fullscreen mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Request fullscreen
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(console.error);
    }

    // Handle fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onClose]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);

  const currentSlide = slides[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        onClick={onClose}
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setCurrentIndex((prev) => prev - 1)}
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {currentIndex < slides.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setCurrentIndex((prev) => prev + 1)}
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Slide */}
      <div
        className="w-full h-full flex items-center justify-center p-8"
        style={{ aspectRatio: "16/9" }}
      >
        <div
          className="w-full h-full max-w-[100vw] max-h-[100vh]"
          style={{
            aspectRatio: "16/9",
            maxWidth: "calc(100vh * 16 / 9)",
            maxHeight: "calc(100vw * 9 / 16)",
          }}
        >
          {currentSlide && (
            <SlideRenderer
              slide={currentSlide}
              pageNumber={currentIndex + 1}
              className="w-full h-full"
            />
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/30"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Page number */}
      <div className="absolute bottom-4 right-4 text-white/70 text-sm">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}

