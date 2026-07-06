/**
 * Sample Ranking -- Sortable table showing per-sample scores.
 * Enables finding worst/best performing samples for error analysis.
 */
import { getState } from '../state.js';
import { MODEL_KEYS, MODEL_NAMES, METRIC_NAMES, scoreColor } from '../utils/colors.js';

/**
 * Renders the sample ranking table into the table container.
 *
 * @param {HTMLElement} container - Target div element.
 * @param {Function} onClickRow - Callback: (sampleId, model).
 */
export function renderRanking(container, onClickRow) {
  const { grouped, model, metric, sort, topN } = getState();
  if (!grouped) return;

  const selectedModel = model === 'all' ? 'base_qwen' : model;
  const samples = grouped[selectedModel] || [];

  // Sort by selected metric
  const sorted = [...samples]
    .filter((r) => r[metric] !== null && r[metric] !== undefined && !isNaN(r[metric]))
    .sort((a, b) => sort === 'asc' ? a[metric] - b[metric] : b[metric] - a[metric]);

  const display = topN === 'all' ? sorted : sorted.slice(0, Number(topN));

  const metricsToShow = ['green', 'rougeL', 'bertscore', 'radeval_bertscore', 'ratescore'];

  let html = `
    <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th style="width:50px">#</th>
          <th>Sample ID</th>
          ${metricsToShow.map((m) => `<th>${METRIC_NAMES[m] || m}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 0; i < display.length; i++) {
    const row = display[i];
    const shortId = row.id ? row.id.slice(0, 10) + '...' : 'N/A';
    html += `<tr data-id="${row.id}" data-model="${selectedModel}">`;
    html += `<td style="color:#6e7681">${i + 1}</td>`;
    html += `<td class="mono-text" style="font-size:0.78rem">${shortId}</td>`;
    for (const m of metricsToShow) {
      const val = row[m];
      const displayVal = val != null && !isNaN(val) ? val.toFixed(3) : '---';
      const color = val != null && !isNaN(val) ? scoreColor(val) : '#6e7681';
      html += `<td class="score-cell" style="color:${color}">${displayVal}</td>`;
    }
    html += '</tr>';
  }

  html += `
      </tbody>
    </table>
    </div>
    <div style="padding:8px 16px;color:#6e7681;font-size:0.75rem;">
      Showing ${display.length} of ${sorted.length} samples for ${MODEL_NAMES[selectedModel]} | Sorted by ${METRIC_NAMES[metric] || metric} (${sort === 'asc' ? 'worst first' : 'best first'})
    </div>
  `;

  container.innerHTML = html;

  // Attach click handlers
  const rows = container.querySelectorAll('tbody tr');
  for (const tr of rows) {
    tr.addEventListener('click', () => {
      const id = tr.dataset.id;
      const mdl = tr.dataset.model;
      if (id && onClickRow) onClickRow(id, mdl);
    });
  }
}
