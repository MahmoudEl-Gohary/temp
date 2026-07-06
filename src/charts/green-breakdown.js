/**
 * GREEN Error Breakdown -- Stacked horizontal bar chart showing error category totals per model.
 */
import { Chart } from 'chart.js/auto';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, GREEN_ERROR_KEYS, GREEN_ERROR_SHORT, CHART_THEME } from '../utils/colors.js';
import { loadGreenDetail, aggregateGreenErrors } from '../data-loader.js';

let chart = null;
/** Cache of aggregated errors per region */
const errorCache = {};

const ERROR_COLORS = [
  '#cf222e', // (a) False report
  '#bf5700', // (b) Missing finding
  '#9a6700', // (c) Wrong location
  '#bf3989', // (d) Severity error
  '#8250df', // (e) False comparison
  '#0969da', // (f) Omitted comparison
];

const MATCHED_COLOR = '#1a7f37';

/**
 * Loads and caches GREEN error aggregates for all models in the current region.
 *
 * @param {string} region - "spine" or "knee".
 * @returns {Promise<Object<string, { totals: Object, matched: number, count: number }>>}
 */
async function loadAllErrors(region) {
  const cacheKey = region;
  if (errorCache[cacheKey]) return errorCache[cacheKey];

  const results = {};
  await Promise.all(
    MODEL_KEYS.map(async (model) => {
      const detail = await loadGreenDetail(region, model);
      results[model] = aggregateGreenErrors(detail);
    })
  );
  errorCache[cacheKey] = results;
  return results;
}

/**
 * Renders the GREEN error breakdown chart.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas.
 */
export async function renderGreenBreakdown(canvas) {
  const { region } = getState();

  const allErrors = await loadAllErrors(region);
  const labels = MODEL_KEYS.map((k) => MODEL_NAMES[k]);

  const datasets = GREEN_ERROR_KEYS.map((key, i) => ({
    label: GREEN_ERROR_SHORT[i],
    data: MODEL_KEYS.map((m) => {
      const agg = allErrors[m];
      return agg.count > 0 ? agg.totals[key] / agg.count : 0;
    }),
    backgroundColor: ERROR_COLORS[i] + 'cc',
    borderColor: ERROR_COLORS[i],
    borderWidth: 1,
  }));

  datasets.push({
    label: 'Matched',
    data: MODEL_KEYS.map((m) => {
      const agg = allErrors[m];
      return agg.count > 0 ? agg.matched / agg.count : 0;
    }),
    backgroundColor: MATCHED_COLOR + 'cc',
    borderColor: MATCHED_COLOR,
    borderWidth: 1,
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
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Mean GREEN Error Categories per Sample',
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
            pointStyleWidth: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x.toFixed(3)} per sample`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: CHART_THEME.tickColor },
          grid: { color: CHART_THEME.gridColor },
          title: {
            display: true,
            text: 'Mean Count per Sample',
            color: CHART_THEME.tickColor,
          },
        },
        y: {
          stacked: true,
          ticks: { color: CHART_THEME.tickColor, font: { weight: 600 } },
          grid: { display: false },
        },
      },
    },
  });
}

/**
 * Destroys the chart instance.
 */
export function destroyGreenBreakdown() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
