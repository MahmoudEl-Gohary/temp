/**
 * Text diff engine using diff-match-patch.
 * Produces HTML with .diff-del, .diff-add, and .diff-equal spans.
 *
 * Uses character-level diff with semantic cleanup for accurate,
 * readable highlighting of differences between reports.
 */
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();
// Allow slightly longer diffs before timing out
dmp.Diff_Timeout = 2;

/**
 * Computes a character-level diff and returns HTML for the "ground truth" side.
 * Deletions (content present in ground truth but missing from prediction)
 * are highlighted. Insertions are omitted from this view.
 *
 * @param {string} groundTruth - Reference text.
 * @param {string} prediction - Generated text.
 * @returns {string} HTML string with diff spans.
 */
export function diffGroundTruth(groundTruth, prediction) {
  const diffs = computeDiff(groundTruth, prediction);
  let html = '';
  for (const [op, text] of diffs) {
    const escaped = escapeHtml(text);
    if (op === DiffMatchPatch.DIFF_EQUAL) {
      html += `<span class="diff-equal">${escaped}</span>`;
    } else if (op === DiffMatchPatch.DIFF_DELETE) {
      html += `<span class="diff-del">${escaped}</span>`;
    }
    // op === DIFF_INSERT: skip on ground truth side
  }
  return html;
}

/**
 * Computes a character-level diff and returns HTML for the "prediction" side.
 * Insertions (content present in prediction but not in ground truth)
 * are highlighted. Deletions are omitted from this view.
 *
 * @param {string} groundTruth - Reference text.
 * @param {string} prediction - Generated text.
 * @returns {string} HTML string with diff spans.
 */
export function diffPrediction(groundTruth, prediction) {
  const diffs = computeDiff(groundTruth, prediction);
  let html = '';
  for (const [op, text] of diffs) {
    const escaped = escapeHtml(text);
    if (op === DiffMatchPatch.DIFF_EQUAL) {
      html += `<span class="diff-equal">${escaped}</span>`;
    } else if (op === DiffMatchPatch.DIFF_INSERT) {
      html += `<span class="diff-add">${escaped}</span>`;
    }
    // op === DIFF_DELETE: skip on prediction side
  }
  return html;
}

/**
 * Computes a character-level diff with word-boundary cleanup.
 * Steps:
 *   1. Run diff_main for character-level diff
 *   2. Apply diff_cleanupSemantic to align edits on word boundaries
 *   3. Apply diff_cleanupEfficiency to merge small equalities
 *
 * @param {string} text1 - Original text.
 * @param {string} text2 - Modified text.
 * @returns {Array<[number, string]>} Diff tuples.
 */
function computeDiff(text1, text2) {
  const diffs = dmp.diff_main(text1 || '', text2 || '');
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

/**
 * Escapes HTML special characters and converts newlines to <br/>.
 *
 * @param {string} str - Raw string.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}
