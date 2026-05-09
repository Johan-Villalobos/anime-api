// src/utils/response.js
'use strict';

/**
 * Sends a JSON response with a given status code.
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} body
 */
function sendJSON(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function ok(res, data, meta = {}) {
  sendJSON(res, 200, { success: true, data, ...meta });
}

function notFound(res, message = 'Resource not found') {
  sendJSON(res, 404, { success: false, error: message });
}

function badRequest(res, message = 'Bad request') {
  sendJSON(res, 400, { success: false, error: message });
}

function serverError(res, message = 'Internal server error') {
  sendJSON(res, 500, { success: false, error: message });
}

function methodNotAllowed(res) {
  sendJSON(res, 405, { success: false, error: 'Method not allowed' });
}

module.exports = { sendJSON, ok, notFound, badRequest, serverError, methodNotAllowed };
