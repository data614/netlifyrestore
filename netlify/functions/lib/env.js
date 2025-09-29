export const TIINGO_TOKEN_ENV_KEYS = [
  'TIINGO_KEY',
  'TIINGO_API_KEY',
  'TIINGO_API_TOKEN',
  'TIINGO_TOKEN',
  'TIINGO_ACCESS_TOKEN',
  'TIINGO_ACCESS_KEY',
  'TIINGO_AUTH_TOKEN',
  'TIINGO_SECRET',
  'TIINGO_API_SECRET',
  'REACT_APP_TIINGO_KEY',
  'REACT_APP_TIINGO_TOKEN',
  'REACT_APP_API_KEY',
  'VITE_TIINGO_KEY',
  'VITE_TIINGO_TOKEN',
  'VITE_APP_TIINGO_KEY',
  'VITE_APP_TIINGO_TOKEN',
];

const readEnvValue = (key) => {
  const raw = process.env?.[key];
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  return trimmed ? trimmed : '';
};

const disallowedLiterals = /^(true|false|null|undefined|yes|no|0|1)$/i;
const tokenChunkPattern = /[a-z0-9][a-z0-9_-]{22,}[a-z0-9]/i;

const extractTokenCandidate = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || disallowedLiterals.test(trimmed)) return '';

  if (/^[a-z0-9_-]{24,128}$/i.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(/[^a-z0-9_-]+/i);
  for (const part of parts) {
    if (part && part.length >= 24 && part.length <= 128 && /^[a-z0-9_-]+$/i.test(part)) {
      return part;
    }
  }

  const match = trimmed.match(tokenChunkPattern);
  return match ? match[0] : '';
};

const buildDetail = (key, value, source) => {
  const token = extractTokenCandidate(value);
  return token ? { key, token, source } : null;
};

export const getTiingoTokenDetail = () => {
  // 1) Preferred: first recognized key with a value that looks like a token
  for (const key of TIINGO_TOKEN_ENV_KEYS) {
    const detail = buildDetail(key, readEnvValue(key), 'env:preferred');
    if (detail) return detail;
  }
  // 2) Case-insensitive keys (common mistake on Linux/Netlify)
  for (const key of TIINGO_TOKEN_ENV_KEYS) {
    const lower = key.toLowerCase();
    const detail = buildDetail(lower, readEnvValue(lower), 'env:lowercase');
    if (detail) return detail;
  }
  // 3) Scan all env values for a token-like value
  for (const [k, v] of Object.entries(process.env || {})) {
    const detail = buildDetail(k, typeof v === 'string' ? v : '', 'env:scan');
    if (detail) return detail;
  }
  // 4) Rare misconfig: token accidentally used as the env var NAME
  for (const k of Object.keys(process.env || {})) {
    const detail = buildDetail(k, k, 'env:name-as-token');
    if (detail) return detail;
  }
  return { key: '', token: '', source: '' };
};

export const getTiingoToken = () => getTiingoTokenDetail().token;

export const isEnvPresent = (key) => readEnvValue(key) !== '';