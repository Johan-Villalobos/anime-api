// src/docs/openapi.js
'use strict';

/**
 * OpenAPI 3.0.3 specification for the Anime API.
 * Exported as a plain JS object so it can be serialised to JSON on demand
 * without any extra build step.
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Anime API',
    version: '1.0.0',
    description: `
REST API para la **Anime App** construida con Node.js puro (sin frameworks).

Permite buscar personajes de **One Piece**, **Saint Seiya** y **Hunter x Hunter**
almacenados en una base de datos Supabase (PostgreSQL).

### Notas
- La búsqueda por \`name\` es **parcial** y **case-insensitive** (usa \`ILIKE\`).
- Los campos \`images\` retornan un array de URLs; puede ser \`[]\` si aún no se han cargado imágenes.
- Todos los endpoints son de solo lectura (\`GET\`).
    `.trim(),
    contact: {
      name: 'Anime App',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Desarrollo local',
    },
    {
      url: 'https://anime-api.onrender.com',
      description: 'Producción (Render) — reemplaza con tu URL real',
    },
  ],
  tags: [
    { name: 'Health',         description: 'Estado del servidor y la base de datos' },
    { name: 'Series',         description: 'Listado de series disponibles' },
    { name: 'One Piece',      description: 'Personajes de One Piece' },
    { name: 'Saint Seiya',    description: 'Personajes de Saint Seiya' },
    { name: 'Hunter x Hunter',description: 'Personajes de Hunter x Hunter' },
  ],
  paths: {

    // ── /health ──────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Estado del servidor',
        description: 'Verifica que el servidor esté activo y que la conexión a Supabase funcione.',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Servidor y base de datos operativos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
                example: {
                  success: true,
                  data: {
                    status: 'ok',
                    db: 'connected',
                    series: 3,
                    uptime: 142,
                    ts: '2025-01-15T10:30:00.000Z',
                  },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/series ───────────────────────────────────────────────────────────
    '/api/series': {
      get: {
        tags: ['Series'],
        summary: 'Listar todas las series',
        description: 'Retorna el listado completo de series disponibles con su metadata.',
        operationId: 'listSeries',
        responses: {
          200: {
            description: 'Lista de series',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Series' },
                        },
                      },
                    },
                  ],
                },
                example: {
                  success: true,
                  data: [
                    { id: 1, slug: 'hunter_x_hunter', name: 'Hunter x Hunter', description: 'El mundo de los Hunters…', created_at: '2025-01-01T00:00:00Z' },
                    { id: 2, slug: 'one_piece',       name: 'One Piece',       description: 'Las aventuras de Luffy…', created_at: '2025-01-01T00:00:00Z' },
                    { id: 3, slug: 'saint_seiya',     name: 'Saint Seiya',     description: 'Los Caballeros del Zodiaco…', created_at: '2025-01-01T00:00:00Z' },
                  ],
                },
              },
            },
          },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/one-piece ────────────────────────────────────────────────────────
    '/api/one-piece': {
      get: {
        tags: ['One Piece'],
        summary: 'Buscar personaje por nombre',
        description: 'Busca un personaje de One Piece por nombre. La búsqueda es parcial y no distingue mayúsculas.',
        operationId: 'searchOnePiece',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: {
            description: 'Personaje encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CharacterResponse' },
                example: {
                  success: true,
                  data: {
                    id: 1,
                    series_slug: 'one_piece',
                    series_name: 'One Piece',
                    name: 'Monkey D. Luffy',
                    age: '19',
                    category: 'Capitán — Piratas Sombrero de Paja',
                    power: 'Fruta del Diablo: Gomu Gomu no Mi (Hito Hito no Mi, Model: Nika)',
                    technique: 'Gear Fifth / Gomu Gomu no Gigant',
                    description: 'El futuro Rey de los Piratas…',
                    images: [],
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/one-piece/all': {
      get: {
        tags: ['One Piece'],
        summary: 'Listar todos los personajes',
        description: 'Retorna todos los personajes de One Piece ordenados por nombre.',
        operationId: 'listOnePiece',
        responses: {
          200: { $ref: '#/components/responses/CharacterList' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/saint-seiya ──────────────────────────────────────────────────────
    '/api/saint-seiya': {
      get: {
        tags: ['Saint Seiya'],
        summary: 'Buscar personaje por nombre',
        description: 'Busca un personaje de Saint Seiya por nombre. La búsqueda es parcial y no distingue mayúsculas.',
        operationId: 'searchSaintSeiya',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: {
            description: 'Personaje encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CharacterResponse' },
                example: {
                  success: true,
                  data: {
                    id: 15,
                    series_slug: 'saint_seiya',
                    series_name: 'Saint Seiya',
                    name: 'Pegasus Seiya',
                    age: '13',
                    category: 'Caballero de Bronce — Armadura de Pegaso',
                    power: 'Séptimo Sentido / Octavo Sentido',
                    technique: 'Pegasus Meteor Fist / Pegasus Sui-sei Ken',
                    description: 'Huérfano enviado al Santuario de Grecia…',
                    images: [],
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/saint-seiya/all': {
      get: {
        tags: ['Saint Seiya'],
        summary: 'Listar todos los personajes',
        description: 'Retorna todos los personajes de Saint Seiya ordenados por nombre.',
        operationId: 'listSaintSeiya',
        responses: {
          200: { $ref: '#/components/responses/CharacterList' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/hunter-x-hunter ─────────────────────────────────────────────────
    '/api/hunter-x-hunter': {
      get: {
        tags: ['Hunter x Hunter'],
        summary: 'Buscar personaje por nombre',
        description: 'Busca un personaje de Hunter x Hunter por nombre. La búsqueda es parcial y no distingue mayúsculas.',
        operationId: 'searchHunterXHunter',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: {
            description: 'Personaje encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CharacterResponse' },
                example: {
                  success: true,
                  data: {
                    id: 26,
                    series_slug: 'hunter_x_hunter',
                    series_name: 'Hunter x Hunter',
                    name: 'Killua Zoldyck',
                    age: '12',
                    category: 'Hunter — Ex-asesino del Clan Zoldyck',
                    power: 'Nen — Transmutación: Godspeed / Electricidad',
                    technique: 'Godspeed / Narukami (Thunder)',
                    description: 'Criado desde la cuna como el asesino perfecto…',
                    images: [],
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/hunter-x-hunter/all': {
      get: {
        tags: ['Hunter x Hunter'],
        summary: 'Listar todos los personajes',
        description: 'Retorna todos los personajes de Hunter x Hunter ordenados por nombre.',
        operationId: 'listHunterXHunter',
        responses: {
          200: { $ref: '#/components/responses/CharacterList' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {

    parameters: {
      nameQuery: {
        name: 'name',
        in: 'query',
        required: true,
        description: 'Nombre del personaje (mínimo 2 caracteres, máximo 100). Admite búsqueda parcial.',
        schema: { type: 'string', minLength: 2, maxLength: 100, example: 'luffy' },
      },
    },

    schemas: {
      Character: {
        type: 'object',
        properties: {
          id:          { type: 'integer', example: 1 },
          series_slug: { type: 'string',  example: 'one_piece' },
          series_name: { type: 'string',  example: 'One Piece' },
          name:        { type: 'string',  example: 'Monkey D. Luffy' },
          age:         { type: 'string',  nullable: true, example: '19' },
          category:    { type: 'string',  nullable: true, example: 'Capitán — Piratas Sombrero de Paja' },
          power:       { type: 'string',  nullable: true, example: 'Fruta del Diablo: Gomu Gomu no Mi' },
          technique:   { type: 'string',  nullable: true, example: 'Gear Fifth' },
          description: { type: 'string',  nullable: true, example: 'El futuro Rey de los Piratas…' },
          images: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            example: ['https://cdn.example.com/luffy1.jpg'],
          },
        },
      },

      Series: {
        type: 'object',
        properties: {
          id:          { type: 'integer', example: 1 },
          slug:        { type: 'string',  example: 'one_piece' },
          name:        { type: 'string',  example: 'One Piece' },
          description: { type: 'string',  nullable: true, example: 'Las aventuras de Monkey D. Luffy…' },
          created_at:  { type: 'string',  format: 'date-time', example: '2025-01-01T00:00:00Z' },
        },
      },

      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
        },
      },

      CharacterResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/Character' },
            },
          },
        ],
      },

      HealthResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status:  { type: 'string', example: 'ok' },
                  db:      { type: 'string', example: 'connected' },
                  series:  { type: 'integer', example: 3 },
                  uptime:  { type: 'integer', description: 'Segundos desde que inició el proceso', example: 142 },
                  ts:      { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
                },
              },
            },
          },
        ],
      },

      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error:   { type: 'string',  example: 'Descripción del error' },
        },
      },
    },

    responses: {
      CharacterList: {
        description: 'Lista de personajes de la serie',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessEnvelope' },
                {
                  type: 'object',
                  properties: {
                    data:  { type: 'array', items: { $ref: '#/components/schemas/Character' } },
                    total: { type: 'integer', example: 10 },
                  },
                },
              ],
            },
          },
        },
      },
      BadRequest: {
        description: 'Parámetro inválido o faltante',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, error: 'Query param "name" is required.' },
          },
        },
      },
      NotFound: {
        description: 'Personaje no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, error: 'No character matching "xyz" was found in this series.' },
          },
        },
      },
      ServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, error: 'Internal server error' },
          },
        },
      },
    },
  },
};

module.exports = { spec };
