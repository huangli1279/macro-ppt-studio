"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PPTReport } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";

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
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
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

  // Request fullscreen on the container element
  const requestFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    
    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        // Safari support
        await (container as HTMLDivElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn("Could not enter fullscreen:", error);
    }
  }, []);

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
          // Exit fullscreen will trigger onClose via fullscreenchange event
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
              // If exitFullscreen fails, close directly
              onClose();
            });
          } else {
            onClose();
          }
          break;
        case "Home":
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentIndex(slides.length - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (!document.fullscreenElement) {
            requestFullscreen();
          }
          break;
      }
    },
    [slides.length, onClose, requestFullscreen]
  );

  // Monitor fullscreen state - exit presenter when leaving fullscreen
  useEffect(() => {
    // Check initial fullscreen state
    const initialFullscreen = !!document.fullscreenElement;
    setIsFullscreenActive(initialFullscreen);

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreenActive(isNowFullscreen);
      
      // When exiting fullscreen, close the presenter and return to main page
      if (!isNowFullscreen) {
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    // Cleanup
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      // Exit fullscreen on unmount if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Ignore errors on cleanup
        });
      }
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
      id="fullscreen-presenter-container"
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      {/* Slide */}
      <div
        className="w-full h-full flex items-center justify-center"
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
              isFullscreen={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

