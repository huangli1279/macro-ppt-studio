import { NextRequest, NextResponse } from "next/server";
import { generatePDF } from "@/lib/pdf-generator";
import { PPTReport } from "@/types/slide";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slides } = body as { slides: PPTReport };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty slides" },
        { status: 400 }
      );
    }

    // Get base URL from request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Generate PDF
    const pdfBuffer = await generatePDF(slides, baseUrl);

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${Date.now()}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

