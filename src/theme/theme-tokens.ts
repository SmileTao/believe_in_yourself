/**
 * 主题色 token（TS 形式），供 ECharts 主题与 JS 逻辑使用。
 * 与 variables.less 保持同步（唯一真源在 variables.less，此处为运行时镜像）。
 * 现代深色科技风：深底 + 霓虹绿/青点缀。
 */
export const variables = {
  bg: '#0A0E14',
  bg2: '#0D1220',
  surface: '#131A26',
  surfaceGlass: 'rgba(19, 26, 38, 0.72)',
  primary: '#34D399',
  accent: '#22D3EE',
  accent2: '#34D399',
  success: '#34D399',
  warning: '#FBBF24',
  text: '#E6EDF3',
  muted: '#8B98A9',
  border: 'rgba(148, 163, 184, 0.14)',
  white: '#FFFFFF',
  // 侧边栏（深色玻璃）
  sidebarText: '#9AA7B8',
  sidebarTextStrong: '#F1F5F9',
  sidebarTextMuted: '#64748B',
  sidebarActiveText: '#34D399',
  sidebarBorder: 'rgba(148, 163, 184, 0.1)'
};

export type ThemeColor = keyof typeof variables;
