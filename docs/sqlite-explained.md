# SQLite 数据库入门说明

## SQLite vs 服务器数据库（MySQL/PostgreSQL）

### 服务器数据库（需要启动服务）
```
MySQL/PostgreSQL 的工作方式：
┌─────────────┐
│  数据库服务器 │ ← 需要启动服务（mysqld, postgres）
│  (运行中)    │ ← 监听端口（3306, 5432）
└─────────────┘
      ↑
      │ TCP/IP 连接
      │ (需要 URL, username, password)
      │
┌─────────────┐
│  你的应用    │
└─────────────┘
```

**特点：**
- ✅ 需要先启动数据库服务器
- ✅ 需要连接 URL（如：`mysql://localhost:3306`）
- ✅ 需要用户名和密码
- ✅ 可以远程连接
- ✅ 支持多用户并发

### SQLite（文件数据库，无需启动服务）
```
SQLite 的工作方式：
┌─────────────┐
│  你的应用    │
└─────────────┘
      │
      │ 直接读写文件
      │ (只需要文件路径)
      │
┌─────────────┐
│  data/ppt.db │ ← 就是一个文件！
└─────────────┘
```

**特点：**
- ✅ **不需要启动服务**（没有数据库服务器进程）
- ✅ **不需要 URL**（只需要文件路径）
- ✅ **不需要用户名密码**（文件系统权限就是权限控制）
- ✅ 轻量级，适合小型应用
- ✅ 数据库就是一个文件

## 本项目中的 SQLite 连接

### 连接建立时机

在你的项目中，数据库连接是在 **代码执行时** 建立的：

```typescript
// src/lib/db/index.ts

// 1. 指定数据库文件路径
const dbPath = path.join(process.cwd(), "data", "ppt.db");

// 2. 创建连接（这里才"启动"数据库）
const sqlite = new Database(dbPath);  // ← 这一刻才打开数据库文件

// 3. 配置数据库
sqlite.pragma("journal_mode = WAL");

// 4. 创建 Drizzle ORM 实例
export const db = drizzle(sqlite, { schema });
```

### 连接流程

1. **应用启动时**：当 Next.js 服务器启动，加载 `src/lib/db/index.ts` 时
2. **执行 `new Database(dbPath)`**：打开 `data/ppt.db` 文件
3. **如果文件不存在**：SQLite 会自动创建这个文件
4. **连接建立**：现在可以执行 SQL 查询了

### 实际使用示例

```typescript
// src/app/api/report/route.ts
import { db } from "@/lib/db";  // ← 导入时，连接已经建立

export async function GET() {
  // 直接使用，不需要额外连接
  const result = await db.select().from(pptReports);
  return NextResponse.json(result);
}
```

## 常见问题

### Q: 数据库什么时候启动的？
**A:** SQLite 没有"启动"的概念。当你执行 `new Database(dbPath)` 时，就是打开数据库文件。这个过程是**同步的、即时的**，不需要等待服务器启动。

### Q: 为什么不需要 URL？
**A:** 因为 SQLite 直接操作文件，不需要网络连接。文件路径就是"地址"：
- MySQL: `mysql://localhost:3306/mydb`
- SQLite: `./data/ppt.db` （就是文件路径）

### Q: 为什么不需要用户名密码？
**A:** SQLite 使用文件系统的权限来控制访问。如果用户有权限读取/写入 `data/ppt.db` 文件，就可以操作数据库。不需要额外的认证机制。

### Q: 多个应用可以同时访问吗？
**A:** 可以！SQLite 支持并发读取，也支持并发写入（通过 WAL 模式）。你的代码中已经启用了 WAL 模式：
```typescript
sqlite.pragma("journal_mode = WAL");  // ← 这行代码启用了并发支持
```

### Q: 数据库文件在哪里？
**A:** 在你的项目根目录下的 `data/ppt.db`：
```
hongguanai4/
├── data/
│   └── ppt.db  ← 这就是数据库！
├── src/
└── package.json
```

你可以直接用文件管理器看到这个文件，甚至可以用文本编辑器打开（虽然不推荐，因为它是二进制格式）。

## 类比理解

把 SQLite 想象成：
- **Excel 文件**：就是一个文件，不需要启动 Excel 服务器
- **文本文件**：直接读写，不需要连接服务器
- **本地文件**：文件路径就是"地址"

把 MySQL/PostgreSQL 想象成：
- **Google Sheets**：需要登录，需要网络连接
- **远程服务器**：需要知道服务器地址和认证信息

## 总结

| 特性 | SQLite | MySQL/PostgreSQL |
|------|--------|------------------|
| 启动服务 | ❌ 不需要 | ✅ 需要 |
| 连接 URL | ❌ 不需要 | ✅ 需要 |
| 用户名密码 | ❌ 不需要 | ✅ 需要 |
| 数据库文件 | ✅ 就是一个文件 | ❌ 存储在服务器 |
| 适合场景 | 小型应用、开发环境 | 大型应用、生产环境 |

在你的项目中：
- **开发环境**：使用 SQLite（`data/ppt.db`）
- **生产环境**：可以切换到 MySQL（根据项目规则）

