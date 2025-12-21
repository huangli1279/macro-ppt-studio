import { mysqlTable, text, int, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const pptReports = mysqlTable("ppt_reports", {
  id: int("id").primaryKey().autoincrement(),
  report: text("report"), // PPT report JSON configuration
  createTime: timestamp("create_time")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type PPTReportRecord = typeof pptReports.$inferSelect;
export type NewPPTReportRecord = typeof pptReports.$inferInsert;

