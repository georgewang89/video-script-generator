#!/bin/bash

echo "🚀 Deploying Video Script Generator to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build the project
echo "🏗️  Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Check deployment status
if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure environment variables in Vercel dashboard"
    echo "2. Test your deployed application"
    echo "3. Set up custom domain (optional)"
    echo ""
    echo "🔧 Environment Variables needed:"
    echo "- CLAUDE_API_KEY=your_claude_api_key"
    echo "- FAL_API_KEY=928f660d-bb6d-488b-80dc-692e4b7172fa:d501ee801b4e8aaf613dc13ea440a4de"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi