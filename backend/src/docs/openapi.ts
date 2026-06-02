/**
 * Spécification OpenAPI 3.0 de l'API Work Class Gabon.
 *
 * Servie par swagger-ui-express sur `/api/docs` (UI) et `/api/docs.json` (brut).
 * Maintenue à la main (volontairement : pas de génération depuis Zod en v1) —
 * à mettre à jour en même temps que les validateurs des contrôleurs.
 *
 * Convention de réponse :
 *   succès → { "success": true, "data": <...>, "meta"?: <pagination> }
 *   erreur → { "success": false, "error": { "code": "...", "message": "..." } }
 */

const bearer = [{ bearerAuth: [] as string[] }];

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Work Class Gabon — API',
    version: '1.0.0',
    description:
      "API de réservation et de gestion d'événements.\n\n" +
      '**Authentification** : `POST /api/auth/login` renvoie un `accessToken` (JWT, 1h). ' +
      'Cliquez sur **Authorize** et collez le token pour tester les routes protégées.\n\n' +
      '**Permissions** : un `super_admin` a toutes les permissions. Un `admin` doit ' +
      'disposer de la permission listée sur chaque route (gérée via `/api/admin/users`).\n\n' +
      '**Règle** : toute donnée sensible (référence, token, id) transite en `POST` + body JSON, jamais en query.',
  },
  servers: [
    { url: '/api', description: 'Serveur courant' },
    { url: 'http://localhost:3001/api', description: 'Dev local' },
    { url: 'https://workclass-backend.onrender.com/api', description: 'Production (Render)' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification des comptes administrateurs' },
    { name: 'Users', description: 'Gestion des comptes admin + permissions (users:manage)' },
    { name: 'Bookings', description: 'Réservations (public + admin)' },
    { name: 'Tickets', description: 'Génération des billets (tickets:generate)' },
    { name: 'Scan', description: "Contrôle d'accès par QR (scan)" },
    { name: 'Feedback', description: 'Avis post-événement (public + modération)' },
    { name: 'Payments', description: 'Paiements (simulation v1)' },
    { name: 'System', description: 'Santé du service' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Donnees invalides' },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
      Permission: {
        type: 'string',
        enum: [
          'bookings:read',
          'bookings:write',
          'tickets:generate',
          'scan',
          'feedback:read',
          'feedback:moderate',
          'payments:manage',
          'users:manage',
        ],
      },
      AdminPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['admin', 'super_admin'] },
          permissions: { type: 'array', items: { $ref: '#/components/schemas/Permission' } },
          isActive: { type: 'boolean' },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@workclass-gabon.com' },
          password: { type: 'string', format: 'password', example: 'ChangeMe_DEV_2026!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/AdminPublic' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 10, maxLength: 128 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'super_admin'], default: 'admin' },
          permissions: { type: 'array', items: { $ref: '#/components/schemas/Permission' } },
        },
      },
      Participant: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'phone'],
        properties: {
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', example: '+24106000000', description: 'Format +?d{8,15}' },
          company: { type: 'string' },
          position: { type: 'string' },
        },
      },
      CreateBookingRequest: {
        type: 'object',
        required: ['eventId', 'ticketTypeId', 'participant'],
        properties: {
          eventId: { type: 'string', format: 'uuid' },
          ticketTypeId: { type: 'string', format: 'uuid' },
          participant: { $ref: '#/components/schemas/Participant' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'price'],
              properties: {
                name: { type: 'string' },
                price: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Healthcheck',
        security: [],
        responses: { 200: { description: 'Service opérationnel' } },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Connexion (email + mot de passe)',
        description: 'Rate-limit : 10 tentatives / 15 min.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Tokens + profil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/LoginResponse' },
                  },
                },
              },
            },
          },
          401: { description: 'Identifiants invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renouveler l\'access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Nouveaux tokens' }, 401: { description: 'Refresh token invalide' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil + permissions du compte courant',
        security: bearer,
        responses: {
          200: { description: 'Profil', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/AdminPublic' } } } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/admin/users/permissions': {
      get: {
        tags: ['Users'],
        summary: 'Catalogue des fonctionnalités attribuables',
        security: bearer,
        responses: { 200: { description: 'Liste { key, label }' }, 403: { description: 'users:manage requis' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Réattribuer les fonctionnalités d\'un compte',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'permissions'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  permissions: { type: 'array', items: { $ref: '#/components/schemas/Permission' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Compte mis à jour' }, 403: { description: 'Interdit' }, 404: { description: 'Introuvable' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Users'],
        summary: 'Lister les comptes (paginé)',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'super_admin'] } },
        ],
        responses: { 200: { description: 'Liste AdminPublic + meta' }, 403: { description: 'users:manage requis' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Créer un compte admin',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } } },
        responses: { 201: { description: 'Créé' }, 409: { description: 'Email déjà utilisé' }, 403: { description: 'Interdit' } },
      },
    },
    '/admin/users/update': {
      post: {
        tags: ['Users'],
        summary: 'Modifier un compte (nom, rôle, actif)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'super_admin'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Mis à jour' }, 403: { description: 'Interdit' } },
      },
    },
    '/admin/users/activate': {
      post: {
        tags: ['Users'],
        summary: 'Réactiver un compte',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Réactivé' } },
      },
    },
    '/admin/users/deactivate': {
      post: {
        tags: ['Users'],
        summary: 'Désactiver un compte',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Désactivé' }, 400: { description: 'Auto-désactivation interdite' } },
      },
    },
    '/admin/users/password': {
      post: {
        tags: ['Users'],
        summary: 'Réinitialiser le mot de passe',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['id', 'password'], properties: { id: { type: 'string', format: 'uuid' }, password: { type: 'string', minLength: 10 } } } } } },
        responses: { 200: { description: 'Réinitialisé' } },
      },
    },

    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Créer une réservation (public)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } } },
        responses: { 201: { description: 'Réservation créée (avec référence WCG-RES-XXXXXX)' }, 400: { description: 'Quota épuisé / événement indisponible' }, 422: { description: 'Validation' } },
      },
    },
    '/bookings/lookup': {
      post: {
        tags: ['Bookings'],
        summary: 'Consulter par référence (public, donnée sensible → body)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['reference'], properties: { reference: { type: 'string', pattern: '^WCG-RES-[A-Z0-9]{6}$', example: 'WCG-RES-AB12CD' } } } } } },
        responses: { 200: { description: 'Réservation' }, 404: { description: 'Introuvable' } },
      },
    },
    '/admin/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'Lister les réservations (bookings:read)',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] } },
        ],
        responses: { 200: { description: 'Liste + meta' }, 403: { description: 'Permission requise' } },
      },
    },
    '/admin/bookings/validate': {
      post: {
        tags: ['Bookings'],
        summary: 'Valider une réservation (bookings:write)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Confirmée' }, 400: { description: 'Non validable' } },
      },
    },
    '/admin/bookings/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Annuler une réservation (bookings:write)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' }, reason: { type: 'string', maxLength: 500 } } } } } },
        responses: { 200: { description: 'Annulée' } },
      },
    },

    '/tickets/generate': {
      post: {
        tags: ['Tickets'],
        summary: 'Générer le billet PDF + QR (tickets:generate)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['bookingId'], properties: { bookingId: { type: 'string', format: 'uuid' } } } } } },
        responses: { 201: { description: 'Billet généré' }, 403: { description: 'Permission requise' } },
      },
    },

    '/scan/verify': {
      post: {
        tags: ['Scan'],
        summary: 'Vérifier un QR sans le consommer (scan)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['ticketId', 'signature'], properties: { ticketId: { type: 'string', format: 'uuid' }, signature: { type: 'string' } } } } } },
        responses: { 200: { description: '{ valid: boolean, ... }' } },
      },
    },
    '/scan/confirm': {
      post: {
        tags: ['Scan'],
        summary: 'Marquer le ticket scanné + certificat (scan)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['ticketId'], properties: { ticketId: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Scan confirmé' } },
      },
    },

    '/feedback/validate': {
      post: {
        tags: ['Feedback'],
        summary: 'Vérifier un token d\'avis (public)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string', minLength: 16 } } } } } },
        responses: { 200: { description: 'Token valide' } },
      },
    },
    '/feedback/submit': {
      post: {
        tags: ['Feedback'],
        summary: 'Soumettre un avis (public)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'ratings'],
                properties: {
                  token: { type: 'string', minLength: 16 },
                  ratings: { type: 'object', additionalProperties: { type: 'integer', minimum: 1, maximum: 5 }, example: { contenu: 5, organisation: 4 } },
                  comment: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Avis enregistré' } },
      },
    },
    '/admin/feedback': {
      get: {
        tags: ['Feedback'],
        summary: 'Lister les avis (feedback:read)',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
        ],
        responses: { 200: { description: 'Liste + meta' } },
      },
    },
    '/admin/feedback/links': {
      post: {
        tags: ['Feedback'],
        summary: 'Générer un lien d\'avis (feedback:moderate)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['bookingId'], properties: { bookingId: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Lien généré' } },
      },
    },
    '/admin/feedback/moderate': {
      post: {
        tags: ['Feedback'],
        summary: 'Modérer un avis (feedback:moderate)',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['responseId', 'action'], properties: { responseId: { type: 'string', format: 'uuid' }, action: { type: 'string', enum: ['approved', 'rejected'] } } } } } },
        responses: { 200: { description: 'Avis modéré' } },
      },
    },

    '/payments/initiate': {
      post: {
        tags: ['Payments'],
        summary: 'Initier un paiement (simulation v1)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['bookingId', 'provider'], properties: { bookingId: { type: 'string', format: 'uuid' }, provider: { type: 'string', enum: ['stripe', 'paystack', 'orange_money', 'simulation'] } } } } } },
        responses: { 201: { description: 'Paiement initié' } },
      },
    },
    '/payments/simulate': {
      post: {
        tags: ['Payments'],
        summary: 'Marquer un paiement réussi (dev/simulation)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['paymentId'], properties: { paymentId: { type: 'string', format: 'uuid' } } } } } },
        responses: { 200: { description: 'Paiement simulé' } },
      },
    },
  },
};
