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
  /* Custom styling for Jekyll integration with improved contrast */
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
  
  /* Fix contrast issues - light theme improvements */
  .swagger-ui {
    background-color: #ffffff;
  }
  
  .swagger-ui .scheme-container {
    background-color: var(--light-background--secondary);
    border: 1px solid var(--light-border--primary);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm);
  }
  
  .swagger-ui .opblock {
    background-color: var(--light-background--primary);
    border: 1px solid var(--light-border--primary);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-sm);
  }
  
  .swagger-ui .opblock .opblock-summary {
    background-color: var(--light-background--secondary);
    border-bottom: 1px solid var(--light-border--primary);
  }
  
  .swagger-ui .opblock .opblock-summary-description {
    color: var(--light-bg__text-color--secondary);
  }
  
  .swagger-ui .opblock .opblock-summary-path {
    color: var(--light-bg__text-color--primary);
    font-weight: 600;
  }
  
  .swagger-ui .opblock.opblock-post {
    border-color: var(--brand-primary);
  }
  
  .swagger-ui .opblock.opblock-post .opblock-summary {
    background-color: var(--light-background--tertiary);
    border-color: var(--brand-primary);
  }
  
  .swagger-ui .opblock.opblock-get {
    border-color: var(--brand-secondary--dark);
  }
  
  .swagger-ui .opblock.opblock-get .opblock-summary {
    background-color: var(--light-background--quaternary);
    border-color: var(--brand-secondary--dark);
  }
  
  .swagger-ui .opblock.opblock-put {
    border-color: var(--brand-tertiary--dark);
  }
  
  .swagger-ui .opblock.opblock-put .opblock-summary {
    background-color: var(--light-background--quinary);
    border-color: var(--brand-tertiary--dark);
  }
  
  .swagger-ui .opblock.opblock-delete {
    border-color: var(--brand-quaternary);
  }
  
  .swagger-ui .opblock.opblock-delete .opblock-summary {
    background-color: var(--light-background--tertiary);
    border-color: var(--brand-quaternary);
  }
  
  /* Parameter tables with better spacing and contrast */
  .swagger-ui .parameters-col_description {
    color: var(--light-bg__text-color--secondary);
    padding: var(--spacing-sm) var(--spacing-xs);
    line-height: 1.5;
  }
  
  .swagger-ui .parameters-col_name {
    color: var(--light-bg__text-color--primary);
    font-weight: 600;
    padding: var(--spacing-sm) var(--spacing-xs);
    background-color: var(--light-background--secondary);
  }
  
  .swagger-ui .parameter__name {
    color: var(--light-bg__text-color--primary);
    font-weight: 600;
    background-color: var(--light-background--tertiary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-family: var(--font-mono);
  }
  
  .swagger-ui .parameter__type {
    color: var(--light-bg__text-color--tertiary);
    font-style: italic;
    font-size: 0.9em;
  }
  
  .swagger-ui .parameter__extension,
  .swagger-ui .parameter__in {
    color: var(--light-bg__text-color--tertiary);
    font-size: 0.85em;
    background-color: var(--light-background--quaternary);
    padding: 2px 6px;
    border-radius: var(--border-radius);
    margin-left: var(--spacing-xs);
  }
  
  /* Clean, minimal table styling */
  .swagger-ui table {
    border-collapse: collapse;
    width: 100%;
    margin: var(--spacing-sm) 0;
  }
  
  .swagger-ui table thead tr th,
  .swagger-ui table tbody tr td {
    padding: var(--spacing-sm);
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--light-border--primary);
  }
  
  .swagger-ui table thead tr th {
    background-color: var(--light-background--secondary);
    color: var(--light-bg__text-color--primary);
    font-weight: 600;
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .swagger-ui table tbody tr td {
    color: var(--light-bg__text-color--primary);
  }
  
  .swagger-ui table tbody tr:hover {
    background-color: var(--light-background--secondary);
  }
  
  /* Schema-specific styling - clean and minimal */
  .swagger-ui .model-box {
    margin: var(--spacing-lg) 0;
    padding: 0;
    background: transparent;
    border: none;
  }
  
  .swagger-ui .model-box .model-title {
    color: var(--brand-primary--dark);
    font-weight: 600;
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
    padding: 0;
    border: none;
  }
  
  .swagger-ui .model-box table tbody tr td:first-child {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--brand-primary--dark);
    min-width: 150px;
  }
  
  .swagger-ui .model-box table tbody tr td:nth-child(2) {
    color: var(--light-bg__text-color--tertiary);
    font-size: var(--font-size-sm);
    font-style: italic;
    min-width: 80px;
  }
  
  .swagger-ui .model-box table tbody tr td:nth-child(3) {
    color: var(--light-bg__text-color--primary);
    line-height: 1.5;
  }
  
  /* Simple type indicators */
  .swagger-ui .model-box .prop-type {
    color: var(--brand-tertiary--dark);
    font-weight: 500;
    font-size: var(--font-size-xs);
  }
  
  /* Required field indicators */
  .swagger-ui .model-box .property.required::after {
    content: " *";
    color: var(--brand-quaternary);
    font-weight: bold;
  }
  
  /* Response section with better spacing */
  .swagger-ui .responses-inner {
    background-color: var(--light-background--secondary);
    border: 1px solid var(--light-border--primary);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
  }
  
  .swagger-ui .response-col_status {
    color: var(--light-bg__text-color--primary);
    font-weight: 600;
    background-color: var(--light-background--tertiary);
    padding: 6px 10px;
    border-radius: var(--border-radius);
    font-family: var(--font-mono);
  }
  
  .swagger-ui .response-col_description {
    color: var(--light-bg__text-color--secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    line-height: 1.6;
  }
  
  .swagger-ui .response-col_links {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  /* Status code colors */
  .swagger-ui .responses .response .response-col_status.response-200 {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .swagger-ui .responses .response .response-col_status.response-400,
  .swagger-ui .responses .response .response-col_status.response-401,
  .swagger-ui .responses .response .response-col_status.response-403,
  .swagger-ui .responses .response .response-col_status.response-404 {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .swagger-ui .responses .response .response-col_status.response-500 {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  /* Code blocks */
  .swagger-ui .highlight-code {
    background-color: var(--light-background--secondary);
    border: 1px solid var(--light-border--primary);
    color: var(--light-bg__text-color--primary);
  }
  
  .swagger-ui .microlight {
    background-color: var(--light-background--secondary);
    color: var(--light-bg__text-color--primary);
  }
  
  /* Input fields */
  .swagger-ui input[type="text"], 
  .swagger-ui input[type="number"], 
  .swagger-ui textarea,
  .swagger-ui select {
    background-color: var(--light-background--primary);
    border: 1px solid var(--light-border--secondary);
    color: var(--light-bg__text-color--primary);
    border-radius: var(--border-radius);
    padding: var(--spacing-xs);
  }
  
  .swagger-ui input[type="text"]:focus, 
  .swagger-ui input[type="number"]:focus, 
  .swagger-ui textarea:focus,
  .swagger-ui select:focus {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 0.2rem rgba(var(--brand-primary), 0.25);
  }
  
  /* Buttons */
  .swagger-ui .btn {
    border-radius: var(--border-radius);
    font-weight: 500;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .swagger-ui .btn.try-out__btn {
    background-color: var(--brand-secondary--dark);
    border-color: var(--brand-secondary--dark);
    color: var(--light-bg__text-color--primary);
  }
  
  .swagger-ui .btn.try-out__btn:hover {
    background-color: var(--brand-secondary);
    border-color: var(--brand-secondary);
  }
  
  .swagger-ui .btn.execute {
    background-color: var(--brand-primary);
    border-color: var(--brand-primary);
    color: var(--font-color--primary);
  }
  
  .swagger-ui .btn.execute:hover {
    background-color: var(--brand-primary--dark);
    border-color: var(--brand-primary--dark);
  }
  
  /* Dark mode support with better contrast */
  @media (prefers-color-scheme: dark) {
    .swagger-ui {
      background-color: var(--dark-background--primary);
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui .scheme-container {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui .opblock {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui .opblock .opblock-summary {
      background-color: var(--dark-background--tertiary);
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui .opblock .opblock-summary-description {
      color: var(--dark-bg__text-color--secondary);
    }
    
    .swagger-ui .opblock .opblock-summary-path {
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui .parameters-col_description {
      color: var(--dark-bg__text-color--secondary);
      background-color: var(--dark-background--secondary);
    }
    
    .swagger-ui .parameters-col_name {
      color: var(--dark-bg__text-color--primary);
      background-color: var(--dark-background--tertiary);
    }
    
    .swagger-ui .parameter__name {
      color: var(--dark-bg__text-color--primary);
      background-color: var(--dark-background--tertiary);
    }
    
    .swagger-ui .parameter__type {
      color: var(--dark-bg__text-color--tertiary);
    }
    
    .swagger-ui .parameter__extension,
    .swagger-ui .parameter__in {
      background-color: var(--dark-background--tertiary);
      color: var(--dark-bg__text-color--tertiary);
    }
    
    .swagger-ui table {
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui table thead tr th {
      background-color: var(--brand-primary);
      color: var(--font-color--primary);
      border-bottom-color: var(--brand-primary--dark);
    }
    
    .swagger-ui table tbody tr td {
      background-color: var(--dark-background--secondary);
      color: var(--dark-bg__text-color--primary);
      border-bottom-color: var(--dark-border--primary);
      border-right-color: var(--dark-border--primary);
    }
    
    .swagger-ui table tbody tr:nth-child(even) td {
      background-color: var(--dark-background--tertiary);
    }
    
    .swagger-ui table tbody tr:hover td {
      background-color: var(--dark-background--quaternary);
      color: var(--dark-bg__text-color--primary);
    }
    
    /* Dark mode schema table improvements */
    .swagger-ui .model-box table {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .swagger-ui .model-box table tbody tr td:first-child {
      color: var(--brand-primary--light);
      background-color: var(--dark-background--quaternary);
    }
    
    .swagger-ui .model-box table tbody tr td:nth-child(2) {
      color: var(--dark-bg__text-color--tertiary);
    }
    
    .swagger-ui .model-box table tbody tr td:nth-child(3) {
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui .model-box .prop-type {
      background-color: var(--brand-tertiary--dark);
      color: var(--font-color--primary);
    }
    
    .swagger-ui .model-box {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui .model-box .model-title {
      color: var(--brand-primary--light);
      border-bottom-color: var(--brand-primary);
    }
    
    .swagger-ui .responses-inner {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
    }
    
    .swagger-ui .response-col_status {
      color: var(--dark-bg__text-color--primary);
      background-color: var(--dark-background--tertiary);
    }
    
    .swagger-ui .response-col_description {
      color: var(--dark-bg__text-color--secondary);
    }
    
    .swagger-ui .highlight-code {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui .microlight {
      background-color: var(--dark-background--secondary);
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui input[type="text"], 
    .swagger-ui input[type="number"], 
    .swagger-ui textarea,
    .swagger-ui select {
      background-color: var(--dark-background--secondary);
      border-color: var(--dark-border--primary);
      color: var(--dark-bg__text-color--primary);
    }
    
    .swagger-ui input[type="text"]:focus, 
    .swagger-ui input[type="number"]:focus, 
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 0.2rem rgba(var(--brand-primary), 0.25);
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
- **[Rate Limiting](../../src/lib/services/RateLimitService.md)** - API rate limiting documentation
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
