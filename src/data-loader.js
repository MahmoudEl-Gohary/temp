/**
 * CSV data loading, parsing, and caching layer.
 * Eagerly loads radeval + green summary. Lazily loads reports + green details.
 */
import Papa from 'papaparse';
import { MODEL_KEYS, GREEN_ERROR_KEYS } from './utils/colors.js';

/** In-memory cache keyed by file path. */
const cache = {};

/**
 * Fetches and parses a CSV file, caching the result.
 *
 * @param {string} path - URL path to the CSV file (relative to public root).
 * @returns {Promise<Object[]>} Array of row objects.
 */
async function loadCSV(path) {
  if (cache[path]) return cache[path];
  const response = await fetch(path);
  const text = await response.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  cache[path] = data;
  return data;
}

/**
 * Loads the primary evaluation data for a region.
 * Returns { radeval, greenSummary } -- the two "eager" datasets.
 *
 * @param {string} region - "spine" or "knee".
 * @returns {Promise<{ radeval: Object[], greenSummary: Object[] }>}
 */
export async function loadRegionData(region) {
  const [radeval, greenSummary] = await Promise.all([
    loadCSV(`/${region}/radeval_detailed_long.csv`),
    loadCSV(`/${region}/green/green_scores_summary.csv`),
  ]);
  return { radeval, greenSummary };
}

/**
 * Loads reports for a region (lazy, called on first inspector open).
 *
 * @param {string} region - "spine" or "knee".
 * @returns {Promise<Object[]>} Report rows with id, ground_report, and model columns.
 */
export async function loadReports(region) {
  return loadCSV(`/${region}/reports/data.csv`);
}

/**
 * Loads GREEN detail data for a specific model in a region (lazy).
 *
 * @param {string} region - "spine" or "knee".
 * @param {string} model - Model key, e.g. "base_qwen".
 * @returns {Promise<Object[]>} Detailed GREEN analysis rows.
 */
export async function loadGreenDetail(region, model) {
  return loadCSV(`/${region}/green/green_detail_${model}.csv`);
}

// ---------------------------------------------------------------------------
// Data Transformation Helpers
// ---------------------------------------------------------------------------

/**
 * Groups radeval rows by model. Each model key maps to an array of sample objects.
 *
 * @param {Object[]} radeval - Raw radeval rows.
 * @returns {Object<string, Object[]>} Grouped data.
 */
export function groupByModel(radeval) {
  const grouped = {};
  for (const key of MODEL_KEYS) {
    grouped[key] = [];
  }
  for (const row of radeval) {
    if (grouped[row.model]) {
      grouped[row.model].push(row);
    }
  }
  return grouped;
}

/**
 * Merges GREEN summary scores into the radeval data by sample ID.
 * Adds a `green` field to each radeval row.
 *
 * @param {Object[]} radeval - Radeval rows (mutated in place).
 * @param {Object[]} greenSummary - GREEN summary rows.
 */
export function mergeGreenScores(radeval, greenSummary) {
  const greenMap = new Map();
  for (const row of greenSummary) {
    greenMap.set(row.id, row);
  }
  for (const row of radeval) {
    const greenRow = greenMap.get(row.id);
    if (greenRow) {
      const col = `${row.model}_green`;
      row.green = greenRow[col] ?? null;
    }
  }
}

/**
 * Aggregates GREEN error category totals per model from detail files.
 *
 * @param {Object[]} detailRows - Green detail rows for one model.
 * @returns {{ totals: Object<string, number>, matched: number, count: number }}
 */
export function aggregateGreenErrors(detailRows) {
  const totals = {};
  for (const key of GREEN_ERROR_KEYS) {
    totals[key] = 0;
  }
  let matched = 0;
  let count = 0;
  for (const row of detailRows) {
    count++;
    for (const key of GREEN_ERROR_KEYS) {
      const val = Number(row[key]) || 0;
      totals[key] += val;
    }
    matched += Number(row['Matched Findings']) || 0;
  }
  return { totals, matched, count };
}
