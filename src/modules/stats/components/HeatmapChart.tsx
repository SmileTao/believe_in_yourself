import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { HeatmapCell } from '@shared/contracts';
import { variables } from '../../../theme/theme-tokens';
import { useECharts } from '../../../hooks/useECharts';
import './HeatmapChart.less';

interface HeatmapChartProps {
  data: HeatmapCell[];
  year: number;
}

/** 年度打卡热力图 */
export default function HeatmapChart({ data, year }: HeatmapChartProps) {
  const chartRef = useECharts(
    useMemo<EChartsOption>(() => {
      const series = data.map((d) => [d.day_key, d.done_count]);
      return {
        tooltip: {
          formatter: (p: unknown) => {
            const data = (p as { data: [string, number] }).data;
            return `${data[0]}<br/>完成 ${data[1]} 项`;
          }
        },
        visualMap: {
          min: 0,
          max: 4,
          calculable: false,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          itemHeight: 120,
          inRange: { color: ['#FCEEE3', '#FFD0BC', '#FF9A56', '#FF6B47'] },
          textStyle: { color: variables.muted, fontSize: 11 }
        },
        calendar: {
          top: 30,
          left: 40,
          right: 20,
          cellSize: ['auto', 14],
          range: String(year),
          itemStyle: {
            borderWidth: 2,
            borderColor: variables.bg,
            color: '#FCEEE3'
          },
          yearLabel: { show: false },
          dayLabel: { color: variables.muted, fontSize: 11 },
          monthLabel: { color: variables.muted, fontSize: 11 },
          splitLine: { show: false }
        },
        series: [
          {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: series,
            itemStyle: { borderRadius: 3 }
          }
        ]
      };
    }, [data, year]),
    [data, year]
  );

  return (
    <div className="heatmap-chart card">
      <h3 className="chart-title">{year} 年打卡热力图</h3>
      <div ref={chartRef} className="chart-box" style={{ height: 200 }} />
    </div>
  );
}
