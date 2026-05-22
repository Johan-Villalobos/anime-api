// src/server.js
'use strict';
const { adminRouter } = require('./routes/admin'); // importar

// dentro del handler principal, ANTES del animeRouter:
if (await adminRouter(req, res)) return;

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
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!(key in process.env)) process.env[key] = value; // don't overwrite
    });
}

// ─── Dependencies ─────────────────────────────────────────────────────────────
const http = require('http');
const { applyCors }    = require('./middleware/cors');
const { logRequest }   = require('./middleware/logger');
const { animeRouter }  = require('./routes/anime');
const { healthRouter } = require('./routes/health');
const { docsRouter }   = require('./routes/docs');
const { sendJSON }     = require('./utils/response');

// ─── Server ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer(async (req, res) => {
  // 1. Log every request
  logRequest(req, res);

  // 2. Apply CORS (handles OPTIONS preflight automatically)
  if (applyCors(req, res)) return;

  // 3. Route matching
  try {
    if (await healthRouter(req, res)) return;
    if (docsRouter(req, res))         return;
    if (await animeRouter(req, res))  return;

    // 404 — no route matched
    sendJSON(res, 404, {
      success: false,
      error: 'Not found',
      hint: 'Available routes: GET /health | GET /docs | GET /api/series | GET /api/one-piece?name= | GET /api/saint-seiya?name= | GET /api/hunter-x-hunter?name=',
    });
  } catch (err) {
    console.error('[server] Unhandled error:', err);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000); // force-kill after 5 s
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  🍙  Anime API  ·  Node.js  (no framework)');
  console.log(`  ▶   http://localhost:${PORT}`);
  console.log('');
  console.log('  Routes:');
  console.log(`    GET  /health`);
  console.log(`    GET  /docs                     ← Swagger UI`);
  console.log(`    GET  /docs/openapi.json        ← OpenAPI 3.0 spec`);
  console.log(`    GET  /api/series`);
  console.log(`    GET  /api/one-piece?name=<query>`);
  console.log(`    GET  /api/one-piece/all`);
  console.log(`    GET  /api/saint-seiya?name=<query>`);
  console.log(`    GET  /api/saint-seiya/all`);
  console.log(`    GET  /api/hunter-x-hunter?name=<query>`);
  console.log(`    GET  /api/hunter-x-hunter/all`);
  console.log('');
});
