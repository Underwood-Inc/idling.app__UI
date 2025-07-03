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
        EmojiResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Emoji ID',
            },
            emoji_id: {
              type: 'string',
              description: 'Emoji identifier',
            },
            unicode_codepoint: {
              type: 'string',
              description: 'Unicode codepoint',
            },
            unicode_char: {
              type: 'string',
              description: 'Unicode character',
            },
            name: {
              type: 'string',
              description: 'Emoji name',
            },
            description: {
              type: 'string',
              description: 'Emoji description',
            },
            category: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                display_name: { type: 'string' },
              },
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Emoji tags',
            },
            aliases: {
              type: 'array',
              items: { type: 'string' },
              description: 'Emoji aliases',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Emoji keywords',
            },
            is_custom: {
              type: 'boolean',
              description: 'Whether this is a custom emoji',
            },
            custom_image_url: {
              type: 'string',
              description: 'URL for custom emoji image',
            },
            usage_count: {
              type: 'number',
              description: 'Usage count for this emoji',
            },
            version_min: {
              type: 'string',
              description: 'Minimum OS version required',
            },
            is_approved: {
              type: 'boolean',
              description: 'Whether custom emoji is approved',
            },
            is_personal: {
              type: 'boolean',
              description: 'Whether emoji is personal/private',
            },
          },
        },
        EmojiListResponse: {
          type: 'object',
          properties: {
            emojis: {
              type: 'array',
              items: { $ref: '#/components/schemas/EmojiResponse' },
              description: 'List of emojis',
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  display_name: { type: 'string' },
                  description: { type: 'string' },
                  emoji_count: { type: 'number' },
                },
              },
              description: 'Available emoji categories',
            },
            os_info: {
              type: 'object',
              properties: {
                os: { type: 'string' },
                version: { type: 'string' },
                is_supported: { type: 'boolean' },
                emoji_support: {
                  type: 'object',
                  properties: {
                    supports_unicode: { type: 'boolean' },
                    supports_custom: { type: 'boolean' },
                    max_emoji_version: { type: 'string' },
                    recommended_format: { type: 'string' },
                  },
                },
              },
              description: 'Operating system information',
            },
            total_count: {
              type: 'number',
              description: 'Total number of emojis',
            },
            page: {
              type: 'number',
              description: 'Current page number',
            },
            per_page: {
              type: 'number',
              description: 'Number of emojis per page',
            },
          },
        },
        CustomAlert: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Alert ID',
            },
            title: {
              type: 'string',
              description: 'Alert title',
            },
            message: {
              type: 'string',
              description: 'Alert message',
            },
            details: {
              type: 'string',
              description: 'Additional alert details',
            },
            alert_type: {
              type: 'string',
              description: 'Type of alert (info, warning, error, success)',
            },
            priority: {
              type: 'number',
              description: 'Alert priority (higher numbers = higher priority)',
            },
            icon: {
              type: 'string',
              description: 'Icon name for the alert',
            },
            dismissible: {
              type: 'boolean',
              description: 'Whether the alert can be dismissed',
            },
            persistent: {
              type: 'boolean',
              description: 'Whether the alert persists across sessions',
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              description: 'When the alert expires',
            },
            actions: {
              type: 'object',
              description: 'Available actions for the alert',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the alert',
            },
          },
        },
        AdminUser: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User ID',
            },
            name: {
              type: 'string',
              nullable: true,
              description: 'User name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            image: {
              type: 'string',
              nullable: true,
              description: 'User avatar URL',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
            profile_public: {
              type: 'boolean',
              description: 'Whether profile is public',
            },
            bio: {
              type: 'string',
              description: 'User bio',
            },
            location: {
              type: 'string',
              description: 'User location',
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last login date',
            },
            login_count: {
              type: 'number',
              description: 'Number of logins',
            },
            is_active: {
              type: 'boolean',
              description: 'Whether user is active',
            },
            admin_notes: {
              type: 'string',
              nullable: true,
              description: 'Admin notes about user',
            },
            provider_name: {
              type: 'string',
              nullable: true,
              description: 'Auth provider name',
            },
            provider_email: {
              type: 'string',
              nullable: true,
              description: 'Auth provider email',
            },
            provider_verified: {
              type: 'boolean',
              description: 'Whether provider email is verified',
            },
            provider_last_used: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last provider usage',
            },
            role_count: {
              type: 'number',
              description: 'Number of roles assigned',
            },
            role_names: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated role names',
            },
            has_admin: {
              type: 'boolean',
              description: 'Whether user has admin role',
            },
            has_moderator: {
              type: 'boolean',
              description: 'Whether user has moderator role',
            },
            subscription_count: {
              type: 'number',
              description: 'Number of subscriptions',
            },
            active_subscriptions: {
              type: 'number',
              description: 'Number of active subscriptions',
            },
            subscription_names: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated subscription names',
            },
            has_active_subscription: {
              type: 'boolean',
              description: 'Whether user has active subscription',
            },
            is_timed_out: {
              type: 'boolean',
              description: 'Whether user is currently timed out',
            },
            timeout_count: {
              type: 'number',
              description: 'Number of timeouts',
            },
            active_timeout_reason: {
              type: 'string',
              nullable: true,
              description: 'Reason for current timeout',
            },
            timeout_expires: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'When current timeout expires',
            },
            active_timeout_id: {
              type: 'number',
              nullable: true,
              description: 'ID of active timeout',
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
    ],
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js',
  ],
};

const specs = swaggerJSDoc(options);
module.exports = specs; 