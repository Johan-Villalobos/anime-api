// src/routes/anime.js
'use strict';

const { URL } = require('url');
const { findCharacterByName, listCharactersBySeries, listSeries } = require('../db/characters');
const { ok, notFound, badRequest, serverError, methodNotAllowed } = require('../utils/response');

// ─── Slugs used in the DB ─────────────────────────────────────────────────────
const SLUGS = {
  '/api/one-piece':        'one_piece',
  '/api/saint-seiya':      'saint_seiya',
  '/api/hunter-x-hunter':  'hunter_x_hunter',
};

/**
 * Handler: GET /api/:anime?name=<query>
 * Searches for a character by name in the given series.
 */
async function handleCharacterSearch(req, res, seriesSlug) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const { searchParams } = new URL(req.url, 'http://localhost');
  const name = (searchParams.get('name') || '').trim();

  if (!name) {
    return badRequest(res, 'Query param "name" is required.');
  }
  if (name.length < 2) {
    return badRequest(res, 'Query param "name" must be at least 2 characters.');
  }
  if (name.length > 100) {
    return badRequest(res, 'Query param "name" must not exceed 100 characters.');
  }

  try {
    const character = await findCharacterByName(seriesSlug, name);
    if (!character) {
      return notFound(res, `No character matching "${name}" was found in this series.`);
    }
    return ok(res, character);
  } catch (err) {
    console.error('[handleCharacterSearch]', err);
    return serverError(res);
  }
}

/**
 * Handler: GET /api/:anime/all
 * Returns all characters for a series.
 */
async function handleCharacterList(req, res, seriesSlug) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  try {
    const characters = await listCharactersBySeries(seriesSlug);
    return ok(res, characters, { total: characters.length });
  } catch (err) {
    console.error('[handleCharacterList]', err);
    return serverError(res);
  }
}

/**
 * Handler: GET /api/series
 * Returns metadata for all series.
 */
async function handleSeriesList(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  try {
    const series = await listSeries();
    return ok(res, series);
  } catch (err) {
    console.error('[handleSeriesList]', err);
    return serverError(res);
  }
}

/**
 * Main anime router.
 * Matches request paths against the known routes and delegates.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean} — true if the route was handled
 */
async function animeRouter(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  // ── GET /api/series ──────────────────────────────────────────
  if (pathname === '/api/series') {
    await handleSeriesList(req, res);
    return true;
  }

  // ── GET /api/:anime?name= ─────────────────────────────────────
  const slug = SLUGS[pathname];
  if (slug) {
    await handleCharacterSearch(req, res, slug);
    return true;
  }

  // ── GET /api/:anime/all ───────────────────────────────────────
  for (const [prefix, slug] of Object.entries(SLUGS)) {
    if (pathname === `${prefix}/all`) {
      await handleCharacterList(req, res, slug);
      return true;
    }
  }

  return false; // not handled here
}

module.exports = { animeRouter };
