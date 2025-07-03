---
layout: default
title: API Documentation - Interactive Swagger UI
description: Interactive API documentation for idling.app using Swagger UI
---

# 🔌 Interactive API Documentation

<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"></script>
<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />

<style>
  /* Custom styling for Jekyll integration */
  .swagger-ui .topbar {
    background-color: #2563eb;
  }
  
  .swagger-ui .topbar .download-url-wrapper {
    display: none;
  }
  
  .swagger-ui .info {
    margin: 20px 0;
  }
  
  .swagger-ui .info .title {
    color: #1f2937;
    font-size: 2rem;
    font-weight: 700;
  }
  
  .swagger-ui .info .description {
    color: #4b5563;
    font-size: 1.1rem;
    line-height: 1.6;
  }
  
  /* Ensure proper responsive behavior */
  #swagger-ui {
    max-width: 100%;
    overflow-x: auto;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .swagger-ui {
      filter: invert(1) hue-rotate(180deg);
    }
    
    .swagger-ui img {
      filter: invert(1) hue-rotate(180deg);
    }
  }
</style>

<script>
  // Initialize Swagger UI
  window.onload = function() {
    SwaggerUIBundle({
      url: './openapi.json', // Use local OpenAPI spec file
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
      tryItOutEnabled: true,
      requestInterceptor: function(request) {
        // Add any request interceptors here
        console.log('API Request:', request);
        return request;
      },
      responseInterceptor: function(response) {
        // Add any response interceptors here
        console.log('API Response:', response);
        return response;
      },
      onComplete: function() {
        console.log('Swagger UI loaded successfully');
        
        // Auto-detect if user is authenticated and pre-populate auth
        if (typeof window !== 'undefined') {
          // Check if we're in a development environment with the Next.js app running
          const isLocalDev = window.location.hostname === 'localhost';
          
          if (isLocalDev) {
            // Try to detect if user has a session cookie
            const hasSessionCookie = document.cookie.includes('next-auth.session-token') || 
                                    document.cookie.includes('__Secure-next-auth.session-token');
            
            if (hasSessionCookie) {
              // Auto-authorize with detected session
              console.log('🔐 Session detected - auto-authorizing Swagger UI');
              
              // Show a helpful message
              const authMessage = document.createElement('div');
              authMessage.innerHTML = `
                <div style="
                  background: #e6f3ff; 
                  border: 1px solid #0066cc; 
                  border-radius: 4px; 
                  padding: 12px; 
                  margin: 16px 0;
                  color: #0066cc;
                  font-size: 14px;
                ">
                  🔐 <strong>Authentication Auto-Detected:</strong> 
                  You appear to be logged in to the Next.js app. 
                  Session authentication will work automatically for testing endpoints.
                  <br><br>
                  💡 <strong>Tip:</strong> For admin endpoints, you may need to manually add the AdminRole header.
                </div>
              `;
              
              // Insert the message after the info section
              const infoSection = document.querySelector('.swagger-ui .info');
              if (infoSection && infoSection.parentNode) {
                infoSection.parentNode.insertBefore(authMessage, infoSection.nextSibling);
              }
            } else {
              // Show instructions for authentication
              const authInstructions = document.createElement('div');
              authInstructions.innerHTML = `
                <div style="
                  background: #fff3cd; 
                  border: 1px solid #ffc107; 
                  border-radius: 4px; 
                  padding: 12px; 
                  margin: 16px 0;
                  color: #856404;
                  font-size: 14px;
                ">
                  🔑 <strong>Authentication Required:</strong> 
                  To test authenticated endpoints, first log in to the Next.js app at 
                  <a href="http://localhost:3000" target="_blank" style="color: #0066cc;">localhost:3000</a>, 
                  then return here to test the API.
                  <br><br>
                  📝 <strong>For Admin Endpoints:</strong> Use the "Authorize" button above and add your admin role header.
                </div>
              `;
              
              const infoSection = document.querySelector('.swagger-ui .info');
              if (infoSection && infoSection.parentNode) {
                infoSection.parentNode.insertBefore(authInstructions, infoSection.nextSibling);
              }
            }
          }
        }
      },
      onFailure: function(error) {
        console.error('Failed to load Swagger UI:', error);
        document.getElementById('swagger-ui').innerHTML = `
          <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ Failed to Load API Documentation</h3>
            <p style="color: #7f1d1d; margin-bottom: 0;">
              Unable to load the API specification. This may be because:
            </p>
            <ul style="color: #7f1d1d; margin: 10px 0;">
              <li>The API server is not running</li>
              <li>The OpenAPI specification endpoint is not accessible</li>
              <li>There's a network connectivity issue</li>
            </ul>
            <p style="color: #7f1d1d; margin-bottom: 0;">
              <strong>For local development:</strong> Make sure the Next.js server is running on port 3000.
            </p>
          </div>
        `;
      }
    });
  };
</script>

## 📚 Additional Resources

- **[API Overview](./index.md)** - Introduction to the idling.app API
- **[Authentication Guide](../getting-started.md#authentication)** - How to authenticate with the API
- **[Rate Limiting](../rate-limiting/)** - API rate limiting documentation
- **[Development Setup](../getting-started.md)** - Set up your development environment

## 🔧 For Developers

This interactive documentation allows you to:

- **Explore all API endpoints** with detailed descriptions
- **Test API calls directly** from your browser
- **View request/response schemas** and examples
- **Understand authentication requirements** for each endpoint

### 🔐 Authentication Guide

**For Session-Based Endpoints:**

1. Log in to the main app at [localhost:3000](http://localhost:3000) (development) or [idling.app](https://idling.app) (production)
2. Return to this Swagger UI - your session will be automatically detected
3. Test endpoints that require user authentication

**For Admin Endpoints:**

1. Ensure you're logged in as an admin user
2. Click the "Authorize" button above
3. For `AdminRole (apiKey)`, enter your admin role in the header value
4. Test admin-only endpoints

**API Key Authentication:**

- Session cookies are automatically sent with requests
- Admin role verification uses the `X-Admin-Role` header
- Some endpoints may require additional permissions

The API specification is automatically generated from the source code using JSDoc comments and OpenAPI standards.

---

_This documentation is powered by [Swagger UI](https://swagger.io/tools/swagger-ui/) and automatically synced with the latest API changes._
