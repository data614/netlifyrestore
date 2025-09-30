# Tiingo Key Verification Guide

This document outlines how to verify that your Tiingo API key is correctly loaded without ever storing the real secret in the repository.

## 1. Configure Your Environment

Create a local `.env` file (which must stay untracked) with a placeholder value:

```bash
TIINGO_KEY=your_api_key_here
```

Never commit the file that contains the real key. The project `.gitignore` already prevents accidental commits of `.env` files.

## 2. Run the Verification Script

Use the `debug-tiingo-connection.mjs` helper script to confirm that the key can authenticate against the Tiingo API.

```bash
node debug-tiingo-connection.mjs AAPL
```

The script prints a redacted version of the key so the secret is never exposed in logs.

## 3. Troubleshooting Checklist

1. Ensure the environment variable `TIINGO_KEY` (or any of the supported aliases in `netlify/functions/lib/env.js`) is set.
2. Verify that outbound network access is allowed from your environment.
3. Confirm that the ticker symbol you are testing exists.

## 4. Netlify Deployments

Netlify injects the `TIINGO_KEY` secret at build and runtime. The CI pipeline will fail if any build artifacts contain the literal value of that secret. If the build fails, scrub the offending files and re-run the pipeline.

## 5. Regenerating Credentials

If you suspect that the key has leaked, rotate it from the Tiingo dashboard and update the Netlify environment variable.

---

By following this process, you can safely verify connectivity without ever storing sensitive credentials in source control.
