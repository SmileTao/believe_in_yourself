import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { ensureECharts } from '../utils/echarts-setup';

/**
 * ECharts React 封装：自动初始化/销毁/resize。
 * 使用暖色主题 'shibie'。
 */
export function useECharts(option: EChartsOption, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [ready, setReady] = useState(false);

  // 初始化
  useEffect(() => {
    if (!ref.current) return;
    const ec = ensureECharts();
    chartRef.current = ec.init(ref.current, 'shibie');
    setReady(true);

    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  // 更新 option
  useEffect(() => {
    if (chartRef.current && ready) {
      chartRef.current.setOption(option, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps]);

  return ref;
}
