/**
 * 主题色 token（TS 形式），供 ECharts 主题与 JS 逻辑使用。
 * 与 variables.less 保持同步（唯一真源在 variables.less，此处为运行时镜像）。
 */
export const variables = {
  bg: '#FBF7F2',
  surface: '#F4ECE2',
  primary: '#C9A88A',
  accent: '#E8896B',
  success: '#A8C9A3',
  warning: '#E8C275',
  text: '#5B4A3A',
  muted: '#A89B8C',
  border: '#E7DDD0',
  white: '#FFFFFF'
};

export type ThemeColor = keyof typeof variables;
