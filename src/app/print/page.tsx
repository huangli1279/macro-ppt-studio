"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PPTReport } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";

// Wait for fonts to be ready (uses system fonts, no network required)
async function loadFonts(): Promise<void> {
  try {
    // Wait for system fonts to be ready
    await document.fonts.ready;
  } catch (e) {
    console.warn("Font loading check failed:", e);
  }
}

function PrintContent() {
  const searchParams = useSearchParams();
  const [slides, setSlides] = useState<PPTReport>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Get slides from URL parameter (base64 encoded)
    const slidesParam = searchParams.get("slides");
    const indexParam = searchParams.get("index");

    if (slidesParam) {
      try {
        // Decode base64 to binary string, then convert to UTF-8
        const binaryString = atob(slidesParam);
        const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        const decoded = new TextDecoder("utf-8").decode(bytes);
        const parsed = JSON.parse(decoded);
        setSlides(parsed);
      } catch (error) {
        console.error("Failed to parse slides:", error);
      }
    }

    if (indexParam) {
      setStartIndex(parseInt(indexParam, 10));
    }

    // Load fonts then signal ready
    loadFonts().then(() => {
      setFontsLoaded(true);
    });
  }, [searchParams]);

  // Signal ready after fonts and content are loaded
  useEffect(() => {
    if (slides.length > 0 && fontsLoaded) {
      // Wait a bit more for charts to render
      const timer = setTimeout(() => {
        // @ts-ignore - window property for puppeteer
        window.__PRINT_READY__ = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [slides, fontsLoaded]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans">
        Loading...
      </div>
    );
  }

  return (
    <div className="print-container">
      {slides.map((slide, index) => (
        <div
          key={index}
          className="print-slide"
          style={{
            width: "1920px",
            height: "1080px",
            pageBreakAfter: "always",
            pageBreakInside: "avoid",
          }}
        >
          <SlideRenderer
            slide={slide}
            pageNumber={startIndex + index + 1}
            className="w-full h-full"
            isFullscreen={true}
          />
        </div>
      ))}
      <style jsx global>{`
        @media print {
          @page {
            size: 1920px 1080px;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-slide {
            page-break-after: always;
            page-break-inside: avoid;
          }
        }
        * {
          font-family: "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "WenQuanYi Micro Hei", "WenQuanYi Zen Hei", -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .print-slide {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}

