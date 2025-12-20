"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PPTReport } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";

function PrintContent() {
  const searchParams = useSearchParams();
  const [slides, setSlides] = useState<PPTReport>([]);

  useEffect(() => {
    // Get slides from URL parameter (base64 encoded)
    const slidesParam = searchParams.get("slides");
    if (slidesParam) {
      try {
        const decoded = atob(slidesParam);
        const parsed = JSON.parse(decoded);
        setSlides(parsed);
      } catch (error) {
        console.error("Failed to parse slides:", error);
      }
    }

    // Signal that rendering is complete
    const timer = setTimeout(() => {
      // @ts-ignore - window property for puppeteer
      window.__PRINT_READY__ = true;
    }, 2000); // Wait for charts to render

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
            pageNumber={index + 1}
            className="w-full h-full"
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
        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
        }
        .print-slide {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

