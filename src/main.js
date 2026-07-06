/**
 * Main entry point -- Initializes the dashboard, loads data, and wires
 * all UI controls to their respective chart/component modules.
 */
import './index.css';
import { loadRegionData, groupByModel, mergeGreenScores } from './data-loader.js';
import { getState, setState, subscribe } from './state.js';
import { renderComparison, destroyComparison } from './charts/model-comparison.js';
import { renderDistribution, destroyDistribution } from './charts/score-distribution.js';
import { renderGreenBreakdown, destroyGreenBreakdown } from './charts/green-breakdown.js';
import { renderScatter, destroyScatter } from './charts/scatter-plot.js';
import { renderRanking } from './charts/sample-ranking.js';
import { renderRadar, destroyRadar } from './charts/radar-chart.js';
import { initInspector, openInspector } from './components/sample-inspector.js';

// ---------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------
const canvas = document.getElementById('main-chart');
const chartContainer = document.getElementById('chart-container');
const tableContainer = document.getElementById('table-container');
const loadingOverlay = document.getElementById('loading-overlay');
const sampleCount = document.getElementById('sample-count');
const regionBtns = document.querySelectorAll('#region-toggle .toggle-btn');
const toggleContainer = document.getElementById('region-toggle');
const tabBtns = document.querySelectorAll('#chart-tabs .tab-btn');

// Standard controls
const modelSelect = document.getElementById('model-select');
const metricSelect = document.getElementById('metric-select');
const sortSelect = document.getElementById('sort-select');
const topnSelect = document.getElementById('topn-select');
const sortControl = document.getElementById('sort-control');
const topNControl = document.getElementById('top-n-control');

// Control groups that wrap model and metric selects
const modelControl = modelSelect.closest('.control-group');
const metricControl = metricSelect.closest('.control-group');

// Scatter-specific controls
const scatterXSelect = document.getElementById('scatter-x-select');
const scatterYSelect = document.getElementById('scatter-y-select');
const scatterFilterSelect = document.getElementById('scatter-filter-select');
const scatterSortMetric = document.getElementById('scatter-sort-metric');
const scatterXControl = document.getElementById('scatter-x-control');
const scatterYControl = document.getElementById('scatter-y-control');
const scatterFilterControl = document.getElementById('scatter-filter-control');
const scatterSortMetricControl = document.getElementById('scatter-sort-metric-control');

// ---------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------
async function init() {
  initInspector();
  bindControls();
  subscribe(onStateChange);
  await loadData('spine');
  loadingOverlay.classList.add('hidden');
}

// ---------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------
async function loadData(region) {
  const { radeval, greenSummary } = await loadRegionData(region);
  mergeGreenScores(radeval, greenSummary);
  const grouped = groupByModel(radeval);

  const uniqueIds = new Set(radeval.map((r) => r.id));
  sampleCount.textContent = `${uniqueIds.size} samples`;

  setState({ region, data: { radeval, greenSummary }, grouped });
}

// ---------------------------------------------------------------
// Control Binding
// ---------------------------------------------------------------
function bindControls() {
  // Region toggle
  for (const btn of regionBtns) {
    btn.addEventListener('click', async () => {
      const region = btn.dataset.region;
      if (region === getState().region) return;

      regionBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      toggleContainer.dataset.active = region;

      loadingOverlay.classList.remove('hidden');
      destroyAllCharts();
      await loadData(region);
      loadingOverlay.classList.add('hidden');
    });
  }

  // Tab switching
  for (const btn of tabBtns) {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === getState().tab) return;
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      destroyAllCharts();
      setState({ tab });
    });
  }

  // Model selector
  modelSelect.addEventListener('change', () => {
    destroyAllCharts();
    setState({ model: modelSelect.value });
  });

  // Metric selector
  metricSelect.addEventListener('change', () => {
    destroyAllCharts();
    setState({ metric: metricSelect.value });
  });

  // Sort selector
  sortSelect.addEventListener('change', () => {
    setState({ sort: sortSelect.value });
  });

  // TopN selector
  topnSelect.addEventListener('change', () => {
    setState({ topN: topnSelect.value });
  });

  // Scatter controls -- all trigger a re-render
  const scatterRerender = () => {
    destroyScatter();
    renderActiveTab(getState().tab);
  };
  scatterXSelect.addEventListener('change', scatterRerender);
  scatterYSelect.addEventListener('change', scatterRerender);
  scatterFilterSelect.addEventListener('change', () => {
    // Show/hide the "Rank By" selector based on filter
    const showRankBy = scatterFilterSelect.value !== 'all';
    scatterSortMetricControl.style.display = showRankBy ? 'flex' : 'none';
    scatterRerender();
  });
  scatterSortMetric.addEventListener('change', scatterRerender);
}

// ---------------------------------------------------------------
// Control Visibility per Tab
// ---------------------------------------------------------------

/**
 * Shows/hides control groups based on the active tab.
 * - GREEN tab: hides model and metric selectors (not applicable)
 * - Scatter tab: shows scatter-specific axis/filter controls, hides model metric
 * - Ranking tab: shows sort and topN controls
 *
 * @param {string} tab - The active tab key.
 */
function updateControlVisibility(tab) {
  // Standard controls default visibility
  const showModel = tab !== 'green' && tab !== 'distribution';
  const showMetric = tab !== 'green' && tab !== 'scatter' && tab !== 'radar' && tab !== 'distribution';

  modelControl.style.display = showModel ? 'flex' : 'none';
  metricControl.style.display = showMetric ? 'flex' : 'none';

  // Ranking-specific controls
  const isRanking = tab === 'ranking';
  sortControl.style.display = isRanking ? 'flex' : 'none';
  topNControl.style.display = isRanking ? 'flex' : 'none';

  // Scatter-specific controls
  const isScatter = tab === 'scatter';
  scatterXControl.style.display = isScatter ? 'flex' : 'none';
  scatterYControl.style.display = isScatter ? 'flex' : 'none';
  scatterFilterControl.style.display = isScatter ? 'flex' : 'none';
  // Only show "Rank By" if a filter is active
  const showRankBy = isScatter && scatterFilterSelect.value !== 'all';
  scatterSortMetricControl.style.display = showRankBy ? 'flex' : 'none';
}

// ---------------------------------------------------------------
// State Change Handler
// ---------------------------------------------------------------
function onStateChange(state) {
  const { tab } = state;

  updateControlVisibility(tab);

  // Show canvas or table
  if (tab === 'ranking') {
    chartContainer.style.display = 'none';
    tableContainer.style.display = 'block';
  } else {
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
  }

  renderActiveTab(tab);
}

// ---------------------------------------------------------------
// Render Dispatcher
// ---------------------------------------------------------------
function renderActiveTab(tab) {
  switch (tab) {
    case 'comparison':
      renderComparison(canvas);
      break;
    case 'distribution':
      renderDistribution(canvas);
      break;
    case 'green':
      renderGreenBreakdown(canvas);
      break;
    case 'scatter':
      renderScatter(canvas, onClickSample, {
        xMetric: scatterXSelect.value,
        yMetric: scatterYSelect.value,
        filter: scatterFilterSelect.value,
        rankMetric: scatterSortMetric.value,
      });
      break;
    case 'ranking':
      renderRanking(tableContainer, onClickSample);
      break;
    case 'radar':
      renderRadar(canvas);
      break;
  }
}

/**
 * Handles click on a data point or table row to open the sample inspector.
 * Scatter sends an array of IDs (overlapping points), ranking sends a single ID.
 *
 * @param {string|string[]} sampleIds - One or more sample IDs.
 * @param {string} model - The model key.
 */
function onClickSample(sampleIds, model) {
  openInspector(sampleIds, model);
}

// ---------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------
function destroyAllCharts() {
  destroyComparison();
  destroyDistribution();
  destroyGreenBreakdown();
  destroyScatter();
  destroyRadar();
}

// ---------------------------------------------------------------
// Start
// ---------------------------------------------------------------
init();
