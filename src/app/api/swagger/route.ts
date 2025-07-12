import { readFileSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

/**
 * @swagger
 * /api/swagger:
 *   get:
 *     summary: Swagger UI HTML page
 *     description: Serves the interactive Swagger UI documentation interface
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export async function GET(request: NextRequest) {
  try {
    // Read the OpenAPI spec
    const openApiPath = join(process.cwd(), 'src/app/api/openapi.json');
    const openApiSpec = readFileSync(openApiPath, 'utf8');

    // Generate Swagger UI HTML
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Idling.app API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    #swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
    }
    .swagger-ui .topbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem 0;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    .swagger-ui .topbar .link {
      color: white;
      font-weight: bold;
      text-decoration: none;
      font-size: 1.2rem;
    }
    .swagger-ui .info .title {
      color: #3b4151;
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .swagger-ui .info .description {
      color: #3b4151;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .swagger-ui .scheme-container {
      background: #f7f7f7;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .swagger-ui .auth-wrapper {
      background: #e8f4f8;
      border: 1px solid #b3d9e6;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .swagger-ui .btn.authorize {
      background: #49cc90;
      border-color: #49cc90;
    }
    .swagger-ui .btn.authorize:hover {
      background: #3ea574;
      border-color: #3ea574;
    }
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem 0;
      text-align: center;
      margin-bottom: 2rem;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
    }
    .custom-header p {
      margin: 0.5rem 0 0 0;
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .environment-banner {
      background: #f39c12;
      color: white;
      padding: 0.5rem;
      text-align: center;
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .environment-banner.production {
      background: #27ae60;
    }
    .environment-banner.development {
      background: #e74c3c;
    }
  </style>
</head>
<body>
  <div class="environment-banner ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}">
    ${process.env.NODE_ENV === 'production' ? '🚀 Production API' : '🔧 Development API'} - ${process.env.NODE_ENV === 'production' ? 'Live Data' : 'Test Environment'}
  </div>
  
  <div class="custom-header">
    <h1>🎯 Idling.app API</h1>
    <p>Interactive API Documentation & Testing Interface</p>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/openapi',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add custom headers if needed
          request.headers['X-Requested-With'] = 'SwaggerUI';
          return request;
        },
        responseInterceptor: function(response) {
          // Log responses for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('API Response:', response);
          }
          return response;
        },
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
          
          // Add custom styling after load
          const style = document.createElement('style');
          style.textContent = \`
            .swagger-ui .topbar {
              display: none;
            }
            .swagger-ui .info {
              margin-top: 0;
            }
            .swagger-ui .scheme-container {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
            }
          \`;
          document.head.appendChild(style);
        }
      });
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const searchInput = document.querySelector('.swagger-ui .filter-container input');
          if (searchInput) {
            searchInput.focus();
          }
        }
      });
    };
  </script>
</body>
</html>`;

    return new NextResponse(swaggerHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error serving Swagger UI:', error);
    return NextResponse.json(
      { error: 'Failed to load Swagger UI' },
      { status: 500 }
    );
  }
} 