"use client";

import { useRef, useEffect, useState } from "react";
import { SlideData } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";

interface SlidePreviewProps {
  slide: SlideData | null;
  pageNumber?: number;
  className?: string;
}

export function SlidePreview({
  slide,
  pageNumber,
  className = "",
}: SlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale based on container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Base slide dimensions (16:9 ratio)
      const slideWidth = 960;
      const slideHeight = 540;

      // Calculate scale to fit container while maintaining aspect ratio
      const scaleX = containerWidth / slideWidth;
      const scaleY = containerHeight / slideHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  if (!slide) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-slate-200 rounded-lg ${className}`}
      >
        <div className="text-slate-400 text-lg">
          选择或创建一个幻灯片
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center bg-slate-200 rounded-lg overflow-hidden ${className}`}
    >
      <div
        style={{
          width: 960,
          height: 540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <SlideRenderer
          slide={slide}
          pageNumber={pageNumber}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

