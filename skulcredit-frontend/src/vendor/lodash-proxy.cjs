/**
 * Proxy that re-exports a single lodash function from the main lodash bundle.
 * Used as a Vite alias target for missing lodash subpath imports.
 * The exported function name is injected by the alias key.
 *
 * Each alias entry (e.g. "lodash/get") maps to a file like lodash-proxy-get.cjs
 * that does: module.exports = require('lodash/lodash.js').get
 */
// This file is not used directly — see lodash-proxy-*.cjs files.
