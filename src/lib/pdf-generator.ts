import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { PPTReport } from "@/types/slide";

export async function generatePDF(
  slides: PPTReport,
  baseUrl: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--allow-running-insecure-content",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to 16:9 aspect ratio
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // Higher DPI for better quality
    });

    // Create a merged PDF document
    const mergedPdf = await PDFDocument.create();

    // Generate PDF for each slide individually
    for (let i = 0; i < slides.length; i++) {
      // Encode single slide as base64 for URL
      const slideParam = Buffer.from(JSON.stringify([slides[i]])).toString(
        "base64"
      );
      const url = `${baseUrl}/print?slides=${encodeURIComponent(slideParam)}&index=${i}`;

      // Navigate to print page for this slide
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      // Wait for page to signal it's ready (fonts loaded + charts rendered)
      await page.waitForFunction(
        () => {
          // @ts-ignore
          return window.__PRINT_READY__ === true;
        },
        { timeout: 30000 }
      );

      // Additional wait for final rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF for this single slide
      const slidePdf = await page.pdf({
        width: "1920px",
        height: "1080px",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        pageRanges: "1", // Only first page
      });

      // Load the slide PDF and copy its page to the merged document
      const slidePdfDoc = await PDFDocument.load(slidePdf);
      const [copiedPage] = await mergedPdf.copyPages(slidePdfDoc, [0]);
      mergedPdf.addPage(copiedPage);
    }

    // Save the merged PDF
    const pdfBytes = await mergedPdf.save();
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

