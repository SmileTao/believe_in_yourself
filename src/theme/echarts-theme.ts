import type { EChartsOption } from 'echarts';
import { variables } from './theme-tokens';

/**
 * 暖色 ECharts 主题（仅浅色）。
 * 通过 echarts.registerTheme('shibie', theme) 注册后，
 * 在 init(dom, 'shibie') 时使用。
 */
const { primary, accent, success, warning, text, muted, border, bg, surface } = variables;

export const SHIBIE_ECHARTS_THEME = {
  color: [accent, primary, success, warning, '#D9B38C', '#E89F7C'],
  backgroundColor: 'transparent',
  textStyle: { color: text, fontFamily: 'inherit' },
  title: {
    textStyle: { color: text, fontWeight: 600 },
    subtextStyle: { color: muted }
  },
  legend: { textStyle: { color: muted } },
  tooltip: {
    backgroundColor: surface,
    borderColor: border,
    borderWidth: 1,
    textStyle: { color: text },
    extraCssText: 'box-shadow: 0 4px 14px rgba(255,107,71,0.12); border-radius:12px;'
  },
  grid: { left: 40, right: 20, top: 30, bottom: 36, containLabel: true },
  categoryAxis: {
    axisLine: { lineStyle: { color: border } },
    axisTick: { show: false },
    axisLabel: { color: muted },
    splitLine: { lineStyle: { color: border, type: 'dashed' as const } }
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: muted },
    splitLine: { lineStyle: { color: border, type: 'dashed' as const } }
  },
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { width: 3 },
    itemStyle: { borderWidth: 2, borderColor: bg }
  },
  bar: { itemStyle: { borderRadius: [6, 6, 0, 0] } },
  heatmap: {
    itemStyle: { borderColor: bg, borderWidth: 2, borderRadius: 3 }
  }
} as unknown as EChartsOption;

// 主题色阶（热力图渐变：从浅到深日落色）
export const HEATMAP_VISUAL_MAP = {
  min: 0,
  max: 4,
  calculable: true,
  orient: 'horizontal' as const,
  left: 'center',
  bottom: 0,
  itemHeight: 12,
  inRange: { color: ['#FCEEE3', '#FFD0BC', '#FF9A56', '#FF6B47'] },
  textStyle: { color: muted }
};

export { primary, accent, success, warning, text, muted, border, bg, surface };
