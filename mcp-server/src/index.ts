/**
 * 士别三日 MCP server（stdio，只读）
 *
 * 把本地 SQLite 成长数据（打卡/专注/日记/技能树/成就）暴露为 MCP 工具，
 * 供外部 AI 客户端（Claude Code、DeepSeek Harness 等）调用分析。
 *
 * 安全设计：
 * - 只读模式打开数据库（readonly: true），物理上杜绝写入
 * - 不依赖 Electron 应用运行，直接读 WAL 模式下的同一 db 文件
 * - 不暴露任何附件二进制内容（只返回元信息）
 *
 * 数据库路径解析优先级：
 *   1. 环境变量 SHIBIE_DB_PATH（绝对路径）
 *   2. 各平台 Electron userData 默认目录
 *      macOS:   ~/Library/Application Support/shibie/shibie.db
 *      Windows: %APPDATA%/shibie/shibie.db
 *      Linux:   ~/.config/shibie/shibie.db
 */
import Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

/* ---------------- 数据库连接 ---------------- */

function resolveDbPath(): string {
  if (process.env.SHIBIE_DB_PATH) {
    return process.env.SHIBIE_DB_PATH;
  }
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'shibie', 'shibie.db');
    case 'win32':
      return join(
        process.env.APPDATA ?? join(home, 'AppData', 'Roaming'),
        'shibie',
        'shibie.db'
      );
    default:
      return join(
        process.env.XDG_CONFIG_HOME ?? join(home, '.config'),
        'shibie',
        'shibie.db'
      );
  }
}

const dbPath = resolveDbPath();
if (!existsSync(dbPath)) {
  console.error(`[shibie-mcp] 数据库不存在: ${dbPath}`);
  console.error('请先运行「士别三日」应用生成数据，或通过 SHIBIE_DB_PATH 指定路径');
  process.exit(1);
}
// 不用 readonly: true —— SQLite 只读连接无法创建 -shm 文件，
// 在主应用运行中（WAL 活跃）会打不开。改用可写连接 + query_only：
// SQL 层禁止一切写入（INSERT/UPDATE/DELETE/DDL 均抛错），安全性等价且兼容 WAL。
let db: Database.Database;
try {
  db = new Database(dbPath, { fileMustExist: true });
  // 预热：立即执行一次真实查询，触发 -shm 创建 / WAL 恢复。
  // 放在 query_only 之前（恢复操作需要对共享内存写入），
  // 同时让路径/权限类错误在启动时就暴露（带清晰提示），而非调用工具时才报错。
  db.prepare('SELECT COUNT(*) AS c FROM sqlite_master').get();
} catch (err) {
  console.error(`[shibie-mcp] 数据库打开失败: ${dbPath}`);
  console.error(`[shibie-mcp] 原因: ${err instanceof Error ? err.message : err}`);
  console.error('常见原因：');
  console.error('  1. 目录无写权限（SQLite WAL 需要创建 -shm/-wal 文件）');
  console.error('  2. 数据库文件被损坏或被独占锁定');
  console.error('  3. 从受限沙箱环境启动（请换普通终端运行）');
  process.exit(1);
}
db.pragma('query_only = ON');

/* ---------------- 日期工具（自包含，与 shared/utils/date 逻辑一致） ---------------- */

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`;
}

function isValidDayKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/* ---------------- 通用查询辅助 ---------------- */

interface PlanRow {
  id: string;
  name: string;
  goal: string;
  min_action: string;
  checkin_type: string;
  metric_label: string | null;
  require_evidence: number;
}

function listPlans(): PlanRow[] {
  return db
    .prepare(`SELECT * FROM plans WHERE deleted_at IS NULL ORDER BY sort_order ASC`)
    .all() as PlanRow[];
}

/** 与 checkins.ts getStreak 相同的口径：今日未打卡则从昨天起算（断卡宽限） */
function getStreakMap(): Map<string, { current: number; longest: number }> {
  const rows = db
    .prepare(
      `SELECT plan_id, day_key FROM checkins
       WHERE done = 1 AND deleted_at IS NULL ORDER BY plan_id, day_key ASC`
    )
    .all() as { plan_id: string; day_key: string }[];

  const byPlan = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byPlan.get(r.plan_id) ?? [];
    arr.push(r.day_key);
    byPlan.set(r.plan_id, arr);
  }

  const result = new Map<string, { current: number; longest: number }>();
  for (const [planId, days] of byPlan) {
    let longest = 0;
    let run = 0;
    let prev = '';
    for (const d of days) {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    }
    let current = 0;
    let cursor = todayKey();
    if (!days.includes(cursor)) cursor = addDays(cursor, -1);
    while (days.includes(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
    result.set(planId, { current, longest });
  }
  return result;
}

/** 统一的 JSON 文本响应（对 AI 分析最友好） */
function json(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
  };
}

/* ---------------- MCP Server ---------------- */

const server = new McpServer({
  name: 'shibie-mcp',
  version: '0.1.0'
});

/**
 * 工具注册包装：绕过 SDK server.tool 的深度泛型推断
 * （zod shape 组合会导致 TS2589 / 编译期内存爆炸，属 SDK 已知问题）。
 * 运行时行为与 server.tool 完全一致；代价是 handler 参数不做静态类型检查。
 */
type AnyShape = Record<string, import('zod').ZodTypeAny>;
const reg = (
  name: string,
  description: string,
  shape: AnyShape,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<unknown>
): void => {
  // @ts-expect-error 有意绕过泛型爆炸，见上注释
  server.tool(name, description, shape, handler);
};

/* 1. 今日总览 —— AI 快速了解全局的最佳入口 */
reg(
  'get_overview',
  '获取今日成长数据总览：今日打卡情况、三只青蛙完成度、专注统计、日记摘要、各计划连续打卡天数。AI 分析的推荐起点。',
  {},
  async () => {
    const today = todayKey();
    const plans = listPlans();
    const streaks = getStreakMap();

    // 今日打卡（带计划名）
    const todayCheckins = db
      .prepare(
        `SELECT c.plan_id, p.name AS plan_name, c.done, c.value, c.duration_minutes, c.note
         FROM checkins c JOIN plans p ON p.id = c.plan_id
         WHERE c.day_key = ? AND c.deleted_at IS NULL`
      )
      .all(today) as Array<{ plan_id: string; plan_name: string; done: number }>;

    // 今日青蛙
    const frogs = db
      .prepare(
        `SELECT title, done, sort_order FROM frogs
         WHERE day_key = ? AND deleted_at IS NULL ORDER BY sort_order ASC`
      )
      .all(today) as Array<{ title: string; done: number; sort_order: number }>;

    // 今日专注统计
    const focus = db
      .prepare(
        `SELECT COUNT(*) AS count, COALESCE(SUM(duration_minutes), 0) AS total_minutes
         FROM pomodoro_sessions
         WHERE mode = 'focus' AND ended_at IS NOT NULL AND date(started_at) = ?`
      )
      .get(today) as { count: number; total_minutes: number };

    // 今日日记
    const journal = db
      .prepare(
        `SELECT sentence1, sentence2, sentence3, mood FROM journal_entries
         WHERE day_key = ? AND deleted_at IS NULL`
      )
      .get(today);

    return json({
      today,
      summary: {
        plans_total: plans.length,
        checkins_done: todayCheckins.filter((c) => c.done === 1).length,
        focus_count: focus.count,
        focus_minutes: focus.total_minutes,
        frogs_done: frogs.filter((f) => f.done === 1).length,
        frogs_total: frogs.length
      },
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        goal: p.goal,
        min_action: p.min_action,
        checkin_type: p.checkin_type,
        metric_label: p.metric_label,
        today_done: todayCheckins.some((c) => c.plan_id === p.id && c.done === 1),
        current_streak: streaks.get(p.id)?.current ?? 0,
        longest_streak: streaks.get(p.id)?.longest ?? 0
      })),
      today_checkins: todayCheckins,
      today_frogs: frogs,
      today_focus: focus,
      today_journal: journal ?? null
    });
  }
);

/* 2. 计划列表 */
reg(
  'list_plans',
  '获取所有自律计划列表，含目标、最小行动、打卡类型和连续打卡天数。',
  {},
  async () => {
    const plans = listPlans();
    const streaks = getStreakMap();
    return json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        goal: p.goal,
        min_action: p.min_action,
        checkin_type: p.checkin_type,
        metric_label: p.metric_label,
        require_evidence: p.require_evidence === 1,
        current_streak: streaks.get(p.id)?.current ?? 0,
        longest_streak: streaks.get(p.id)?.longest ?? 0
      }))
    );
  }
);

/* 3. 连续打卡 */
reg(
  'get_streak',
  '查询某个计划的连续打卡信息（当前连续天数、历史最长连续天数、打卡日列表）。',
  {
    plan_id: z.string().describe('计划 ID，可先通过 list_plans 获取')
  },
  async ({ plan_id }) => {
    const rows = db
      .prepare(
        `SELECT DISTINCT day_key FROM checkins
         WHERE plan_id = ? AND done = 1 AND deleted_at IS NULL ORDER BY day_key ASC`
      )
      .all(plan_id) as { day_key: string }[];
    const days = rows.map((r) => r.day_key);
    const streaks = getStreakMap().get(plan_id);

    return json({
      plan_id,
      total_checkin_days: days.length,
      current_streak: streaks?.current ?? 0,
      longest_streak: streaks?.longest ?? 0,
      days
    });
  }
);

/* 4. 年度热力图 */
reg(
  'get_heatmap',
  '获取某年度的打卡热力图数据：每个打卡日的完成计划数（用于分析打卡规律、断卡时段）。',
  {
    year: z.number().int().describe('年份，如 2026')
  },
  async ({ year }) => {
    const total = (
      db.prepare(`SELECT COUNT(*) AS c FROM plans WHERE deleted_at IS NULL`).get() as {
        c: number;
      }
    ).c;
    const rows = db
      .prepare(
        `SELECT day_key, COUNT(DISTINCT plan_id) AS done_count FROM checkins
         WHERE done = 1 AND deleted_at IS NULL AND substr(day_key,1,4) = ?
         GROUP BY day_key`
      )
      .all(String(year)) as { day_key: string; done_count: number }[];
    return json({
      year,
      plans_total: total,
      days_with_checkins: rows.length,
      heatmap: rows
    });
  }
);

/* 5. 打卡记录明细 */
reg(
  'get_checkins',
  '查询打卡记录明细，支持按计划、日期范围过滤。返回数值、时长、笔记等字段（不含附件内容）。',
  {
    plan_id: z.string().optional().describe('计划 ID，省略则查所有计划'),
    start_date: z.string().optional().describe('开始日期 YYYY-MM-DD'),
    end_date: z.string().optional().describe('结束日期 YYYY-MM-DD'),
    limit: z.string().optional().describe('最多返回条数，默认 200')
  },
  async ({ plan_id, start_date, end_date, limit: rawLimit }) => {
    const limit = Math.min(Number(rawLimit ?? 200) || 200, 1000);
    if (start_date && !isValidDayKey(start_date)) {
      return { content: [{ type: 'text', text: 'start_date 格式应为 YYYY-MM-DD' }] };
    }
    if (end_date && !isValidDayKey(end_date)) {
      return { content: [{ type: 'text', text: 'end_date 格式应为 YYYY-MM-DD' }] };
    }
    const conditions = ['c.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (plan_id) {
      conditions.push('c.plan_id = ?');
      params.push(plan_id);
    }
    if (start_date) {
      conditions.push('c.day_key >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('c.day_key <= ?');
      params.push(end_date);
    }
    const rows = db
      .prepare(
        `SELECT c.day_key, c.plan_id, p.name AS plan_name, c.done, c.value,
                c.duration_minutes, c.note, c.attachment_type, c.attachment_name
         FROM checkins c LEFT JOIN plans p ON p.id = c.plan_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY c.day_key DESC
         LIMIT ?`
      )
      .all(...params, Math.min(limit, 1000));
    return json({ count: rows.length, checkins: rows });
  }
);

/* 6. 专注会话记录 */
reg(
  'get_pomodoro_sessions',
  '查询番茄钟专注会话记录，支持日期范围过滤。每条含开始/结束时间、时长、关联计划。',
  {
    start_date: z.string().optional().describe('开始日期 YYYY-MM-DD'),
    end_date: z.string().optional().describe('结束日期 YYYY-MM-DD'),
    limit: z.string().optional().describe('最多返回条数，默认 200')
  },
  async ({ start_date, end_date, limit: rawLimit }) => {
    const limit = Math.min(Number(rawLimit ?? 200) || 200, 1000);
    const conditions = ["s.deleted_at IS NULL", "s.ended_at IS NOT NULL"];
    const params: unknown[] = [];
    if (start_date) {
      conditions.push('date(s.started_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('date(s.started_at) <= ?');
      params.push(end_date);
    }
    const rows = db
      .prepare(
        `SELECT s.started_at, s.ended_at, s.duration_minutes, s.mode,
                s.plan_id, p.name AS plan_name
         FROM pomodoro_sessions s LEFT JOIN plans p ON p.id = s.plan_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY s.started_at DESC
         LIMIT ?`
      )
      .all(...params, Math.min(limit, 1000));
    return json({ count: rows.length, sessions: rows });
  }
);

/* 7. 专注统计（按天汇总） */
reg(
  'get_focus_stats',
  '按天汇总专注统计：最近 N 天每天专注次数和总时长，以及区间合计。适合分析专注习惯趋势。',
  {
    days: z.string().optional().describe('最近 N 天，默认 30')
  },
  async ({ days: rawDays }) => {
    const days = Math.min(Math.max(Number(rawDays ?? 30) || 30, 1), 365);
    const start = addDays(todayKey(), -(days - 1));
    const rows = db
      .prepare(
        `SELECT date(started_at) AS day_key,
                COUNT(*) AS focus_count,
                SUM(duration_minutes) AS total_minutes
         FROM pomodoro_sessions
         WHERE mode = 'focus' AND ended_at IS NOT NULL AND date(started_at) >= ?
         GROUP BY date(started_at)
         ORDER BY day_key ASC`
      )
      .all(start) as { day_key: string; focus_count: number; total_minutes: number }[];
    const totalCount = rows.reduce((s, r) => s + r.focus_count, 0);
    const totalMinutes = rows.reduce((s, r) => s + r.total_minutes, 0);
    return json({
      range: { start, end: todayKey(), days },
      total_focus_count: totalCount,
      total_minutes: totalMinutes,
      daily: rows
    });
  }
);

/* 8. 复盘日记 */
reg(
  'get_journal',
  '获取复盘日记（每日三句 + 心情值）。可查指定日期或多条最近记录。是理解用户每日状态的核心文本数据。',
  {
    day_key: z.string().optional().describe('指定日期 YYYY-MM-DD'),
    limit: z.number().int().optional().default(7).describe('查询最近 N 条（day_key 省略时生效），默认 7')
  },
  async ({ day_key, limit }) => {
    if (day_key) {
      const row = db
        .prepare(
          `SELECT day_key, sentence1, sentence2, sentence3, mood
           FROM journal_entries WHERE day_key = ? AND deleted_at IS NULL`
        )
        .get(day_key);
      return json({ entries: row ? [row] : [] });
    }
    const rows = db
      .prepare(
        `SELECT day_key, sentence1, sentence2, sentence3, mood
         FROM journal_entries WHERE deleted_at IS NULL
         ORDER BY day_key DESC LIMIT ?`
      )
      .all(Math.min(limit, 100));
    return json({ count: rows.length, entries: rows });
  }
);

/* 9. 技能树进度 */
reg(
  'get_skill_progress',
  '获取 AI Agent 技能树进度：每层节点数、各状态（进行中/已完成/可解锁/锁定）统计和节点明细。',
  {},
  async () => {
    const nodes = db
      .prepare(
        `SELECT level, code, name, description, status, note, est_hours, actual_hours
         FROM skill_nodes WHERE deleted_at IS NULL ORDER BY level ASC, sort_order ASC`
      )
      .all();
    const byLevel = new Map<number, unknown[]>();
    for (const node of nodes as Array<{ level: number }>) {
      const arr = byLevel.get(node.level) ?? [];
      arr.push(node);
      byLevel.set(node.level, arr);
    }
    const levels = [...byLevel.entries()].map(([level, list]) => {
      const l = list as Array<{ status: string }>;
      return {
        level,
        total: l.length,
        completed: l.filter((x) => x.status === 'completed').length,
        in_progress: l.filter((x) => x.status === 'in_progress').length,
        available: l.filter((x) => x.status === 'available').length,
        locked: l.filter((x) => x.status === 'locked').length,
        nodes: list
      };
    });
    const all = nodes as Array<{ status: string; est_hours: number | null; actual_hours: number | null }>;
    return json({
      total_nodes: all.length,
      completed: all.filter((x) => x.status === 'completed').length,
      total_est_hours: all.reduce((s, x) => s + (x.est_hours ?? 0), 0),
      total_actual_hours: all.reduce((s, x) => s + (x.actual_hours ?? 0), 0),
      levels
    });
  }
);

/* 10. 成就勋章 */
reg(
  'get_achievements',
  '获取成就勋章列表及解锁状态。',
  {},
  async () => {
    const rows = db
      .prepare(
        `SELECT code, title, description, unlocked_at FROM achievements
         WHERE deleted_at IS NULL ORDER BY code ASC`
      )
      .all();
    return json({
      total: rows.length,
      unlocked: (rows as Array<{ unlocked_at: string | null }>).filter((r) => r.unlocked_at).length,
      achievements: rows
    });
  }
);

/* 11. 三只青蛙 */
reg(
  'get_frogs',
  '获取指定日期的三只青蛙（每日要事）及完成状态。省略日期则查今天。',
  {
    day_key: z.string().optional().describe('日期 YYYY-MM-DD，默认今天')
  },
  async ({ day_key }) => {
    const day = day_key ?? todayKey();
    const rows = db
      .prepare(
        `SELECT f.title, f.done, f.sort_order, p.name AS plan_name
         FROM frogs f LEFT JOIN plans p ON p.id = f.plan_id
         WHERE f.day_key = ? AND f.deleted_at IS NULL ORDER BY f.sort_order ASC`
      )
      .all(day);
    return json({ day_key: day, count: rows.length, frogs: rows });
  }
);

/* 12. 数据库概况 */
reg(
  'get_db_info',
  '获取数据库概况：各表行数、数据时间跨度。帮助了解数据量级。',
  {},
  async () => {
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table'
         AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'trg_%' ORDER BY name`
      )
      .all() as { name: string }[];
    const rowCount = tables.map((t) => ({
      table: t.name,
      count: (db.prepare(`SELECT COUNT(*) AS c FROM "${t.name}"`).get() as { c: number }).c
    }));
    const span = db
      .prepare(
        `SELECT MIN(day_key) AS earliest, MAX(day_key) AS latest FROM checkins WHERE deleted_at IS NULL`
      )
      .get() as { earliest: string | null; latest: string | null };
    return json({ db_path: dbPath, data_span: span, tables: rowCount });
  }
);

/* ---------------- 启动 ---------------- */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr 不干扰 stdio 协议，可用于调试
  console.error(`[shibie-mcp] 就绪 (db: ${dbPath})`);
}

main().catch((err) => {
  console.error('[shibie-mcp] 启动失败:', err);
  process.exit(1);
});
