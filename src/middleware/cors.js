// src/middleware/cors.js
'use strict';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim());

/**
 * Applies CORS headers to every response.
 * Returns true if the request was a preflight (OPTIONS) and has been fully handled.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean} — true if the response was already ended (preflight)
 */
function applyCors(req, res) {
  const origin = req.headers['origin'] || '';

  const allow =
    ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
      ? origin || '*'
      : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allow);
  // POST agregado para los endpoints admin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // x-admin-key agregado para autenticación de admin
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

module.exports = { applyCors };
