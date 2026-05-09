// src/routes/health.js
'use strict';

const { supabase } = require('../db/supabase');
const { ok, serverError, methodNotAllowed } = require('../utils/response');

/**
 * GET /health
 * Returns API status and a lightweight DB connectivity check.
 */
async function healthRouter(req, res) {
  const { URL } = require('url');
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname !== '/health') return false;
  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return true;
  }

  try {
    // Lightweight ping — just count series rows (should always be 3)
    const { count, error } = await supabase
      .from('anime_series')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    ok(res, {
      status:   'ok',
      db:       'connected',
      series:   count,
      uptime:   Math.floor(process.uptime()),
      ts:       new Date().toISOString(),
    });
  } catch (err) {
    console.error('[health]', err);
    serverError(res, 'Database unreachable');
  }

  return true;
}

module.exports = { healthRouter };
