# 应用图标说明（占位）

打包前请在此目录放入真实图标文件。三种格式：

| 文件 | 平台 | 说明 |
| --- | --- | --- |
| `icon.icns` | macOS dmg | 1024×1024 源图生成的 icns |
| `icon.ico` | Windows nsis | 多尺寸(256/128/64/32/16) 合成的 ico |
| `icon.png` | Linux AppImage | ≥512×512 PNG |

## 推荐：用一张 1024×1024 PNG 一键生成三端图标

```bash
# 安装工具（按需）
npm i -D electron-icon-builder
npx electron-icon-builder --input=./icon.png --output=build
```

或使用在线工具（如 https://cloudconvert.com ）转换格式。

## 设计调性

- 暖色调（与主题一致）：底色 `#FBF7F2`，主色 `#C9A88A`，点缀 `#E8896B`。
- 建议图形：毛笔「士」字或一株生长的小苗，呼应 Slogan「三日一寸，刮目相待」。
- 圆角、柔和、治愈系，避免锐利高对比。

> 注：当前仓库未包含二进制图标，开发模式（npm run dev）不依赖图标；
> 执行 `npm run package:mac` 前请先补齐 `build/icon.icns`，否则 electron-builder 会告警。
