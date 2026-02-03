#!/bin/bash

echo "=================================="
echo "  Trackr Deployment Fix Script"
echo "=================================="
echo ""

# Stop and remove all containers
echo "ℹ Stopping and removing containers..."
docker-compose -f docker-compose.prod.yml down -v

# Remove the volume to reset MongoDB
echo "ℹ Removing MongoDB volume..."
docker volume rm trackr_mongo_data 2>/dev/null || true

echo "✓ Cleanup complete"
echo ""

# Start services
echo "ℹ Starting services with correct credentials..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "ℹ Waiting for services to start (this may take 60 seconds)..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "ℹ Checking backend logs..."
docker-compose -f docker-compose.prod.yml logs backend | tail -20

echo ""
echo "=================================="
echo "Deployment should now be running!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:5000"
echo "  Health:   http://localhost:5000/health"
echo "=================================="
