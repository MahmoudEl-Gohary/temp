/**
 * Model Comparison Chart -- Grouped bar chart showing mean scores per model.
 */
import { Chart } from 'chart.js/auto';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, MODEL_COLORS, METRIC_NAMES, CHART_THEME } from '../utils/colors.js';
import { mean, std } from '../utils/stats.js';

let chart = null;

/**
 * Renders or updates the model comparison grouped bar chart.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element.
 */
export function renderComparison(canvas) {
  const { grouped, metric } = getState();
  if (!grouped) return;

  const means = [];
  const stds = [];
  const colors = [];

  for (const key of MODEL_KEYS) {
    const values = grouped[key]
      .map((r) => r[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    means.push(mean(values));
    stds.push(std(values));
    colors.push(MODEL_COLORS[key]);
  }

  const labels = MODEL_KEYS.map((k) => MODEL_NAMES[k]);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = means;
    chart.data.datasets[0].backgroundColor = colors.map((c) => c + '44');
    chart.data.datasets[0].borderColor = colors;
    chart.data.datasets[0].errorBars = stds;
    chart.options.plugins.title.text = `Mean ${METRIC_NAMES[metric] || metric} by Model`;
    chart.update('none');
    return;
  }

  chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: METRIC_NAMES[metric] || metric,
        data: means,
        backgroundColor: colors.map((c) => c + '44'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        errorBars: stds,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Mean ${METRIC_NAMES[metric] || metric} by Model`,
          color: CHART_THEME.titleColor,
          font: { size: 14, weight: 600 },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const s = stds[ctx.dataIndex];
              return `${ctx.parsed.y.toFixed(4)} (std: ${s.toFixed(4)})`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: CHART_THEME.tickColor, font: { weight: 600 } },
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
    plugins: [{
      id: 'errorBars',
      afterDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        const errs = chart.data.datasets[0].errorBars;
        if (!errs) return;
        ctx.save();
        ctx.strokeStyle = CHART_THEME.errorBarColor;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < meta.data.length; i++) {
          const bar = meta.data[i];
          const yCenter = bar.y;
          const errPx = chart.scales.y.getPixelForValue(means[i] - errs[i]) - chart.scales.y.getPixelForValue(means[i]);
          ctx.beginPath();
          ctx.moveTo(bar.x, yCenter - Math.abs(errPx));
          ctx.lineTo(bar.x, yCenter + Math.abs(errPx));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(bar.x - 6, yCenter - Math.abs(errPx));
          ctx.lineTo(bar.x + 6, yCenter - Math.abs(errPx));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(bar.x - 6, yCenter + Math.abs(errPx));
          ctx.lineTo(bar.x + 6, yCenter + Math.abs(errPx));
          ctx.stroke();
        }
        ctx.restore();
      },
    }],
  });
}

/**
 * Destroys the chart instance to free resources.
 */
export function destroyComparison() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
