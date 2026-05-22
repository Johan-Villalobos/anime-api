// src/server.js

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
  try {
    // 1. Log every request
    logRequest(req, res);

    // 2. Apply CORS
    if (applyCors(req, res)) return;

    // 3. Admin routes
    if (await adminRouter(req, res)) return;

    // 4. Health route
    if (await healthRouter(req, res)) return;

    // 5. Swagger docs
    if (docsRouter(req, res)) return;

    // 6. Anime routes
    if (await animeRouter(req, res)) return;

    // 404
    sendJSON(res, 404, {
      success: false,
      error: 'Not found',
      hint: 'Available routes: GET /health | GET /docs | GET /api/series'
    });
  } catch (err) {
    console.error('[server] Unhandled error:', err);

    sendJSON(res, 500, {
      success: false,
      error: 'Internal server error'
    });
  }
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`
[server] ${signal} received — shutting down gracefully...`);

  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('🍙 Anime API · Node.js');
  console.log(`▶ http://localhost:${PORT}`);
  console.log('');
  console.log('Routes:');
  console.log('GET /health');
  console.log('GET /docs');
  console.log('GET /docs/openapi.json');
  console.log('GET /api/series');
  console.log('GET /api/one-piece');
  console.log('GET /api/saint-seiya');
  console.log('GET /api/hunter-x-hunter');
});