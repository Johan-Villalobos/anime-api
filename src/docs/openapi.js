// src/docs/openapi.js
'use strict';

/**
 * Builds the OpenAPI spec with the correct server URL derived from the
 * incoming request so Swagger UI "Try it out" always targets the right host.
 *
 * @param {string} [baseUrl] - e.g. 'https://my-app.onrender.com'
 */
function buildSpec(baseUrl) {
  const servers = baseUrl
    ? [{ url: baseUrl, description: 'Servidor actual' }]
    : [{ url: 'http://localhost:3000', description: 'Desarrollo local' }];

  return buildSpecWithServers(servers);
}

function buildSpecWithServers(servers) {
  return {
  openapi: '3.0.3',
  info: {
    title: 'Anime API',
    version: '1.1.0',
    description: `
REST API para la **Anime App** construida con Node.js puro (sin frameworks).

Permite buscar personajes de **One Piece**, **Saint Seiya** y **Hunter x Hunter**
almacenados en una base de datos Supabase (PostgreSQL).

### Endpoints de lectura
- La búsqueda por \`name\` es **parcial** y **case-insensitive** (usa \`ILIKE\`).
- Los campos \`images\` retornan un array de URLs; puede ser \`[]\` si aún no se han cargado imágenes.

### Endpoints de administración (/api/admin/*)
- Requieren el header \`x-admin-key\` con el valor configurado en la variable de entorno \`ADMIN_API_KEY\`.
- Permiten crear nuevas series y personajes con sus imágenes.
    `.trim(),
    contact: { name: 'Anime App' },
  },
  servers,
  tags: [
    { name: 'Health',         description: 'Estado del servidor y la base de datos' },
    { name: 'Series',         description: 'Listado de series disponibles' },
    { name: 'One Piece',      description: 'Personajes de One Piece' },
    { name: 'Saint Seiya',    description: 'Personajes de Saint Seiya' },
    { name: 'Hunter x Hunter',description: 'Personajes de Hunter x Hunter' },
    { name: 'Admin',          description: 'Gestión de contenido — requiere x-admin-key' },
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
                  data: { status: 'ok', db: 'connected', series: 3, uptime: 142, ts: '2025-01-15T10:30:00.000Z' },
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
        operationId: 'listSeries',
        responses: {
          200: {
            description: 'Lista de series',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Series' } } } },
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
        operationId: 'searchOnePiece',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: { $ref: '#/components/responses/CharacterFound' },
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
        operationId: 'searchSaintSeiya',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: { $ref: '#/components/responses/CharacterFound' },
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
        operationId: 'searchHunterXHunter',
        parameters: [{ $ref: '#/components/parameters/nameQuery' }],
        responses: {
          200: { $ref: '#/components/responses/CharacterFound' },
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
        operationId: 'listHunterXHunter',
        responses: {
          200: { $ref: '#/components/responses/CharacterList' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/admin/series ─────────────────────────────────────────────────────
    '/api/admin/series': {
      get: {
        tags: ['Admin'],
        summary: 'Listar series (admin)',
        description: 'Retorna todas las series. Requiere `x-admin-key`.',
        operationId: 'adminListSeries',
        security: [{ adminKey: [] }],
        responses: {
          200: {
            description: 'Lista de series',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Series' } } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Crear nueva serie',
        description: 'Agrega una nueva serie de anime a la base de datos. Requiere `x-admin-key`.',
        operationId: 'adminCreateSeries',
        security: [{ adminKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSeriesBody' },
              example: {
                slug: 'dragon_ball_z',
                name: 'Dragon Ball Z',
                description: 'Las aventuras de Goku y sus amigos.',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Serie creada',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Series' } } },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── /api/admin/characters ─────────────────────────────────────────────────
    '/api/admin/characters': {
      post: {
        tags: ['Admin'],
        summary: 'Crear nuevo personaje',
        description: 'Agrega un personaje a una serie existente, con sus imágenes. Requiere `x-admin-key`.',
        operationId: 'adminCreateCharacter',
        security: [{ adminKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCharacterBody' },
              example: {
                seriesSlug: 'one_piece',
                name: 'Roronoa Zoro',
                description: 'El primer oficial y espadachín de los Piratas de Sombrero de Paja.',
                age: '21',
                category: 'Primer Oficial — Piratas Sombrero de Paja',
                power: 'Santoryu / Haki de Armadura',
                technique: 'Oni Giri / Tora Gari',
                images: [
                  'https://cdn.example.com/zoro1.jpg',
                  'https://cdn.example.com/zoro2.jpg',
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Personaje creado con sus imágenes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CharacterResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {

    securitySchemes: {
      adminKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-key',
        description: 'API key de administración. Configurada en la variable de entorno `ADMIN_API_KEY`.',
      },
    },

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

      CreateSeriesBody: {
        type: 'object',
        required: ['slug', 'name'],
        properties: {
          slug: {
            type: 'string',
            description: 'Identificador único en snake_case o kebab-case (mínimo 2 caracteres).',
            example: 'dragon_ball_z',
          },
          name: {
            type: 'string',
            description: 'Nombre legible de la serie.',
            example: 'Dragon Ball Z',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Descripción opcional de la serie.',
            example: 'Las aventuras de Goku.',
          },
        },
      },

      CreateCharacterBody: {
        type: 'object',
        required: ['seriesSlug', 'name'],
        properties: {
          seriesSlug:  { type: 'string', description: 'Slug de la serie destino.', example: 'one_piece' },
          name:        { type: 'string', description: 'Nombre del personaje (mínimo 2 caracteres).', example: 'Roronoa Zoro' },
          description: { type: 'string', nullable: true, example: 'Espadachín del equipo.' },
          age:         { type: 'string', nullable: true, example: '21' },
          category:    { type: 'string', nullable: true, example: 'Primer Oficial' },
          power:       { type: 'string', nullable: true, example: 'Santoryu' },
          technique:   { type: 'string', nullable: true, example: 'Oni Giri' },
          images: {
            type: 'array',
            maxItems: 10,
            items: { type: 'string', format: 'uri' },
            description: 'URLs de imágenes del personaje (máximo 10).',
            example: ['https://cdn.example.com/zoro.jpg'],
          },
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
          { type: 'object', properties: { data: { $ref: '#/components/schemas/Character' } } },
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
                  status:  { type: 'string',  example: 'ok' },
                  db:      { type: 'string',  example: 'connected' },
                  series:  { type: 'integer', example: 3 },
                  uptime:  { type: 'integer', example: 142 },
                  ts:      { type: 'string',  format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
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
      CharacterFound: {
        description: 'Personaje encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CharacterResponse' },
          },
        },
      },
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
      Unauthorized: {
        description: 'API key ausente o incorrecta',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, error: 'No autorizado. API key inválida o ausente.' },
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
}

const spec = buildSpec();
module.exports = { spec, buildSpec };
