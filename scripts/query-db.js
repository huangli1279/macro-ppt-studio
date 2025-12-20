#!/usr/bin/env node
/**
 * SQLite 数据库查询脚本
 * 
 * 使用方法：
 *   node scripts/query-db.js "SELECT * FROM ppt_reports LIMIT 5;"
 * 
 * 或者交互式查询：
 *   node scripts/query-db.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const readline = require("readline");

const dbPath = path.join(process.cwd(), "data", "ppt.db");
const db = new Database(dbPath);

// 启用 WAL 模式
db.pragma("journal_mode = WAL");

const sql = process.argv[2];

if (sql) {
  // 执行提供的 SQL 查询
  try {
    const stmt = db.prepare(sql);
    
    // 判断是 SELECT 查询还是其他操作
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      const rows = stmt.all();
      console.log(JSON.stringify(rows, null, 2));
    } else {
      const result = stmt.run();
      console.log("执行成功:", result);
    }
  } catch (error) {
    console.error("查询错误:", error);
    process.exit(1);
  }
  db.close();
} else {
  // 交互式模式
  console.log("SQLite 数据库查询工具");
  console.log("数据库路径:", dbPath);
  console.log("\n可用命令:");
  console.log("  .tables          - 列出所有表");
  console.log("  .schema [table] - 显示表结构");
  console.log("  .quit           - 退出");
  console.log("\n输入 SQL 查询语句:");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "sqlite> ",
  });

  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    
    if (input === ".quit" || input === ".exit") {
      rl.close();
      return;
    }
    
    if (input === ".tables") {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all();
      console.log(tables.map((t) => t.name).join("\n"));
      rl.prompt();
      return;
    }
    
    if (input.startsWith(".schema")) {
      const tableName = input.split(" ")[1];
      if (tableName) {
        const schema = db.prepare(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
        ).get(tableName);
        console.log(schema?.sql || "表不存在");
      } else {
        const schemas = db.prepare(
          "SELECT sql FROM sqlite_master WHERE type='table'"
        ).all();
        schemas.forEach((s) => console.log(s.sql));
      }
      rl.prompt();
      return;
    }
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    try {
      const stmt = db.prepare(input);
      if (input.toUpperCase().startsWith("SELECT")) {
        const rows = stmt.all();
        if (rows.length === 0) {
          console.log("(空结果)");
        } else {
          console.table(rows);
        }
      } else {
        const result = stmt.run();
        console.log("执行成功:", result);
      }
    } catch (error) {
      console.error("错误:", error.message);
    }
    
    rl.prompt();
  });

  rl.on("close", () => {
    db.close();
    console.log("\n再见!");
    process.exit(0);
  });
}

