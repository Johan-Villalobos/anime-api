// src/db/characters.js
'use strict';

const { supabase } = require('./supabase');

/**
 * Finds a single character by name (case-insensitive, partial match) within a series slug.
 *
 * Uses the `v_characters_with_images` view so images come aggregated in one query.
 *
 * @param {string} seriesSlug   — e.g. 'one_piece'
 * @param {string} name         — search term from the client
 * @returns {Promise<object|null>} — character object or null if not found
 */
async function findCharacterByName(seriesSlug, name) {
  const { data: series, error: seriesError } = await supabase
    .from('anime_series')
    .select('id')
    .eq('slug', seriesSlug)
    .single();

  if (seriesError || !series) return null;

  const { data, error } = await supabase
    .from('v_characters_with_images')
    .select('*')
    .eq('series_slug', seriesSlug)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Returns all characters for a given series slug, with their images.
 *
 * @param {string} seriesSlug
 * @returns {Promise<object[]>}
 */
async function listCharactersBySeries(seriesSlug) {
  const { data, error } = await supabase
    .from('v_characters_with_images')
    .select('*')
    .eq('series_slug', seriesSlug)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Returns all series.
 * @returns {Promise<object[]>}
 */
async function listSeries() {
  const { data, error } = await supabase
    .from('anime_series')
    .select('id, slug, name, description, created_at')
    .order('name');

  if (error) throw error;
  return data || [];
}

// ─── Admin: escritura ──────────────────────────────────────────────────────────

/**
 * Crea una nueva serie de anime.
 *
 * @param {{ slug: string, name: string, description?: string }} payload
 * @returns {Promise<object>} — la serie creada
 * @throws si el slug ya existe o hay error de DB
 */
async function createSeries({ slug, name, description }) {
  const { data, error } = await supabase
    .from('anime_series')
    .insert({ slug, name, description: description || null })
    .select('id, slug, name, description, created_at')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Crea un personaje en la serie indicada y asocia sus imágenes en `character_images`.
 * Todo se hace en secuencia; si falla la inserción de imágenes se propaga el error.
 *
 * @param {{
 *   seriesSlug: string,
 *   name: string,
 *   description?: string,
 *   age?: string,
 *   category?: string,
 *   power?: string,
 *   technique?: string,
 *   images?: string[],
 * }} payload
 * @returns {Promise<object>} — el personaje creado con sus imágenes
 * @throws si la serie no existe o hay error de DB
 */
async function createCharacter({
  seriesSlug,
  name,
  description,
  age,
  category,
  power,
  technique,
  images = [],
}) {
  // 1. Resolver el ID de la serie
  const { data: series, error: seriesError } = await supabase
    .from('anime_series')
    .select('id')
    .eq('slug', seriesSlug)
    .single();

  if (seriesError || !series) {
    throw new Error(`Serie "${seriesSlug}" no encontrada.`);
  }

  // 2. Insertar el personaje
  const { data: character, error: charError } = await supabase
    .from('characters')
    .insert({
      series_id:   series.id,
      name,
      description: description || null,
      age:         age         || null,
      category:    category    || null,
      power:       power       || null,
      technique:   technique   || null,
    })
    .select('id, name, description, age, category, power, technique')
    .single();

  if (charError) throw charError;

  // 3. Insertar imágenes si las hay
  const validImages = (images || []).filter((u) => typeof u === 'string' && u.trim() !== '');

  if (validImages.length > 0) {
    const rows = validImages.map((url, idx) => ({
      character_id: character.id,
      url:          url.trim(),
      position:     idx,
    }));

    const { error: imgError } = await supabase.from('character_images').insert(rows);
    if (imgError) throw imgError;
  }

  // 4. Retornar el personaje completo usando la vista
  const { data: full, error: viewError } = await supabase
    .from('v_characters_with_images')
    .select('*')
    .eq('id', character.id)
    .single();

  if (viewError) throw viewError;
  return full;
}

module.exports = {
  findCharacterByName,
  listCharactersBySeries,
  listSeries,
  createSeries,
  createCharacter,
};
