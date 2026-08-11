import * as echarts from 'echarts/core';
import { LineChart, BarChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  CalendarComponent,
  TitleComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { SHIBIE_ECHARTS_THEME } from '../theme/echarts-theme';

let registered = false;

/** 注册 ECharts 按需模块 + 暖色主题（全局只执行一次） */
export function ensureECharts(): typeof echarts {
  if (!registered) {
    echarts.use([
      CanvasRenderer,
      LineChart,
      BarChart,
      HeatmapChart,
      GridComponent,
      TooltipComponent,
      LegendComponent,
      VisualMapComponent,
      CalendarComponent,
      TitleComponent
    ]);
    echarts.registerTheme('shibie', SHIBIE_ECHARTS_THEME);
    registered = true;
  }
  return echarts;
}
