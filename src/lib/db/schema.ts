import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const pptReports = sqliteTable("ppt_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  report: text("report"), // PPT report JSON configuration
  createTime: text("create_time")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type PPTReportRecord = typeof pptReports.$inferSelect;
export type NewPPTReportRecord = typeof pptReports.$inferInsert;

