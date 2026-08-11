/**
 * 跨平台差异封装（渲染层）。
 * 平台判断集中于此；快捷键一律用 "CmdOrCtrl+X"，禁硬编码 Cmd+/Ctrl+。
 * 路径相关逻辑禁硬编码分隔符（主进程用 path.join）。
 * dock API 调用前必须判断 isMac；Win/Linux 用 win.flashFrame()（经 IPC 由主进程执行）。
 */

export type Platform = 'mac' | 'win' | 'linux';

function detect(): Platform {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const plat = (typeof process !== 'undefined' && process.platform) || '';
  if (/Mac|iPhone|iPod|iPad/.test(ua) || plat === 'darwin') return 'mac';
  if (/Win/.test(ua) || plat === 'win32') return 'win';
  return 'linux';
}

export const platform: Platform = detect();

export const isMac = platform === 'mac';
export const isWin = platform === 'win';
export const isLinux = platform === 'linux';

/** 平台修饰键展示文本（mac: ⌘ / 其余: Ctrl） */
export const modKey = isMac ? '⌘' : 'Ctrl';

/** 标题栏样式：mac 用隐藏式内嵌，其余用系统默认 */
export const titleBarStyle: 'hidden' | 'default' = isMac ? 'hidden' : 'default';

/** 是否支持 macOS dock（仅 mac 有 dock API） */
export const supportsDock = isMac;

/**
 * 闪烁窗口以提醒用户。
 * - Win/Linux：经 IPC 触发主进程 win.flashFrame(true)
 * - mac：用 dock bounce（经 IPC），渲染层仅返回意图
 */
export function flashAttention(): void {
  if (isMac) {
    window.api.ping().catch(() => undefined); // 占位：实际 dock bounce 由主进程在通知时处理
  }
}
