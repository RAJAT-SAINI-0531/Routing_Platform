#!/bin/bash

echo "🔍 Testing Flask + QGIS Routing Platform Setup..."

# Check if containers are running
echo "📦 Checking container status..."
docker-compose ps

echo ""
echo "🌐 Testing web connectivity..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "❌ Flask app not responding"

echo ""
echo "🗄️ Testing MongoDB connectivity..."
docker-compose exec mongodb mongo --eval "db.runCommand('ping')" --quiet || echo "❌ MongoDB not responding"

echo ""
echo "📋 Flask app logs (last 10 lines):"
docker-compose logs --tail=10 flask-qgis-app

echo ""
echo "✅ Test complete!"
echo "If Flask is running, access your app at: http://localhost:5000"
