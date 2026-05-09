// src/middleware/logger.js
'use strict';

/**
 * Logs every incoming request with method, URL, status code and response time.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 */
function logRequest(req, res) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const emoji   = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
    console.log(`${emoji}  ${method} ${url} → ${status} (${ms}ms)`);
  });
}

module.exports = { logRequest };
