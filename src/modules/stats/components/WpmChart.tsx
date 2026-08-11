import { useMemo } from 'react';
import { Award } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import type { WpmPoint } from '@shared/contracts';
import { variables } from '../../../theme/theme-tokens';
import { useECharts } from '../../../hooks/useECharts';
import './WpmChart.less';

interface WpmChartProps {
  data: WpmPoint[];
}

/** 近30天 WPM 折线图 + 最佳 WPM 徽章 */
export default function WpmChart({ data }: WpmChartProps) {
  const bestWpm = data.length > 0 ? Math.max(...data.map((d) => d.wpm)) : 0;

  const chartRef = useECharts(
    useMemo<EChartsOption>(() => {
      if (data.length === 0) return {};
      const days = data.map((d) => d.day_key.slice(5)); // MM-DD
      const values = data.map((d) => d.wpm);

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (p: unknown) => {
            const params = p as Array<{ axisValue: string; data: number }>;
            return `${params[0].axisValue}<br/>WPM: <b>${params[0].data}</b>`;
          }
        },
        grid: { left: 40, right: 20, top: 20, bottom: 30, containLabel: true },
        xAxis: {
          type: 'category',
          data: days,
          axisLabel: { fontSize: 10 }
        },
        yAxis: {
          type: 'value',
          axisLabel: { fontSize: 10 }
        },
        series: [
          {
            type: 'line',
            data: values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 3, color: variables.accent },
            itemStyle: { color: variables.accent, borderColor: variables.bg, borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(232,137,107,0.25)' },
                  { offset: 1, color: 'rgba(232,137,107,0.02)' }
                ]
              }
            },
            markPoint:
              bestWpm > 0
                ? {
                    symbol: 'pin',
                    symbolSize: 40,
                    data: [{ name: '最佳', value: bestWpm, xAxis: values.indexOf(bestWpm), yAxis: bestWpm }],
                    itemStyle: { color: variables.warning }
                  }
                : undefined
          }
        ]
      };
    }, [data, bestWpm]),
    [data, bestWpm]
  );

  return (
    <div className="wpm-chart card">
      <div className="wpm-header">
        <h3 className="chart-title">近30天 WPM 趋势</h3>
        {bestWpm > 0 && (
          <span className="best-badge">
            <Award size={15} />
            最佳 {bestWpm} WPM
          </span>
        )}
      </div>
      <div ref={chartRef} className="chart-box" style={{ height: 240 }} />
      {data.length === 0 && (
        <p className="empty-tip muted">还没有打字记录，去打卡记录你的 WPM 吧 🌱</p>
      )}
    </div>
  );
}
