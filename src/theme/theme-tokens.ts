/**
 * 主题色 token（TS 形式），供 ECharts 主题与 JS 逻辑使用。
 * 与 variables.less 保持同步（唯一真源在 variables.less，此处为运行时镜像）。
 */
export const variables = {
  bg: '#F9E4D6',
  bg2: '#FCEEE3',
  surface: '#FFF6EF',
  primary: '#E8845E',
  accent: '#FF6B47',
  accent2: '#FF9A56',
  success: '#34C77B',
  warning: '#FFB133',
  text: '#4A3528',
  muted: '#9C7E6A',
  border: '#F0DAC9',
  white: '#FFFFFF'
};

export type ThemeColor = keyof typeof variables;
