import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.MYSQL_URL ||
      `mysql://${process.env.MYSQL_USER || "root"}:${process.env.MYSQL_PASSWORD || ""}@${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || "3306"}/${process.env.MYSQL_DATABASE || "hongguanai"}`,
  },
});

