/**
 * Model color palette and display name utilities.
 */

export const MODEL_COLORS = {
  base_qwen: '#0969da',
  medgemma: '#cf222e',
  zc_only: '#1a7f37',
  rology_only: '#8250df',
  zc_rology: '#bf5700',
};

export const MODEL_COLORS_ALPHA = {
  base_qwen: 'rgba(9, 105, 218, 0.2)',
  medgemma: 'rgba(207, 34, 46, 0.2)',
  zc_only: 'rgba(26, 127, 55, 0.2)',
  rology_only: 'rgba(130, 80, 223, 0.2)',
  zc_rology: 'rgba(191, 87, 0, 0.2)',
};

/** Chart.js theme constants for light mode. */
export const CHART_THEME = {
  tickColor: '#57606a',
  gridColor: '#d8dee4',
  titleColor: '#1f2328',
  legendColor: '#57606a',
  errorBarColor: '#1f2328',
  medianColor: '#1f2328',
  meanDotColor: '#1f2328',
  quadrantLineColor: '#d0d7de',
  quadrantLabelColor: '#8b949e88',
  axisTitleColor: '#1a7f37',
};

export const MODEL_NAMES = {
  base_qwen: 'Base Qwen',
  medgemma: 'MedGemma',
  zc_only: 'ZC Only',
  rology_only: 'Rology Only',
  zc_rology: 'ZC + Rology',
};

export const MODEL_KEYS = ['base_qwen', 'medgemma', 'zc_only', 'rology_only', 'zc_rology'];

export const METRIC_NAMES = {
  bleu: 'BLEU',
  rouge1: 'ROUGE-1',
  rouge2: 'ROUGE-2',
  rougeL: 'ROUGE-L',
  bertscore: 'BERTScore',
  radeval_bertscore: 'RadEval BERT',
  ratescore: 'RATEScore',
  temporal_f1: 'Temporal F1',
  green: 'GREEN',
};

export const RADEVAL_METRICS = ['bleu', 'rouge1', 'rouge2', 'rougeL', 'bertscore', 'radeval_bertscore', 'ratescore', 'temporal_f1'];

export const GREEN_ERROR_LABELS = {
  a: '(a) False Report',
  b: '(b) Missing Finding',
  c: '(c) Wrong Location',
  d: '(d) Severity Error',
  e: '(e) False Comparison',
  f: '(f) Omitted Comparison',
};

export const GREEN_ERROR_KEYS = [
  '(a) False report of a finding in the candidate',
  '(b) Missing a finding present in the reference',
  "(c) Misidentification of a finding's anatomic location/position",
  '(d) Misassessment of the severity of a finding',
  "(e) Mentioning a comparison that isn't in the reference",
  '(f) Omitting a comparison detailing a change from a prior study',
];

export const GREEN_ERROR_SHORT = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)'];

/**
 * Returns a CSS color interpolated between red -> orange -> green based on score [0, 1].
 *
 * @param {number} score - Value between 0 and 1.
 * @returns {string} CSS color string.
 */
export function scoreColor(score) {
  if (score <= 0.33) {
    return '#cf222e';
  }
  if (score <= 0.66) {
    return '#bf5700';
  }
  return '#1a7f37';
}
