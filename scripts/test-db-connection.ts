import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function testConnection() {
  try {
    console.log("🔍 MySQL Database Configuration Test\n");
    
    // Check MySQL environment variables
    console.log("🔧 MySQL Configuration:");
    if (process.env.MYSQL_URL) {
      // Mask password in URL
      const maskedUrl = process.env.MYSQL_URL.replace(/:([^@]+)@/, ":****@");
      console.log(`   URL: ${maskedUrl}`);
    } else {
      console.log(`   Host: ${process.env.MYSQL_HOST || "localhost"}`);
      console.log(`   Port: ${process.env.MYSQL_PORT || "3306"}`);
      console.log(`   User: ${process.env.MYSQL_USER || "root"}`);
      console.log(`   Password: ${process.env.MYSQL_PASSWORD ? "****" : "(not set)"}`);
      console.log(`   Database: ${process.env.MYSQL_DATABASE || "hongguanai"}`);
    }
    
    // Import database after environment variables are loaded
    console.log("\n🔌 Connecting to database...");
    const { db } = await import("../src/lib/db");
    const { pptReports } = await import("../src/lib/db/schema");
    
    // Test query
    console.log("📊 Querying database...");
    const reports = await db.select().from(pptReports).all();
    
    console.log(`✅ Connection successful!`);
    console.log(`📄 Found ${reports.length} report(s) in database`);
    
    if (reports.length > 0) {
      const latestReport = reports[reports.length - 1];
      console.log(`\n📌 Latest report:`);
      console.log(`   ID: ${latestReport.id}`);
      console.log(`   Created: ${latestReport.createTime}`);
      console.log(`   Size: ${latestReport.report.length} bytes`);
    }
    
    console.log("\n✨ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if database service is running");
    console.error("   2. Verify environment variables in .env.local");
    console.error("   3. Ensure database tables are created (run: npm run db:push)");
    console.error("   4. Check database credentials and permissions");
    process.exit(1);
  }
}

// Run test
testConnection();

