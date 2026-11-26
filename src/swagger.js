import Path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';

const __dirname = Path.dirname(fileURLToPath(import.meta.url));

/**
 * Builds the OpenAPI spec from the JSDoc @openapi comments in api-routes.js.
 * The interactive docs are served at /api-docs (see app.js).
 */
const swaggerSpec = swaggerJsdoc({
definition: {
  openapi: '3.0.0',
  info: {
    title: 'Kizuna Rail API',
    version: '1.0.0',
    description: 'JSON API for the Kizuna Rail scenic railway booking site.'
  },
  components: {
    securitySchemes: {
      AdminApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-api-key',
        description: 'Admin API key required to access booking records.'
      },
      SessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'kizuna.sid',
        description: 'Session cookie set after signing in at /login.'
      }
    },
    schemas: {
      SessionUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f1c2e9b1e8a0012345678' },
          displayName: { type: 'string', example: 'Jane Smith' },
          username: { type: 'string', example: 'jsmith' },
          email: { type: 'string', example: 'jane@example.com' },
          role: { type: 'string', enum: ['customer', 'admin'] }
        }
      },
      AuthError: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Authentication required' }
        }
      }
    }
  }
},

  apis: [Path.join(__dirname, 'routes', 'api-routes.js')]
});

export default swaggerSpec;
