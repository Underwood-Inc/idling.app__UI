const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Idling.app API',
      version: '0.338.7',
      description: 'Complete API documentation for Idling.app - a modern social platform',
      contact: {
        name: 'Idling.app Development Team',
        url: 'https://github.com/Underwood-Inc/idling.app__UI',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server (Next.js)',
      },
      {
        url: 'https://idling.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        NextAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth session cookie',
        },
        AdminRole: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Admin-Role',
          description: 'Admin role verification',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
          },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'User role',
            },
          },
        },

      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Users',
        description: 'User profile and account management',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin only)',
      },
      {
        name: 'Emojis',
        description: 'Emoji browsing and management',
      },
      {
        name: 'Upload',
        description: 'File upload operations',
      },
      {
        name: 'Images',
        description: 'Dynamic image generation',
      },
      {
        name: 'Alerts',
        description: 'System alerts and notifications',
      },
      {
        name: 'System',
        description: 'System information and metadata',
      },
      {
        name: 'Documentation',
        description: 'API documentation endpoints',
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js',
  ],
};

const specs = swaggerJSDoc(options);

// Auto-generate operationIds for all endpoints
function generateOperationId(method, path) {
  // Convert path to camelCase and remove special characters
  const cleanPath = path
    .replace(/^\/api\//, '') // Remove /api/ prefix
    .replace(/\{([^}]+)\}/g, 'By$1') // Convert {id} to ById
    .replace(/[/-]/g, '') // Remove slashes and hyphens
    .replace(/([a-z])([A-Z])/g, '$1$2') // Keep camelCase
    .replace(/^(.)/, (match) => match.toLowerCase()); // Lowercase first letter
  
  // Add method prefix
  const methodPrefix = method.toLowerCase();
  return methodPrefix + cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
}

// Add operationIds to all operations
if (specs.paths) {
  Object.entries(specs.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation && typeof operation === 'object' && !operation.operationId) {
        operation.operationId = generateOperationId(method, path);
      }
    });
  });
}

module.exports = specs; 