import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptReports, pptQuarter } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PPTReport } from "@/types/slide";

// GET: Fetch the latest published PPT report
// If quarterId is provided, fetch latest report for that quarter
// Otherwise, fetch latest quarter's latest report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterIdParam = searchParams.get("quarterId");

    let quarterId: number | null = null;

    if (quarterIdParam) {
      // Use provided quarter ID
      quarterId = parseInt(quarterIdParam, 10);
    } else {
      // Fetch the latest quarter
      const latestQuarter = await db
        .select()
        .from(pptQuarter)
        .orderBy(desc(pptQuarter.quarterId))
        .limit(1);

      if (latestQuarter.length === 0) {
        return NextResponse.json({ report: null, quarterId: null });
      }

      quarterId = latestQuarter[0].id;
    }

    // Fetch the latest report for the selected quarter
    const result = await db
      .select()
      .from(pptReports)
      .where(eq(pptReports.quarterId, quarterId))
      .orderBy(desc(pptReports.createTime))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ report: null, quarterId });
    }

    const record = result[0];
    const report: PPTReport | null = record.report
      ? JSON.parse(record.report)
      : null;

    return NextResponse.json({
      id: record.id,
      report,
      quarterId: record.quarterId,
      createTime: record.createTime,
    });
  } catch (error) {
    console.error("Failed to fetch report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// POST: Publish/save a new PPT report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { report, quarterId } = body as { report: PPTReport; quarterId: number };

    if (!report || !Array.isArray(report)) {
      return NextResponse.json(
        { error: "Invalid report format" },
        { status: 400 }
      );
    }

    if (!quarterId) {
      return NextResponse.json(
        { error: "Quarter ID is required" },
        { status: 400 }
      );
    }

    const result = await db.insert(pptReports).values({
      report: JSON.stringify(report),
      quarterId,
    }).returning();

    return NextResponse.json({
      success: true,
      id: result[0]?.id,
    });
  } catch (error) {
    console.error("Failed to save report:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }
}

