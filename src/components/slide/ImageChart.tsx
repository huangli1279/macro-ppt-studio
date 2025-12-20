"use client";

import { ImageData } from "@/types/slide";
import Image from "next/image";

interface ImageChartProps {
  data: ImageData;
  className?: string;
}

export function ImageChart({ data, className = "" }: ImageChartProps) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
    >
      <Image
        src={data.src}
        alt="Chart image"
        fill
        className="object-contain"
        unoptimized // Allow external images
      />
    </div>
  );
}

