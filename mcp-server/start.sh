#!/usr/bin/env bash
# 启动 shibie-mcp：自动安装依赖（如缺）→ 构建（如源码有变）→ 用 MCP Inspector 打开测试 UI
# 用法：
#   ./start.sh          # Inspector 可视化测试（浏览器 UI）
#   ./start.sh --raw    # 直接跑 server（stdio 协议，供 MCP 客户端调用）
set -euo pipefail

cd "$(dirname "$0")"

PKG_DIR="node_modules"
ENTRY="dist/index.js"

# 1. 依赖安装（仅缺失时）
if [ ! -d "$PKG_DIR/@modelcontextprotocol" ]; then
  echo "[1/3] 安装依赖..."
  npm install
else
  echo "[1/3] 依赖已就绪"
fi

# 2. 构建（源码比产物新时才重编译）
if [ ! -f "$ENTRY" ] || [ src/index.ts -nt "$ENTRY" ]; then
  echo "[2/3] 编译 TypeScript..."
  npm run build
else
  echo "[2/3] 构建产物已是最新"
fi

# 3. 启动
if [ "${1:-}" = "--raw" ]; then
  echo "[3/3] 以 stdio 模式启动 server（Ctrl+C 退出）"
  exec node "$ENTRY"
else
  echo "[3/3] 启动 MCP Inspector（浏览器自动打开 http://localhost:6274）"
  npx @modelcontextprotocol/inspector node "$ENTRY"
fi
