/**
 * Sample Inspector Modal -- Full diagnostic view for a single sample.
 * Supports navigating between multiple samples (e.g., overlapping scatter points)
 * with prev/next arrows, and switching models within the modal.
 */
import { loadReports, loadGreenDetail } from '../data-loader.js';
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, METRIC_NAMES, RADEVAL_METRICS, GREEN_ERROR_KEYS, GREEN_ERROR_SHORT, scoreColor } from '../utils/colors.js';
import { diffGroundTruth, diffPrediction } from './diff-highlighter.js';

const modal = () => document.getElementById('sample-inspector');
const closeBtn = () => document.getElementById('modal-close');
const modelSelect = () => document.getElementById('inspector-model-select');
const idSpan = () => document.getElementById('inspector-id');
const groundDiv = () => document.getElementById('ground-text');
const predDiv = () => document.getElementById('prediction-text');
const scoreBar = () => document.getElementById('inspector-scores');
const badgesDiv = () => document.getElementById('green-error-badges');
const analysisDiv = () => document.getElementById('green-analysis-text');
const navContainer = () => document.getElementById('inspector-nav');
const navLabel = () => document.getElementById('inspector-nav-label');
const prevBtn = () => document.getElementById('inspector-prev');
const nextBtn = () => document.getElementById('inspector-next');

/** @type {string[]} List of sample IDs to navigate through. */
let sampleIds = [];
/** @type {number} Current index within sampleIds. */
let currentIndex = 0;
/** @type {string|null} Current model key. */
let currentModel = null;

/**
 * Opens the sample inspector for one or more samples.
 * Accepts either a single ID string or an array of IDs.
 *
 * @param {string|string[]} ids - Sample ID(s).
 * @param {string} model - The model key.
 */
export async function openInspector(ids, model) {
  sampleIds = Array.isArray(ids) ? ids : [ids];
  currentIndex = 0;
  currentModel = model;

  modal().style.display = 'flex';
  modelSelect().value = model;
  document.body.style.overflow = 'hidden';

  updateNavUI();
  await renderInspectorContent();
}

/**
 * Closes the inspector modal.
 */
export function closeInspector() {
  modal().style.display = 'none';
  document.body.style.overflow = '';
  sampleIds = [];
  currentIndex = 0;
  currentModel = null;
}

/**
 * Initializes modal event listeners.
 */
export function initInspector() {
  closeBtn().addEventListener('click', closeInspector);
  modal().addEventListener('click', (e) => {
    if (e.target === modal()) closeInspector();
  });
  modelSelect().addEventListener('change', async (e) => {
    currentModel = e.target.value;
    await renderInspectorContent();
  });

  // Navigation buttons
  prevBtn().addEventListener('click', async () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateNavUI();
      await renderInspectorContent();
    }
  });
  nextBtn().addEventListener('click', async () => {
    if (currentIndex < sampleIds.length - 1) {
      currentIndex++;
      updateNavUI();
      await renderInspectorContent();
    }
  });

  document.addEventListener('keydown', async (e) => {
    if (modal().style.display === 'none') return;
    if (e.key === 'Escape') {
      closeInspector();
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      currentIndex--;
      updateNavUI();
      await renderInspectorContent();
    } else if (e.key === 'ArrowRight' && currentIndex < sampleIds.length - 1) {
      currentIndex++;
      updateNavUI();
      await renderInspectorContent();
    }
  });
}

/**
 * Updates the navigation UI (prev/next arrows and counter label).
 */
function updateNavUI() {
  const total = sampleIds.length;
  const hasMultiple = total > 1;

  navContainer().style.display = hasMultiple ? 'flex' : 'none';

  if (hasMultiple) {
    navLabel().textContent = `${currentIndex + 1} of ${total}`;
    prevBtn().disabled = currentIndex === 0;
    nextBtn().disabled = currentIndex === total - 1;
  }

  // Update the displayed sample ID
  const currentId = sampleIds[currentIndex];
  idSpan().textContent = currentId || '';
}

/**
 * Renders the inspector content for the current sample + model.
 */
async function renderInspectorContent() {
  const currentSampleId = sampleIds[currentIndex];
  if (!currentSampleId || !currentModel) return;

  const { region, grouped } = getState();

  // Show loading state
  groundDiv().innerHTML = '<p style="color:#6e7681">Loading...</p>';
  predDiv().innerHTML = '<p style="color:#6e7681">Loading...</p>';
  analysisDiv().innerHTML = '';
  badgesDiv().innerHTML = '';
  scoreBar().innerHTML = '';

  // Load reports
  const reports = await loadReports(region);
  const reportRow = reports.find((r) => r.id === currentSampleId);

  // Load GREEN detail
  const greenDetail = await loadGreenDetail(region, currentModel);
  const greenRow = greenDetail.find((r) => r.id === currentSampleId);

  // Get scores from radeval
  const modelData = grouped?.[currentModel] || [];
  const scoreRow = modelData.find((r) => r.id === currentSampleId);

  // Render reports with diff
  const groundText = reportRow?.ground_report || 'Report not found.';
  const predText = reportRow?.[currentModel] || 'Report not found.';

  groundDiv().innerHTML = diffGroundTruth(groundText, predText);
  predDiv().innerHTML = diffPrediction(groundText, predText);

  // Render score bar
  if (scoreRow) {
    const metricsToShow = ['green', ...RADEVAL_METRICS];
    let chipHtml = '';
    for (const m of metricsToShow) {
      const val = scoreRow[m];
      const displayVal = val != null && !isNaN(val) ? Number(val).toFixed(3) : '---';
      const color = val != null && !isNaN(val) ? scoreColor(Number(val)) : '#6e7681';
      chipHtml += `
        <div class="score-chip">
          <span class="score-label">${METRIC_NAMES[m] || m}</span>
          <span class="score-value" style="color:${color}">${displayVal}</span>
        </div>
      `;
    }
    scoreBar().innerHTML = chipHtml;
  }

  // Render GREEN error badges
  if (greenRow) {
    let badgeHtml = '';
    for (let i = 0; i < GREEN_ERROR_KEYS.length; i++) {
      const key = GREEN_ERROR_KEYS[i];
      const val = Number(greenRow[key]) || 0;
      if (val > 0) {
        badgeHtml += `<span class="error-badge error-type">${GREEN_ERROR_SHORT[i]}: ${val}</span>`;
      }
    }
    const matched = Number(greenRow['Matched Findings']) || 0;
    if (matched > 0) {
      badgeHtml += `<span class="error-badge matched-type">Matched: ${matched}</span>`;
    }
    const greenScore = greenRow.green_score;
    if (greenScore != null) {
      const gs = Number(greenScore);
      badgeHtml += `<span class="error-badge matched-type" style="border-color:${scoreColor(gs)}; color:${scoreColor(gs)}">GREEN: ${gs.toFixed(3)}</span>`;
    }
    badgesDiv().innerHTML = badgeHtml;

    // Render GREEN analysis text
    const analysisText = greenRow.green_analysis || '';
    analysisDiv().innerHTML = `<p style="white-space:pre-wrap;">${escapeHtml(analysisText)}</p>`;
  } else {
    badgesDiv().innerHTML = '<span style="color:#6e7681;font-size:0.8rem">No GREEN analysis available for this sample.</span>';
    analysisDiv().innerHTML = '';
  }
}

/**
 * Escapes HTML special characters.
 *
 * @param {string} str - Raw string.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
