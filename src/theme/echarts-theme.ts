import type { EChartsOption } from 'echarts';
import { variables } from './theme-tokens';

/**
 * 深色科技风 ECharts 主题。
 * 通过 echarts.registerTheme('shibie', theme) 注册后，
 * 在 init(dom, 'shibie') 时使用。
 */
const { primary, accent, success, warning, text, muted, border, bg, surface } = variables;

export const SHIBIE_ECHARTS_THEME = {
  color: [primary, accent, warning, '#A78BFA', success, '#F472B6'],
  backgroundColor: 'transparent',
  textStyle: { color: text, fontFamily: 'inherit' },
  title: {
    textStyle: { color: text, fontWeight: 600 },
    subtextStyle: { color: muted }
  },
  legend: { textStyle: { color: muted } },
  tooltip: {
    backgroundColor: '#0F1622',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderWidth: 1,
    textStyle: { color: text },
    extraCssText: 'box-shadow: 0 4px 14px rgba(0,0,0,0.4); border-radius:12px;'
  },
  grid: { left: 40, right: 20, top: 30, bottom: 36, containLabel: true },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
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

// 主题色阶（热力图渐变：从深底到霓虹绿）
export const HEATMAP_VISUAL_MAP = {
  min: 0,
  max: 4,
  calculable: true,
  orient: 'horizontal' as const,
  left: 'center',
  bottom: 0,
  itemHeight: 12,
  inRange: { color: ['#10161F', '#134E39', '#0E7490', '#34D399', '#22D3EE'] },
  textStyle: { color: muted }
};

export { primary, accent, success, warning, text, muted, border, bg, surface };
