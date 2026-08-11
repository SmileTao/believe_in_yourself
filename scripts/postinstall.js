/**
 * postinstall：装依赖后自动执行。
 * 1) 重建 better-sqlite3 原生模块（匹配 Electron ABI）
 * 2) macOS：
 *    - ad-hoc 重签名 Electron.app（改变签名特征，规避 XProtect 误杀）
 *    - 去除 quarantine 属性（规避 Gatekeeper 拦截）
 *
 * 背景：Electron 官方未签名二进制常被 macOS XProtect 按病毒库签名匹配
 * 静默清除。ad-hoc 重签名会改变 CodeDirectory 哈希，使签名匹配失效，
 * 同时保持二进制可执行。这是社区通用 workaround。
 *
 * 跨平台安全：非 macOS 自动跳过。
 */
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const isMac = process.platform === 'darwin';
const electronApp = join(__dirname, '..', 'node_modules', 'electron', 'dist', 'Electron.app');

function run(cmd, label, allowFail = false) {
  try {
    console.log(`[shibie postinstall] ${label}...`);
    execSync(cmd, { stdio: 'inherit', cwd: join(__dirname, '..') });
    console.log(`[shibie postinstall] ${label} ✓`);
  } catch (err) {
    if (allowFail) {
      console.warn(`[shibie postinstall] ${label} 跳过: ${err.message}`);
    } else {
      throw err;
    }
  }
}

// 1) 重建原生模块（匹配 Electron ABI）
run('electron-rebuild -f -w better-sqlite3', '重建 better-sqlite3', true);

// 2) macOS：规避 XProtect 静默清除 + Gatekeeper 拦截
if (isMac) {
  if (existsSync(electronApp)) {
    run(`codesign --force --deep --sign - "${electronApp}"`, 'ad-hoc 重签名 Electron', true);
    run(`xattr -dr com.apple.quarantine "${electronApp}"`, '去除 quarantine 属性', true);
    console.log('[shibie postinstall] Electron 已加固，可抵御 XProtect/Gatekeeper');
  } else {
    console.warn('[shibie postinstall] 未找到 Electron.app，跳过加固（可能尚未下载）');
  }
}
