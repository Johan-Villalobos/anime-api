// src/middleware/auth.js
'use strict';

const { sendJSON } = require('../utils/response');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Valida que la request contenga el header `x-admin-key` con el valor correcto.
 * Retorna true si la request está autorizada, false (y termina la respuesta) si no.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean}
 */
function requireAdminKey(req, res) {
  if (!ADMIN_API_KEY) {
    console.error('[auth] ADMIN_API_KEY no está configurada en las variables de entorno.');
    sendJSON(res, 500, { success: false, error: 'Servidor mal configurado.' });
    return false;
  }

  const provided = req.headers['x-admin-key'];

  if (!provided || provided !== ADMIN_API_KEY) {
    sendJSON(res, 401, { success: false, error: 'No autorizado. API key inválida o ausente.' });
    return false;
  }

  return true;
}

module.exports = { requireAdminKey };
