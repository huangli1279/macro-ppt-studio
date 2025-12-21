import { drizzle as sqliteDrizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as mysqlDrizzle } from "drizzle-orm/mysql2";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import * as schema from "../src/lib/db/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function migrate() {
  try {
    console.log("🚀 Starting SQLite to MySQL migration...");

    // Connect to SQLite
    console.log("📖 Reading from SQLite...");
    const sqlite = new Database("./data/ppt.db");
    const sqliteDb = sqliteDrizzle(sqlite, { schema });

    // Connect to MySQL
    console.log("📝 Connecting to MySQL...");
    const mysqlUrl =
      process.env.MYSQL_URL ||
      `mysql://${process.env.MYSQL_USER || "root"}:${process.env.MYSQL_PASSWORD || ""}@${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || "3306"}/${process.env.MYSQL_DATABASE || "hongguanai"}`;

    const mysqlConnection = await mysql.createPool(mysqlUrl);
    const mysqlDb = mysqlDrizzle(mysqlConnection, { schema, mode: "default" });

    // Read SQLite data
    const reports = await sqliteDb.select().from(schema.pptReports).all();
    console.log(`📊 Found ${reports.length} reports in SQLite`);

    if (reports.length === 0) {
      console.log("⚠️  No data to migrate");
      sqlite.close();
      await mysqlConnection.end();
      return;
    }

    // Clear existing MySQL data (optional, comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing MySQL data...");
    await mysqlDb.delete(schema.pptReports);

    // Write to MySQL
    console.log("💾 Writing to MySQL...");
    let successCount = 0;
    for (const report of reports) {
      try {
        await mysqlDb.insert(schema.pptReports).values({
          id: report.id,
          report: report.report,
          createTime: report.createTime,
        });
        successCount++;
        console.log(`  ✅ Migrated report ${report.id} (${successCount}/${reports.length})`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate report ${report.id}:`, error);
      }
    }

    console.log(`\n✨ Migration completed successfully!`);
    console.log(`   Total: ${reports.length} reports`);
    console.log(`   Success: ${successCount} reports`);
    console.log(`   Failed: ${reports.length - successCount} reports`);

    // Close connections
    sqlite.close();
    await mysqlConnection.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrate();

