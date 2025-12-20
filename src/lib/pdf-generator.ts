import puppeteer from "puppeteer";
import { PPTReport } from "@/types/slide";

export async function generatePDF(
  slides: PPTReport,
  baseUrl: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to 16:9 aspect ratio
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Encode slides as base64 for URL
    const slidesParam = Buffer.from(JSON.stringify(slides)).toString("base64");
    const url = `${baseUrl}/print?slides=${encodeURIComponent(slidesParam)}`;

    // Navigate to print page
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for page to signal it's ready
    await page.waitForFunction(() => {
      // @ts-ignore
      return window.__PRINT_READY__ === true;
    }, { timeout: 30000 });

    // Additional wait for charts to fully render
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate PDF
    const pdf = await page.pdf({
      width: "1920px",
      height: "1080px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

