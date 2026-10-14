/**
 * Minimal shims for lodash subpath imports used by recharts.
 * Only the 5 public exports missing from the partial lodash installation.
 */

// lodash/get
export function get(object, path, defaultValue) {
  if (object == null) return defaultValue;
  const parts = Array.isArray(path)
    ? path
    : String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let result = object;
  for (const key of parts) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

// lodash/every
export function every(collection, predicate) {
  if (!collection) return true;
  const arr = Array.isArray(collection) ? collection : Object.values(collection);
  return arr.every(typeof predicate === 'function' ? predicate : (item) => item[predicate]);
}

// lodash/find
export function find(collection, predicate) {
  if (!collection) return undefined;
  const arr = Array.isArray(collection) ? collection : Object.values(collection);
  if (typeof predicate === 'function') return arr.find(predicate);
  return arr.find((item) => Object.entries(predicate).every(([k, v]) => item[k] === v));
}

// lodash/first
export function first(array) {
  return array && array.length ? array[0] : undefined;
}

// lodash/flatMap
export function flatMap(collection, iteratee) {
  if (!collection) return [];
  const arr = Array.isArray(collection) ? collection : Object.values(collection);
  return arr.flatMap(typeof iteratee === 'function' ? iteratee : (item) => item[iteratee]);
}
