/**
 * Score Distribution Chart -- Grouped bar chart showing mean scores
 * across ALL metrics for each model, similar to a multi-metric comparison.
 *
 * X-axis: Metrics (BLEU, ROUGE-1, ..., GREEN)
 * Bars: One bar per model, grouped under each metric.
 */
import { Chart } from 'chart.js/auto';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, MODEL_COLORS, MODEL_COLORS_ALPHA, RADEVAL_METRICS, METRIC_NAMES, CHART_THEME } from '../utils/colors.js';
import { mean } from '../utils/stats.js';

let chart = null;

/**
 * Renders a grouped bar chart with all metrics on X and model bars grouped.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas.
 */
export function renderDistribution(canvas) {
  const { grouped } = getState();
  if (!grouped) return;

  // All metrics including GREEN
  const allMetrics = [...RADEVAL_METRICS, 'green'];
  const labels = allMetrics.map((m) => METRIC_NAMES[m] || m);

  // One dataset per model
  const datasets = MODEL_KEYS.map((key) => {
    const samples = grouped[key];
    const data = allMetrics.map((m) => {
      const values = samples
        .map((r) => r[m])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      return mean(values);
    });

    return {
      label: MODEL_NAMES[key],
      data,
      backgroundColor: MODEL_COLORS[key] + 'cc',
      borderColor: MODEL_COLORS[key],
      borderWidth: 1,
      borderRadius: 3,
    };
  });

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('none');
    return;
  }

  chart = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Mean Score Across All Metrics by Model',
          color: CHART_THEME.titleColor,
          font: { size: 14, weight: 600 },
          padding: { bottom: 16 },
        },
        legend: {
          position: 'top',
          labels: {
            color: CHART_THEME.legendColor,
            font: { size: 11, weight: 500 },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 14,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: CHART_THEME.tickColor,
            font: { weight: 600, size: 11 },
            maxRotation: 45,
            minRotation: 0,
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          max: 1,
          ticks: { color: CHART_THEME.tickColor },
          grid: { color: CHART_THEME.gridColor },
        },
      },
    },
  });
}

/**
 * Destroys the chart instance.
 */
export function destroyDistribution() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
