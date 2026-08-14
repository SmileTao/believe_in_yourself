import { app, BrowserWindow, ipcMain, shell, Notification, nativeImage, dialog, protocol } from 'electron';
import { join, extname } from 'node:path';
import { copyFileSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { getDb, closeDb, collectDbInfo, getDbPath } from './db/connection';
import { repos, seedAll } from './db/repositories';
import { APP_NAME_ZH, APP_BUNDLE_ID } from '@shared/constants';

/** 附件存储根目录 */
function getAttachmentsDir(): string {
  return join(app.getPath('userData'), 'attachments');
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * 主进程入口。
 * - 应用标识：窗口/dock 显示中文「士别三日」，name/bundleId 用 shibie。
 * - better-sqlite3 只在主进程；渲染层经 preload IPC 访问，禁 nodeIntegration。
 * - 路径一律 path.join。
 */

// 窗口标题与 dock 显示中文；userData 目录统一用 shibie（避免中文路径）
app.setName(APP_NAME_ZH);
app.setPath('userData', join(app.getPath('appData'), 'shibie'));

// 声明 att:// 为特权协议：必须在 app.ready 之前调用。
// 否则 Chromium 会在 <img>/<video> 中拦截未注册的自定义协议 → 裂图。
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'att',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,        // 允许视频 seek / range 请求
      codeCache: true,
      bypassCSP: true
    }
  }
]);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: APP_NAME_ZH,
    backgroundColor: '#FBF7F2',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // ad-hoc 签名下 sandbox 不可用（Operation not permitted）；contextIsolation 已保证安全
      sandbox: false,
      spellcheck: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    // macOS 激活 dock（无图标时也可点击聚焦）
    if (process.platform === 'darwin') app.dock?.show?.();
  });

  // 外链在系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 开发环境加载 dev server，生产加载打包产物
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

/** 注册 IPC 处理器（映射到 repository） */
function registerIpc(): void {
  ipcMain.handle('app:ping', () => ({ ok: true, at: new Date().toISOString() }));
  ipcMain.handle('db:info', () => collectDbInfo());

  // plan
  ipcMain.handle('plan:list', () => repos.plan.list());
  ipcMain.handle('plan:create', (_e, input) => repos.plan.create(input));
  ipcMain.handle('plan:update', (_e, id, patch) => repos.plan.update(id, patch));
  ipcMain.handle('plan:remove', (_e, id) => repos.plan.softDelete(id));

  // checkin
  ipcMain.handle('checkin:get', (_e, planId, dayKey) =>
    repos.checkin.getByPlanAndDay(planId, dayKey)
  );
  ipcMain.handle('checkin:check', (_e, input) => repos.checkin.check(input));
  ipcMain.handle('checkin:uncheck', (_e, planId, dayKey) => repos.checkin.uncheck(planId, dayKey));
  ipcMain.handle('checkin:getByPlan', (_e, planId) => repos.checkin.getByPlan(planId));
  ipcMain.handle('checkin:streak', (_e, planId) => repos.checkin.getStreak(planId));
  ipcMain.handle('checkin:heatmap', (_e, year) => repos.checkin.getHeatmap(year));
  ipcMain.handle('checkin:rate', (_e, planId, range) =>
    repos.checkin.getCompletionRate(planId, range)
  );
  ipcMain.handle('checkin:wpm', (_e, planId, days) => repos.checkin.getWpmSeries(planId, days));

  // skill
  ipcMain.handle('skill:list', () => repos.skill.list());
  ipcMain.handle('skill:updateStatus', (_e, code, status, note?) => repos.skill.updateStatus(code, status, note));
  ipcMain.handle('skill:update', (_e, code, patch) => repos.skill.update(code, patch));

  // frog
  ipcMain.handle('frog:list', (_e, dayKey) => repos.frog.listByDay(dayKey));
  ipcMain.handle('frog:create', (_e, input) => repos.frog.create(input));
  ipcMain.handle('frog:toggle', (_e, id, done) => repos.frog.toggle(id, done));
  ipcMain.handle('frog:remove', (_e, id) => repos.frog.softDelete(id));

  // pomodoro
  ipcMain.handle('pomodoro:start', (_e, input) => repos.pomodoro.start(input));
  ipcMain.handle('pomodoro:finish', (_e, id, dur) => repos.pomodoro.finish(id, dur));
  ipcMain.handle('pomodoro:focusCount', (_e, dayKey: string) => repos.pomodoro.getFocusCountByDay(dayKey));

  // journal
  ipcMain.handle('journal:get', (_e, dayKey) => repos.journal.getByDay(dayKey));
  ipcMain.handle('journal:getRecent', (_e, limit) => repos.journal.getRecent(limit));
  ipcMain.handle('journal:upsert', (_e, input) => repos.journal.upsert(input));

  // setting
  ipcMain.handle('setting:get', (_e, key, fallback) => repos.setting.get(key, fallback));
  ipcMain.handle('setting:set', (_e, key, value) => repos.setting.set(key, value));
  ipcMain.handle('setting:all', () => repos.setting.getAll());

  // achievement
  ipcMain.handle('achievement:list', () => repos.achievement.list());
  ipcMain.handle('achievement:unlock', (_e, code) => repos.achievement.unlock(code));

  // notification（番茄钟结束提醒）
  ipcMain.handle('notify', (_e, title: string, body: string) => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    // macOS dock bounce；Win/Linux flashFrame
    if (process.platform === 'darwin') {
      app.dock?.bounce?.('informational');
    } else if (win) {
      win.flashFrame(true);
      setTimeout(() => win.flashFrame(false), 4000);
    }
    if (Notification.isSupported()) {
      const n = new Notification({
        title,
        body,
        silent: false
      });
      n.on('click', () => {
        win?.show();
        win?.focus();
      });
      n.show();
    }
  });

  // 全屏切换（全屏专注模式）
  ipcMain.handle('win:setFullScreen', (_e, on: boolean) => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    win?.setFullScreen(on);
  });

  // 导出数据（SQLite 文件 + JSON 设置快照）
  ipcMain.handle('data:export', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const ts = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(win!, {
      title: '导出数据',
      defaultPath: `shibie-backup-${ts}`,
      filters: [{ name: 'SQLite 数据库', extensions: ['db'] }],
      properties: ['createDirectory']
    });
    if (result.canceled || !result.filePath) return { ok: false };

    // 复制 db 文件
    copyFileSync(getDbPath(), result.filePath);

    // 导出设置 JSON 到同目录
    const settings = repos.setting.getAll();
    const jsonPath = result.filePath.replace(/\.db$/, '.json');
    writeFileSync(jsonPath, JSON.stringify({ settings, exportedAt: ts }, null, 2), 'utf-8');

    return { ok: true, path: result.filePath };
  });

  // 导入数据（覆盖 SQLite 文件）
  ipcMain.handle('data:import', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win!, {
      title: '导入数据（将覆盖当前数据）',
      filters: [{ name: 'SQLite 数据库', extensions: ['db'] }],
      properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false };

    const importPath = result.filePaths[0];
    if (!existsSync(importPath)) return { ok: false, error: '文件不存在' };

    // 关闭当前 DB，替换文件，重新打开
    closeDb();
    copyFileSync(importPath, getDbPath());

    // 导入设置 JSON（如果存在）
    const jsonPath = importPath.replace(/\.db$/, '.json');
    if (existsSync(jsonPath)) {
      try {
        const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        if (data.settings) {
          for (const [k, v] of Object.entries(data.settings)) {
            repos.setting.set(k, String(v));
          }
        }
      } catch {
        /* JSON 解析失败则忽略 */
      }
    }

    // 重新初始化
    getDb();

    return { ok: true };
  });

  // 文件上传：选择截图或视频，复制到 attachments 目录
  ipcMain.handle('attachment:select', async (_e, opts: { planId: string; dayKey: string }) => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win!, {
      title: '选择学习证据（截图或视频）',
      filters: [
        { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] },
        { name: '视频', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }
      ],
      properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true } as const;
    }

    const srcPath = result.filePaths[0];
    const ext = extname(srcPath).toLowerCase();
    const stat = statSync(srcPath);

    // 判断类型 + 大小校验
    let attType: 'screenshot' | 'video';
    if (IMAGE_EXTS.includes(ext)) {
      attType = 'screenshot';
      if (stat.size > MAX_IMAGE_SIZE) {
        return { ok: false, error: `图片大小不能超过 10MB（当前 ${(stat.size / 1024 / 1024).toFixed(1)}MB）` } as const;
      }
    } else if (VIDEO_EXTS.includes(ext)) {
      attType = 'video';
      if (stat.size > MAX_VIDEO_SIZE) {
        return { ok: false, error: `视频大小不能超过 500MB（当前 ${(stat.size / 1024 / 1024).toFixed(1)}MB）` } as const;
      }
    } else {
      return { ok: false, error: '不支持的文件格式' } as const;
    }

    // 复制到 attachments/{planId}/{dayKey}{ext}
    const subDir = join(getAttachmentsDir(), opts.planId);
    mkdirSync(subDir, { recursive: true });
    const destName = `${opts.dayKey}${ext}`;
    const destPath = join(subDir, destName);
    copyFileSync(srcPath, destPath);

    // 返回相对路径（用于 att:// 协议）
    const relPath = `${opts.planId}/${destName}`;
    return {
      ok: true,
      attachmentPath: relPath,
      attachmentType: attType,
      attachmentName: srcPath.split('/').pop() ?? destName
    } as const;
  });

  // 获取附件完整 URL（渲染层用）
  ipcMain.handle('attachment:getUrl', (_e, relPath: string) => {
    return `att://${relPath}`;
  });
}

// 暴露 bundleId 给打包工具识别（避免 tree-shake）
void APP_BUNDLE_ID;

app.whenReady().then(() => {
  // 注册 att:// 自定义协议：直接读取附件文件并返回 Response
  // att://{planId}/{dayKey}.{ext} → attachments/{planId}/{dayKey}.{ext}
  const MIME: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
    '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska'
  };

  protocol.handle('att', (request) => {
    // 从 URL 中提取相对路径：att://planId/2026-08-11.png → planId/2026-08-11.png
    const relPath = decodeURIComponent(request.url.slice('att://'.length));
    const filePath = join(getAttachmentsDir(), relPath);

    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';
    const data = readFileSync(filePath);
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: { 'Content-Type': contentType }
    });
  });

  registerIpc();
  // 初始化数据库并自动 seed（幂等）
  const db = getDb();
  seedAll(db);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS 习惯：关窗不退出；其余平台退出
  if (process.platform !== 'darwin') {
    closeDb();
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDb();
});
