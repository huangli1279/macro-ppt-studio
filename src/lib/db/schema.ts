import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pptReports = pgTable("ppt_reports", {
  id: serial("id").primaryKey(),
  report: text("report"), // PPT report JSON configuration
  createTime: timestamp("create_time", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export type PPTReportRecord = typeof pptReports.$inferSelect;
export type NewPPTReportRecord = typeof pptReports.$inferInsert;

