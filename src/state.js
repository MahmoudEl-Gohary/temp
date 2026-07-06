/**
 * Minimal global state with subscriber-based reactivity.
 * Every state change notifies all listeners so charts/components can update.
 */

/** @type {Function[]} */
const listeners = [];

const state = {
  region: 'spine',
  tab: 'comparison',
  model: 'all',
  metric: 'green',
  sort: 'asc',
  topN: 50,
  /** @type {{ radeval: Object[], greenSummary: Object[] } | null} */
  data: null,
  /** @type {Object<string, Object[]> | null} */
  grouped: null,
};

/**
 * Returns a shallow copy of the current state.
 *
 * @returns {Object} Current state snapshot.
 */
export function getState() {
  return { ...state };
}

/**
 * Updates one or more state keys and notifies all subscribers.
 *
 * @param {Object} patch - Partial state to merge.
 */
export function setState(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) {
    fn(state);
  }
}

/**
 * Registers a callback to be invoked on every state change.
 *
 * @param {Function} fn - Listener callback receiving the full state.
 */
export function subscribe(fn) {
  listeners.push(fn);
}
