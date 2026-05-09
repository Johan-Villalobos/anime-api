// src/routes/docs.js
'use strict';

const fs   = require('fs');
const path = require('path');
const { spec }     = require('../docs/openapi');
const { sendJSON } = require('../utils/response');

// Resolve the swagger-ui-dist folder once at startup
const SWAGGER_DIST = path.dirname(require.resolve('swagger-ui-dist/package.json'));

// Files we are willing to serve from swagger-ui-dist (allowlist for safety)
const ALLOWED_FILES = new Set([
  'swagger-ui-bundle.js',
  'swagger-ui-bundle.js.map',
  'swagger-ui.css',
  'swagger-ui.css.map',
  'oauth2-redirect.html',
  'favicon-32x32.png',
  'favicon-16x16.png',
]);

// MIME types for the files we serve
const MIME = {
  '.js':   'application/javascript',
  '.map':  'application/json',
  '.css':  'text/css',
  '.html': 'text/html',
  '.png':  'image/png',
  '.json': 'application/json',
};

/**
 * Serves the Swagger UI HTML page (the "index").
 * We generate it inline so we don't depend on swagger-initializer.js config.
 */
function serveSwaggerHtml(res) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Anime API — Docs</title>
  <link rel="stylesheet" href="/docs/swagger-ui.css" />
  <link rel="icon" type="image/png" href="/docs/favicon-32x32.png" sizes="32x32" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`;

  const buf = Buffer.from(html, 'utf8');
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
  });
  res.end(buf);
}

/**
 * Serves a static file from swagger-ui-dist.
 */
function serveStaticFile(res, filename) {
  const filepath = path.join(SWAGGER_DIST, filename);
  const ext      = path.extname(filename);
  const mime     = MIME[ext] || 'application/octet-stream';

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(data);
  });
}

/**
 * Docs router.
 *
 * Routes handled:
 *   GET /docs              → Swagger UI HTML
 *   GET /docs/             → redirect to /docs
 *   GET /docs/openapi.json → raw OpenAPI 3.0 spec
 *   GET /docs/<asset>      → swagger-ui-dist static files
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean} true if handled
 */
function docsRouter(req, res) {
  const { URL } = require('url');
  const { pathname } = new URL(req.url, 'http://localhost');

  // Only GET
  if (req.method !== 'GET') return false;

  // Redirect /docs/ → /docs
  if (pathname === '/docs/') {
    res.writeHead(301, { Location: '/docs' });
    res.end();
    return true;
  }

  // Swagger UI entry point
  if (pathname === '/docs') {
    serveSwaggerHtml(res);
    return true;
  }

  // Raw OpenAPI JSON spec
  if (pathname === '/docs/openapi.json') {
    sendJSON(res, 200, spec);
    return true;
  }

  // Static assets from swagger-ui-dist
  if (pathname.startsWith('/docs/')) {
    const filename = pathname.slice('/docs/'.length); // e.g. 'swagger-ui-bundle.js'
    if (ALLOWED_FILES.has(filename)) {
      serveStaticFile(res, filename);
      return true;
    }
  }

  return false;
}

module.exports = { docsRouter };
