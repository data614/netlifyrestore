import handleTiingoRequest from './netlify/functions/tiingo.js';

const DEFAULT_BASE = 'http://localhost';
const DEFAULT_PATH = '/api/tiingo';
const HELP_TEXT = `Usage: node run-tiingo.mjs [symbol] [kind] [options]\n\n` +
  `Arguments:\n` +
  `  symbol                Stock ticker symbol (default: AAPL)\n` +
  `  kind                  Data kind (eod, intraday, news, etc. Default: eod)\n\n` +
  `Options:\n` +
  `  --limit=<n>           Limit number of results\n` +
  `  --interval=<value>    Interval for intraday data (e.g. 1min)\n` +
  `  --base=<url>          Base URL for the request (default: ${DEFAULT_BASE})\n` +
  `  --path=<path>         Endpoint path (default: ${DEFAULT_PATH})\n` +
  `  --raw                 Print raw response body\n` +
  `  --help                Show this message\n\n` +
  `Any additional --key=value pairs are appended as query parameters.`;

function parseArgs(argv = []) {
  const args = [...argv];
  let symbol;
  let kind;
  const params = new URLSearchParams();
  const options = { base: DEFAULT_BASE, path: DEFAULT_PATH, raw: false };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }

    if (arg.startsWith('--')) {
      const [flag, ...rest] = arg.slice(2).split('=');
      const value = rest.length ? rest.join('=') : undefined;
      if (flag === 'raw') {
        options.raw = true;
        continue;
      }
      if (flag === 'base' && value) {
        options.base = value.replace(/\/?$/, '');
        continue;
      }
      if (flag === 'path' && value) {
        options.path = value.startsWith('/') ? value : `/${value}`;
        continue;
      }
      if (value !== undefined) {
        params.set(flag, value);
        continue;
      }
      throw new Error(`Flag "--${flag}" requires a value.`);
    }

    if (!symbol) {
      symbol = arg;
    } else if (!kind) {
      kind = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return {
    symbol: (symbol || 'AAPL').toUpperCase(),
    kind: (kind || 'eod').toLowerCase(),
    params,
    options,
  };
}

const parsed = parseArgs(process.argv.slice(2));

if (parsed.help) {
  console.log(HELP_TEXT);
  process.exit(0);
}

const { symbol, kind, params, options } = parsed;
params.set('symbol', symbol);
params.set('kind', kind);

const url = new URL(options.path, options.base);
url.search = params.toString();

console.log(`[tiingo-cli] Requesting ${url}`);
const req = new Request(url.toString());

try {
  const resp = await handleTiingoRequest(req);
  const headers = Object.fromEntries(resp.headers.entries());
  const bodyText = await resp.text();
  let bodyOutput = bodyText;
  if (!options.raw) {
    try {
      const parsedBody = JSON.parse(bodyText);
      bodyOutput = JSON.stringify(parsedBody, null, 2);
    } catch (error) {
      bodyOutput = bodyText;
    }
  }

  console.log('status', resp.status, resp.statusText || '');
  console.log('headers', headers);
  console.log(options.raw ? 'body' : 'body (formatted)', bodyOutput);
} catch (error) {
  console.error('[tiingo-cli] Request failed:', error);
  process.exitCode = 1;
}