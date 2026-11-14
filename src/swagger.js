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
    }
  },
  apis: [Path.join(__dirname, 'routes', 'api-routes.js')]
});

export default swaggerSpec;
