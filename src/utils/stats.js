/**
 * Statistical helper functions for computing summary metrics.
 */

/**
 * Computes the arithmetic mean of an array of numbers.
 *
 * @param {number[]} arr - Input values.
 * @returns {number} Mean value, or 0 if empty.
 */
export function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Computes the standard deviation of an array.
 *
 * @param {number[]} arr - Input values.
 * @returns {number} Standard deviation, or 0 if empty.
 */
export function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Returns the value at the given percentile (0-100) using linear interpolation.
 *
 * @param {number[]} sortedArr - Pre-sorted array of numbers (ascending).
 * @param {number} p - Percentile in [0, 100].
 * @returns {number} The interpolated percentile value.
 */
export function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  if (sortedArr.length === 1) return sortedArr[0];
  const idx = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
}

/**
 * Computes box plot statistics for an array.
 *
 * @param {number[]} arr - Input values.
 * @returns {{ min: number, q1: number, median: number, q3: number, max: number, mean: number, outliers: number[] }}
 */
export function boxStats(arr) {
  if (!arr.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, outliers: [] };
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const median = percentile(sorted, 50);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  const whiskerLow = sorted.find((v) => v >= lowerFence) ?? sorted[0];
  const whiskerHigh = [...sorted].reverse().find((v) => v <= upperFence) ?? sorted[sorted.length - 1];
  return {
    min: whiskerLow,
    q1,
    median,
    q3,
    max: whiskerHigh,
    mean: mean(arr),
    outliers,
  };
}

/**
 * Computes simple linear regression (y = slope*x + intercept) for paired arrays.
 *
 * @param {number[]} xs - X values.
 * @param {number[]} ys - Y values.
 * @returns {{ slope: number, intercept: number, r2: number }}
 */
export function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const ssRes = xs.reduce((sum, x, i) => {
    const pred = slope * x + intercept;
    return sum + (ys[i] - pred) ** 2;
  }, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}
