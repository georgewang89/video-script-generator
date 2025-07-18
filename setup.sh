#!/bin/bash

echo "🚀 Setting up Video Script Generator..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Backend setup
echo "🔧 Setting up backend..."
cd backend
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template. Please update with your API keys."
fi

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Back to root
cd ..

# Create necessary directories
mkdir -p backend/uploads
mkdir -p backend/temp
mkdir -p backend/dist

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your API keys:"
echo "   - CLAUDE_API_KEY=your_claude_api_key"
echo "   - FAL_API_KEY=928f660d-bb6d-488b-80dc-692e4b7172fa:d501ee801b4e8aaf613dc13ea440a4de (already configured)"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Open your browser to:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo ""
echo "🎉 Happy coding!"