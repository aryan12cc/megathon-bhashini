#!/bin/bash

echo "🏥 Vaidya-Vaani MVP - Quick Start Script"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

echo ""
echo "🚀 Starting Vaidya-Vaani MVP..."
echo ""

# Start all services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "📊 Service Status:"
echo "=================="
docker-compose ps

echo ""
echo "🔍 Checking API health..."
sleep 5

# Try to hit the health endpoint
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API is healthy!"
else
    echo "⚠️  API might still be starting up. Check logs with: docker-compose logs -f backend"
fi

echo ""
echo "✅ Vaidya-Vaani MVP is running!"
echo ""
echo "📚 Access Points:"
echo "================="
echo "  🌐 API:              http://localhost:8000"
echo "  📖 Swagger Docs:     http://localhost:8000/docs"
echo "  📖 ReDoc:            http://localhost:8000/redoc"
echo "  🗄️  PostgreSQL:       localhost:5432"
echo "  🗄️  MongoDB:          localhost:27017"
echo ""
echo "🔐 Test Credentials (Password: password123):"
echo "============================================="
echo "  Patient:    9876543210"
echo "  Doctor:     9876543211"
echo "  Staff:      9876543212"
echo "  Pharmacist: 9876543213"
echo ""
echo "📝 Useful Commands:"
echo "==================="
echo "  View logs:           docker-compose logs -f"
echo "  Stop services:       docker-compose down"
echo "  Restart backend:     docker-compose restart backend"
echo "  Clean everything:    docker-compose down -v"
echo ""
echo "Happy coding! 🚀"
