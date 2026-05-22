// src/routes/admin.js
'use strict';

const { requireAdminKey } = require('../middleware/auth');
const { createSeries, createCharacter, listSeries } = require('../db/characters');
const { ok, badRequest, serverError, methodNotAllowed } = require('../utils/response');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lee y parsea el body JSON de una request.
 * Rechaza si el body supera 100 KB o no es JSON válido.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object>}
 */
function readJSON(req) {
  return new Promise((resolve, reject) => {
    const MAX = 100 * 1024; // 100 KB
    let raw = '';

    req.setEncoding('utf8');

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX) {
        reject(new Error('Payload demasiado grande.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('JSON inválido en el body.'));
      }
    });

    req.on('error', reject);
  });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/series
 * Crea una nueva serie de anime.
 *
 * Body: { slug, name, description? }
 */
async function handleCreateSeries(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!requireAdminKey(req, res)) return;

  let body;
  try {
    body = await readJSON(req);
  } catch (err) {
    return badRequest(res, err.message);
  }

  const { slug, name, description } = body;

  // Validaciones
  if (!slug || typeof slug !== 'string' || slug.trim().length < 2) {
    return badRequest(res, 'El campo "slug" es requerido (mínimo 2 caracteres).');
  }
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return badRequest(res, 'El campo "name" es requerido (mínimo 2 caracteres).');
  }

  // El slug debe ser snake_case o kebab-case, sin espacios
  const slugClean = slug.trim().toLowerCase().replace(/-/g, '_');
  if (!/^[a-z0-9_]+$/.test(slugClean)) {
    return badRequest(res, 'El slug solo puede contener letras minúsculas, números y guiones bajos.');
  }

  try {
    const series = await createSeries({
      slug:        slugClean,
      name:        name.trim(),
      description: description?.trim() || null,
    });
    return ok(res, series);
  } catch (err) {
    console.error('[handleCreateSeries]', err);

    // Supabase devuelve código 23505 para unique violation
    if (err.code === '23505') {
      return badRequest(res, `Ya existe una serie con el slug "${slug}".`);
    }
    return serverError(res);
  }
}

/**
 * POST /api/admin/characters
 * Crea un personaje dentro de una serie existente.
 *
 * Body: {
 *   seriesSlug,   — slug de la serie (ej: "one_piece")
 *   name,
 *   description?,
 *   age?,
 *   category?,
 *   power?,
 *   technique?,
 *   images?,      — array de URLs (máx 10)
 * }
 */
async function handleCreateCharacter(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!requireAdminKey(req, res)) return;

  let body;
  try {
    body = await readJSON(req);
  } catch (err) {
    return badRequest(res, err.message);
  }

  const {
    seriesSlug,
    name,
    description,
    age,
    category,
    power,
    technique,
    images,
  } = body;

  // Validaciones
  if (!seriesSlug || typeof seriesSlug !== 'string') {
    return badRequest(res, 'El campo "seriesSlug" es requerido.');
  }
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return badRequest(res, 'El campo "name" es requerido (mínimo 2 caracteres).');
  }
  if (images !== undefined && !Array.isArray(images)) {
    return badRequest(res, 'El campo "images" debe ser un array de URLs.');
  }
  if (Array.isArray(images) && images.length > 10) {
    return badRequest(res, 'Máximo 10 imágenes por personaje.');
  }

  // Normalizar el slug (acepta kebab-case y snake_case)
  const slugClean = seriesSlug.trim().toLowerCase().replace(/-/g, '_');

  try {
    const character = await createCharacter({
      seriesSlug:  slugClean,
      name:        name.trim(),
      description: description?.trim()  || null,
      age:         age?.trim()          || null,
      category:    category?.trim()     || null,
      power:       power?.trim()        || null,
      technique:   technique?.trim()    || null,
      images:      images               || [],
    });
    return ok(res, character);
  } catch (err) {
    console.error('[handleCreateCharacter]', err);

    if (err.message?.includes('no encontrada')) {
      return badRequest(res, err.message);
    }
    return serverError(res);
  }
}

/**
 * GET /api/admin/series
 * Lista todas las series (útil para poblar el selector del front sin autenticación extra,
 * pero aquí lo dejamos protegido igual para consistencia).
 */
async function handleListSeries(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  if (!requireAdminKey(req, res)) return;

  try {
    const series = await listSeries();
    return ok(res, series);
  } catch (err) {
    console.error('[handleListSeries]', err);
    return serverError(res);
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Router admin. Maneja /api/admin/*.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {Promise<boolean>} — true si la ruta fue manejada
 */
async function adminRouter(req, res) {
  const { URL } = require('url');
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname === '/api/admin/series') {
    if (req.method === 'GET')  { await handleListSeries(req, res);    return true; }
    if (req.method === 'POST') { await handleCreateSeries(req, res);  return true; }
    methodNotAllowed(res);
    return true;
  }

  if (pathname === '/api/admin/characters') {
    if (req.method === 'POST') { await handleCreateCharacter(req, res); return true; }
    methodNotAllowed(res);
    return true;
  }

  return false;
}

module.exports = { adminRouter };
