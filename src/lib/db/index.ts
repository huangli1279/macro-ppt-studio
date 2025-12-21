import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import path from "path";

// Get database type from environment variable
const DB_TYPE = process.env.DATABASE_TYPE || "sqlite";

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzleMysql>;

if (DB_TYPE === "mysql") {
  // MySQL configuration
  const connectionString = process.env.MYSQL_URL;
  
  let mysqlConnection;
  
  if (connectionString) {
    // Use connection string
    mysqlConnection = mysql.createPool(connectionString);
  } else {
    // Use separate connection parameters
    mysqlConnection = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "hongguanai",
    });
  }
  
  db = drizzleMysql(mysqlConnection, { schema, mode: "default" });
  console.log("📊 Database: MySQL connected");
} else {
  // SQLite configuration (default)
  const dbPath = path.join(
    process.cwd(),
    process.env.SQLITE_DB_PATH || "data/ppt.db"
  );
  
  const sqlite = new Database(dbPath);
  
  // Enable WAL mode for better concurrent performance
  sqlite.pragma("journal_mode = WAL");
  
  db = drizzleSqlite(sqlite, { schema });
  console.log("📊 Database: SQLite connected at", dbPath);
}

// Export db instance and schema
export { db, schema };

