import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptQuarter } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// GET: Fetch all quarters ordered by quarter_id descending
export async function GET() {
    try {
        const quarters = await db
            .select()
            .from(pptQuarter)
            .orderBy(desc(pptQuarter.quarterId));

        return NextResponse.json({ quarters });
    } catch (error) {
        console.error("Failed to fetch quarters:", error);
        return NextResponse.json(
            { error: "Failed to fetch quarters" },
            { status: 500 }
        );
    }
}

// POST: Create a new quarter
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { quarterId } = body;

        // Validate quarterId format (e.g., 2024Q1, 2024Q2, etc.)
        if (!quarterId || typeof quarterId !== "string") {
            return NextResponse.json(
                { error: "季度ID为必填项" },
                { status: 400 }
            );
        }

        const quarterPattern = /^\d{4}Q[1-4]$/;
        if (!quarterPattern.test(quarterId)) {
            return NextResponse.json(
                { error: "季度ID格式不正确，请使用 YYYYQ1-Q4 格式（如 2024Q1）" },
                { status: 400 }
            );
        }

        // Insert the new quarter
        const [newQuarter] = await db
            .insert(pptQuarter)
            .values({ quarterId })
            .returning();

        return NextResponse.json({ quarter: newQuarter });
    } catch (error: unknown) {
        console.error("Failed to create quarter:", error);

        // Check for unique constraint violation
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
            return NextResponse.json(
                { error: "该季度已存在" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "创建季度失败" },
            { status: 500 }
        );
    }
}
