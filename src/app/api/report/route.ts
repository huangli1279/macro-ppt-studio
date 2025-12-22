import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptReports } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PPTReport } from "@/types/slide";

// GET: Fetch the latest published PPT report
export async function GET() {
  try {
    const result = await db
      .select()
      .from(pptReports)
      .orderBy(desc(pptReports.createTime))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ report: null });
    }

    const record = result[0];
    const report: PPTReport | null = record.report
      ? JSON.parse(record.report)
      : null;

    return NextResponse.json({
      id: record.id,
      report,
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
    const { report } = body as { report: PPTReport };

    if (!report || !Array.isArray(report)) {
      return NextResponse.json(
        { error: "Invalid report format" },
        { status: 400 }
      );
    }

    const result = await db.insert(pptReports).values({
      report: JSON.stringify(report),
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

