/**
 * Radar Chart -- Multi-metric model profile comparison.
 */
import { Chart } from 'chart.js/auto';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, MODEL_COLORS, MODEL_COLORS_ALPHA, RADEVAL_METRICS, METRIC_NAMES, CHART_THEME } from '../utils/colors.js';
import { mean } from '../utils/stats.js';

let chart = null;

/**
 * Renders a radar chart overlaying all (or selected) models.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas.
 */
export function renderRadar(canvas) {
  const { grouped, model } = getState();
  if (!grouped) return;

  const metricsForRadar = [...RADEVAL_METRICS, 'green'];
  const labels = metricsForRadar.map((m) => METRIC_NAMES[m] || m);
  const modelsToShow = model === 'all' ? MODEL_KEYS : [model];

  const datasets = modelsToShow.map((key) => {
    const samples = grouped[key];
    const values = metricsForRadar.map((m) => {
      const vals = samples
        .map((r) => r[m])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      return mean(vals);
    });
    return {
      label: MODEL_NAMES[key],
      data: values,
      backgroundColor: MODEL_COLORS_ALPHA[key],
      borderColor: MODEL_COLORS[key],
      borderWidth: 2,
      pointBackgroundColor: MODEL_COLORS[key],
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('none');
    return;
  }

  chart = new Chart(canvas, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Multi-Metric Model Profile',
          color: CHART_THEME.titleColor,
          font: { size: 14, weight: 600 },
          padding: { bottom: 16 },
        },
        legend: {
          position: 'bottom',
          labels: {
            color: CHART_THEME.legendColor,
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.r.toFixed(4)}`,
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 1,
          ticks: {
            color: CHART_THEME.tickColor,
            backdropColor: 'transparent',
            stepSize: 0.2,
          },
          grid: {
            color: CHART_THEME.gridColor,
          },
          angleLines: {
            color: CHART_THEME.gridColor,
          },
          pointLabels: {
            color: CHART_THEME.tickColor,
            font: { size: 11, weight: 600 },
          },
        },
      },
    },
  });
}

/**
 * Destroys the chart instance.
 */
export function destroyRadar() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
