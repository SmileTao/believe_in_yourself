/**
 * 主题色 token（TS 形式），供 ECharts 主题与 JS 逻辑使用。
 * 与 variables.less 保持同步（唯一真源在 variables.less，此处为运行时镜像）。
 */
export const variables = {
  bg: '#EDF7F0',
  bg2: '#F2FAF4',
  surface: '#F5FBF7',
  primary: '#4ADE80',
  accent: '#22C55E',
  accent2: '#4ADE80',
  success: '#16A34A',
  warning: '#FACC15',
  text: '#1F3A28',
  muted: '#6B8174',
  border: '#D1E8D5',
  white: '#FFFFFF',
  // 侧边栏（浅绿渐变）
  sidebarText: '#3A4A3E',
  sidebarTextStrong: '#2A352C',
  sidebarTextMuted: '#5F7063',
  sidebarActiveText: '#16A34A',
  sidebarBorder: '#BDD9C4'
};

export type ThemeColor = keyof typeof variables;
