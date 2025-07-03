#!/bin/bash

# Swagger/OpenAPI Setup Script
# Installs and configures Swagger documentation for Next.js API routes

set -e

echo "🚀 Setting up Swagger/OpenAPI documentation..."

# Install required packages
echo "📦 Installing Swagger packages..."
yarn add swagger-jsdoc swagger-ui-react
yarn add -D @types/swagger-jsdoc @types/swagger-ui-react

echo "✅ Swagger packages installed!"

echo "🎯 Next steps:"
echo "   1. Configure swagger.config.js"
echo "   2. Create /api/docs route for Swagger UI"
echo "   3. Add JSDoc comments to API routes"
echo "   4. Generate OpenAPI spec"
echo "   5. Set up interactive API documentation"

echo "📚 Swagger setup completed!" 