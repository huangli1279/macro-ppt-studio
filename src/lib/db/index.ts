import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Get Supabase database URL from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set. Please add your Supabase database URL to .env file.");
}

// Create postgres connection
const client = postgres(databaseUrl, {
  prepare: false, // Required for Supabase
});

// Create drizzle instance
const db = drizzle(client, { schema });

console.log("📊 Database: Supabase (PostgreSQL) connected");

// Export db instance and schema
export { db, schema };

