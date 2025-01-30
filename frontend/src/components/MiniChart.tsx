import { Component, createMemo, onMount, onCleanup } from 'solid-js';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  TimeScale,
  Filler
} from 'chart.js';
import { enUS } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';
import type { Token, TokenHistory } from '../types';

// Register Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  TimeScale,
  Filler
);

interface MiniChartProps {
  token: Token;
  history: TokenHistory[];
  type: 'liquidity' | 'holders';
  class?: string;
}

export const MiniChart: Component<MiniChartProps> = (props) => {
  let chartContainer: HTMLDivElement | undefined;
  let chart: ChartJS | undefined;

  // Memoize data processing
  const dataMemo = createMemo(() => {
    try {
      if (!props.history?.length) {
        return [];
      }

      // Sort and sample data
      const sortedData = [...props.history].sort((a, b) => a.timestamp - b.timestamp);
      
      return sortedData.map(point => ({
        x: Math.floor(point.timestamp / 1000),
        y: props.type === 'liquidity' ? point.totalLiquidity : point.holderCount
      }));
    } catch (err) {
      console.error('[MiniChart] Error processing data:', err);
      return [];
    }
  });

  // Calculate trend
  const trendInfo = createMemo(() => {
    const data = dataMemo();
    if (data.length < 2) return { trendDirection: 'stagnant' as const };

    const xValues = data.map((_, i) => i);
    const yValues = data.map(d => d.y);
    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
    
    const slope = xValues.reduce((acc, x, i) => {
      return acc + (x - xMean) * (yValues[i] - yMean);
    }, 0) / xValues.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0);

    return { 
      trendDirection: Math.abs(slope) < 0.05 ? 'stagnant' : slope > 0 ? 'up' : 'down'
    };
  });

  const createOrUpdateChart = () => {
    try {
      if (!chartContainer) return;
      const canvas = chartContainer.querySelector('canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const data = dataMemo();
      if (!data.length) return;

      // Destroy existing chart
      if (chart) {
        chart.destroy();
      }

      // Create new chart with minimal options
      chart = new ChartJS(ctx, {
        type: 'line',
        data: {
          datasets: [{
            data: data,
            borderColor: props.type === 'liquidity' ? '#3182CE' : '#805AD5',
            backgroundColor: props.type === 'liquidity' ? '#3182CE33' : '#805AD533',
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            intersect: false,
            mode: 'nearest'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          },
          scales: {
            x: {
              type: 'time',
              display: false,
              adapters: {
                date: {
                  locale: enUS
                }
              }
            },
            y: {
              display: false,
              min: Math.min(...data.map(d => d.y)) * 0.95,
              max: Math.max(...data.map(d => d.y)) * 1.05
            }
          }
        }
      });
    } catch (err) {
      console.error('[MiniChart] Error creating chart:', err);
    }
  };

  onMount(() => {
    createOrUpdateChart();
    
    const observer = new ResizeObserver(() => {
      if (chart) {
        chart.resize();
      }
    });

    if (chartContainer) {
      observer.observe(chartContainer);
    }

    onCleanup(() => {
      observer.disconnect();
      if (chart) {
        chart.destroy();
      }
    });
  });

  return (
    <div 
      ref={chartContainer}
      class={`w-full h-[40px] rd-sm overflow-hidden relative ${props.class || ''}`}
    >
      <canvas style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;" />
      <div 
        class={`absolute inset-0 opacity-20 ${
          trendInfo().trendDirection === 'up' ? 'bg-gradient-to-t from-green-500/0 to-green-500' :
          trendInfo().trendDirection === 'down' ? 'bg-gradient-to-t from-red-500/0 to-red-500' :
          'bg-gradient-to-t from-gray-500/0 to-gray-500'
        }`}
      />
    </div>
  );
}; 
