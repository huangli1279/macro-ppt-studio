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
