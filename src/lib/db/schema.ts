import { pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

// Quarter table
export const pptQuarter = pgTable("ppt_quarter", {
  id: serial("id").primaryKey(),
  quarterId: varchar("quarter_id", { length: 255 }).notNull().unique(),
});

// Reports table with quarter foreign key
export const pptReports = pgTable("ppt_reports", {
  id: serial("id").primaryKey(),
  report: text("report"), // PPT report JSON configuration
  quarterId: integer("quarter_id").references(() => pptQuarter.id),
  createTime: timestamp("create_time", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export type QuarterRecord = typeof pptQuarter.$inferSelect;
export type NewQuarterRecord = typeof pptQuarter.$inferInsert;

export type PPTReportRecord = typeof pptReports.$inferSelect;
export type NewPPTReportRecord = typeof pptReports.$inferInsert;

