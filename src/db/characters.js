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
  // First resolve the series id from the slug
  const { data: series, error: seriesError } = await supabase
    .from('anime_series')
    .select('id')
    .eq('slug', seriesSlug)
    .single();

  if (seriesError || !series) return null;

  // Search using the view (already has images aggregated)
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

module.exports = { findCharacterByName, listCharactersBySeries, listSeries };
