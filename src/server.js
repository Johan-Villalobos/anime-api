// src/server.js
'use strict';

// ─── Load .env in local dev (ignored in production when vars are set via Render) ─
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;

      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
}

// ─── Dependencies ─────────────────────────────────────────────────────────────
const http = require('http');
const { applyCors } = require('./middleware/cors');
const { logRequest } = require('./middleware/logger');
const { animeRouter } = require('./routes/anime');
const { healthRouter } = require('./routes/health');
const { docsRouter } = require('./routes/docs');
const { adminRouter } = require('./routes/admin');
const { sendJSON } = require('./utils/response');

// ─── Server ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer(async (req, res) => {
  // 1. Log every request
  logRequest(req, res);

  // 2. Apply CORS (handles OPTIONS preflight automatically)
  if (applyCors(req, res)) return;

  // 3. Route matching
  try {
    // Admin routes
    if (await adminRouter(req, res)) return;

    // Health routes
    if (await healthRouter(req, res)) return;

    // Swagger docs
    if (docsRouter(req, res)) return;

    // Anime routes
    if (await animeRouter(req, res)) return;

    // 404 — no route matched
    sendJSON(res, 404, {
      success: false,
      error: 'Not found',
      hint:
        'Available routes: GET /health | GET /docs | GET /api/series | GET /api/one-piece?name= | GET /api/saint-seiya?name= | GET /api/hunter-x-hunter?name=',
    });
  } catch (err) {
    console.error('[server] Unhandled error:', err);

    sendJSON(res, 500, {
      success: false,
      error: 'Internal server error',
    });
});