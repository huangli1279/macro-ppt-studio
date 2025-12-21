import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

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

const db = drizzle(mysqlConnection, { schema, mode: "default" });
console.log("📊 Database: MySQL connected");

// Export db instance and schema
export { db, schema };

