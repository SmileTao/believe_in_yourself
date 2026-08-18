# shibie-mcp

「士别三日」本地成长数据的只读 MCP server（stdio transport）。
把 SQLite 里的打卡、专注、日记、技能树、成就数据暴露为 MCP 工具，
供外部 AI 客户端（DeepSeek Harness、Claude Code 等）调用分析。

## 工具清单（12 个，全部只读）

| 工具 | 说明 |
|---|---|
| `get_overview` | 今日总览：打卡/青蛙/专注/日记/各计划连续天数（AI 分析推荐起点） |
| `list_plans` | 计划列表 + 连续打卡天数 |
| `get_streak` | 某计划连续打卡详情 + 打卡日列表 |
| `get_heatmap` | 年度打卡热力图 |
| `get_checkins` | 打卡记录明细（按计划/日期过滤） |
| `get_pomodoro_sessions` | 专注会话记录 |
| `get_focus_stats` | 按天汇总专注统计（最近 N 天） |
| `get_journal` | 复盘日记（每日三句 + 心情） |
| `get_skill_progress` | AI Agent 技能树进度 |
| `get_achievements` | 成就勋章及解锁状态 |
| `get_frogs` | 某日三只青蛙 |
| `get_db_info` | 数据库概况（表行数/时间跨度） |

## 构建与运行

```bash
cd mcp-server
npm install   # 首次
npm run build # tsc → dist/index.js
node dist/index.js
```

或在项目根目录：

```bash
npm run mcp:build
npm run mcp:start
```

## 数据库路径

默认自动定位各平台 Electron userData 目录：

- macOS: `~/Library/Application Support/shibie/shibie.db`
- Windows: `%APPDATA%/shibie/shibie.db`
- Linux: `~/.config/shibie/shibie.db`

可用环境变量 `SHIBIE_DB_PATH` 覆盖（绝对路径）。

## 安全说明

- 采用 `PRAGMA query_only = ON`：SQL 层禁止一切写入，AI 只能查询
- 不用 `readonly: true` 是因为 SQLite 只读连接无法创建 `-shm` 文件，
  主应用运行中（WAL 活跃）会打不开；query_only 兼容 WAL 且安全性等价
- 附件（照片/视频）只暴露元信息，不返回二进制内容
- 不需要主应用运行；应用运行中也可并发读取（WAL 多读者安全）

## 客户端配置

### DeepSeek Harness (dsh)

dsh 基于 MCP 插件机制接入，在项目级或全局 cordis patch 中添加：

```yaml
# cordis.patch.yml
plugins:
  mcp:
    servers:
      shibie:
        command: node
        args:
          - /absolute/path/to/partner/mcp-server/dist/index.js
```

（具体字段名以 dsh 当前文档的 MCP 配置格式为准，核心是 command + args）

### Claude Code

```bash
# 全局添加
claude mcp add shibie -- node /absolute/path/to/partner/mcp-server/dist/index.js

# 或项目级（写入 .mcp.json）
```

`.mcp.json` 格式：

```json
{
  "mcpServers": {
    "shibie": {
      "command": "node",
      "args": ["/absolute/path/to/partner/mcp-server/dist/index.js"]
    }
  }
}
```

### 其他通用 MCP 客户端（Cursor / Trae 等）

标准 stdio 配置：

```json
{
  "mcpServers": {
    "shibie": {
      "command": "node",
      "args": ["/absolute/path/to/partner/mcp-server/dist/index.js"],
      "env": { "SHIBIE_DB_PATH": "" }
    }
  }
}
```

`env.SHIBIE_DB_PATH` 留空即可走默认路径，仅在数据库不在默认位置时填写。

### 验证

```bash
# 快速自检：应输出 12 个工具列表
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node dist/index.js
```

## 建议的 AI 分析提示词示例

```
用 get_overview 看一下我今天的整体情况，然后用 get_focus_stats 拉最近 30 天
专注数据、get_journal 拉最近 7 天日记，帮我分析：
1. 我的专注习惯有什么规律（哪个时段/星期表现最好）
2. 心情值和打卡完成度有没有相关性
3. 结合 get_streak 的数据，哪个计划有断卡风险，给我具体建议
```

## 开发注意

- 本目录是**独立子包**，自带一份 better-sqlite3（Node ABI）。
  根目录的 better-sqlite3 被 electron-rebuild 编译为 Electron ABI，
  独立 Node 进程无法加载，故必须分开安装，勿合并。
- `src/index.ts` 中 `reg()` 包装函数绕过 MCP SDK 的深度泛型推断
  （zod shape 组合会导致 tsc TS2589 / 编译期 OOM），属 SDK 已知问题，
  运行时行为与 `server.tool()` 完全一致。
