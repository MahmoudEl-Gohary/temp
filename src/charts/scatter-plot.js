/**
 * Scatter Plot -- Configurable X/Y metric axes with sample filtering.
 * Groups overlapping points (same x,y) and shows count in tooltip.
 * On click, passes all sample IDs at that coordinate to the inspector.
 */
import { Chart } from 'chart.js/auto';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, MODEL_COLORS, METRIC_NAMES, CHART_THEME } from '../utils/colors.js';
import { linearRegression } from '../utils/stats.js';

let chart = null;

/**
 * Filters and ranks samples based on scatter filter settings.
 *
 * @param {Object[]} samples - All samples for one model.
 * @param {string} filterMode - "all", "worst50", "worst100", "best50", "best100".
 * @param {string} rankMetric - Metric key to rank by.
 * @returns {Set<string>|null} Set of sample IDs to include, or null for all.
 */
function getFilteredIds(samples, filterMode, rankMetric) {
  if (filterMode === 'all') return null;

  const valid = samples
    .filter((r) => r[rankMetric] != null && !isNaN(r[rankMetric]))
    .sort((a, b) => a[rankMetric] - b[rankMetric]);

  let count = 50;
  let fromWorst = true;
  if (filterMode === 'worst50') { count = 50; fromWorst = true; }
  else if (filterMode === 'worst100') { count = 100; fromWorst = true; }
  else if (filterMode === 'best50') { count = 50; fromWorst = false; }
  else if (filterMode === 'best100') { count = 100; fromWorst = false; }

  const slice = fromWorst ? valid.slice(0, count) : valid.slice(-count);
  return new Set(slice.map((r) => r.id));
}

/**
 * Groups points with identical (x, y) coordinates.
 * Returns an array of grouped point objects, each containing all sample IDs.
 *
 * @param {Object[]} rawPoints - Array of { x, y, id, model }.
 * @returns {Object[]} Array of { x, y, ids: string[], model, count }.
 */
function groupOverlappingPoints(rawPoints) {
  const map = new Map();
  for (const pt of rawPoints) {
    // Use a precision key to group very close values
    const key = `${pt.x.toFixed(6)}_${pt.y.toFixed(6)}`;
    if (!map.has(key)) {
      map.set(key, { x: pt.x, y: pt.y, ids: [], model: pt.model });
    }
    map.get(key).ids.push(pt.id);
  }
  const result = [];
  for (const group of map.values()) {
    group.count = group.ids.length;
    result.push(group);
  }
  return result;
}

/**
 * Renders the scatter plot with configurable axes, sample filter, and grouped overlapping points.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas.
 * @param {Function} onClickPoint - Callback: (sampleIds[], model).
 * @param {{ xMetric: string, yMetric: string, filter: string, rankMetric: string }} scatterConfig
 */
export function renderScatter(canvas, onClickPoint, scatterConfig = {}) {
  const { grouped, model } = getState();
  if (!grouped) return;

  const xMetric = scatterConfig.xMetric || 'rougeL';
  const yMetric = scatterConfig.yMetric || 'green';
  const filterMode = scatterConfig.filter || 'all';
  const rankMetric = scatterConfig.rankMetric || 'green';

  const xLabel = METRIC_NAMES[xMetric] || xMetric;
  const yLabel = METRIC_NAMES[yMetric] || yMetric;

  const modelsToShow = model === 'all' ? MODEL_KEYS : [model];
  const datasets = [];

  for (const key of modelsToShow) {
    const allSamples = grouped[key] || [];
    const allowedIds = getFilteredIds(allSamples, filterMode, rankMetric);

    const rawPoints = allSamples
      .filter((r) => {
        if (r[xMetric] == null || r[yMetric] == null || isNaN(r[xMetric]) || isNaN(r[yMetric])) return false;
        if (allowedIds && !allowedIds.has(r.id)) return false;
        return true;
      })
      .map((r) => ({ x: r[xMetric], y: r[yMetric], id: r.id, model: key }));

    const groupedPoints = groupOverlappingPoints(rawPoints);

    // Scale point radius based on count for visual feedback
    const pointRadii = groupedPoints.map((p) => Math.min(3.5 + (p.count - 1) * 1.5, 12));

    datasets.push({
      label: MODEL_NAMES[key],
      data: groupedPoints,
      backgroundColor: MODEL_COLORS[key] + '88',
      borderColor: MODEL_COLORS[key],
      pointRadius: pointRadii,
      pointHoverRadius: pointRadii.map((r) => r + 2),
      showLine: false,
    });

    // Regression line (use raw ungrouped points for accurate regression)
    if (rawPoints.length > 2) {
      const xs = rawPoints.map((p) => p.x);
      const ys = rawPoints.map((p) => p.y);
      const reg = linearRegression(xs, ys);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      datasets.push({
        label: `${MODEL_NAMES[key]} trend (R\u00B2=${reg.r2.toFixed(3)})`,
        data: [
          { x: xMin, y: reg.slope * xMin + reg.intercept },
          { x: xMax, y: reg.slope * xMax + reg.intercept },
        ],
        borderColor: MODEL_COLORS[key],
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        showLine: true,
        fill: false,
        type: 'line',
      });
    }
  }

  // Build title including filter info
  let titleText = `${xLabel} vs ${yLabel}`;
  if (filterMode !== 'all') {
    const rankLabel = METRIC_NAMES[rankMetric] || rankMetric;
    titleText += ` (${filterMode.replace(/(\d+)/, ' $1')} by ${rankLabel})`;
  }

  if (chart) {
    chart.data.datasets = datasets;
    chart.options.plugins.title.text = titleText;
    chart.options.scales.x.title.text = `${xLabel} \u2192`;
    chart.options.scales.y.title.text = `${yLabel} \u2191`;
    chart.update('none');
    return;
  }

  chart = new Chart(canvas, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: titleText,
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
            filter: (item) => !item.text.includes('trend'),
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const pt = items[0]?.raw;
              if (!pt?.ids) return '';
              if (pt.count > 1) {
                return `${pt.count} samples at this point`;
              }
              return `Sample: ${pt.ids[0].slice(0, 16)}...`;
            },
            label: (ctx) => {
              const pt = ctx.raw;
              if (!pt.ids) return '';
              const lines = [`${xLabel}: ${pt.x.toFixed(3)} | ${yLabel}: ${pt.y.toFixed(3)}`];
              if (pt.count > 1) {
                lines.push(`Click to browse all ${pt.count} samples`);
              }
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 1,
          title: {
            display: true,
            text: `${xLabel} \u2192`,
            color: CHART_THEME.axisTitleColor,
            font: { size: 12, weight: 600 },
          },
          ticks: { color: CHART_THEME.tickColor },
          grid: { color: CHART_THEME.gridColor },
        },
        y: {
          min: 0,
          max: 1.05,
          title: {
            display: true,
            text: `${yLabel} \u2191`,
            color: CHART_THEME.axisTitleColor,
            font: { size: 12, weight: 600 },
          },
          ticks: { color: CHART_THEME.tickColor },
          grid: { color: CHART_THEME.gridColor },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0 && onClickPoint) {
          const el = elements[0];
          const pt = chart.data.datasets[el.datasetIndex].data[el.index];
          if (pt?.ids) {
            onClickPoint(pt.ids, pt.model);
          }
        }
      },
    },
    plugins: [{
      id: 'quadrantLines',
      beforeDraw(chartInstance) {
        const { ctx, chartArea, scales } = chartInstance;
        const xMid = scales.x.getPixelForValue(0.5);
        const yMid = scales.y.getPixelForValue(0.5);

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = CHART_THEME.quadrantLineColor;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(xMid, chartArea.top);
        ctx.lineTo(xMid, chartArea.bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(chartArea.left, yMid);
        ctx.lineTo(chartArea.right, yMid);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = CHART_THEME.quadrantLabelColor;

        const padX = 8;
        const padY = 14;
        ctx.textAlign = 'left';
        ctx.fillText('Low Both', chartArea.left + padX, chartArea.bottom - padX);
        ctx.textAlign = 'right';
        ctx.fillText('High Both', chartArea.right - padX, chartArea.top + padY);

        ctx.restore();
      },
    }],
  });
}

/**
 * Destroys the chart instance.
 */
export function destroyScatter() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
