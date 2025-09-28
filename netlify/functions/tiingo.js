// Thin re-export without duplicate named exports.
// `export *` re-exports all named exports (including `handler`).
// Default must be re-exported explicitly.
export { default } from './tiingo-data.js';
export * from './tiingo-data.js';