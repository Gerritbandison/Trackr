#!/bin/bash

# Trackr ITAM - One-Click Production Deployment Script (Sudo Compatible)
# This version works with sudo for Docker permission issues

set -e  # Exit on any error

echo "=================================="
echo "  Trackr ITAM Deployment Script"
echo "=================================="
echo ""

# Color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Detect if we need sudo for Docker
DOCKER_CMD="docker"
COMPOSE_CMD="docker-compose"

if ! docker ps &>/dev/null; then
    if sudo docker ps &>/dev/null; then
        print_warning "Docker requires sudo. Using sudo for Docker commands."
        DOCKER_CMD="sudo docker"
        COMPOSE_CMD="sudo docker-compose"
    else
        print_error "Docker is not accessible. Please install Docker or fix permissions."
        exit 1
    fi
fi

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! $DOCKER_CMD compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"
echo ""

# Get user input for domain/IP
print_info "Configuration Setup"
echo ""
read -p "Enter your domain or IP address (e.g., trackr.example.com or 192.168.1.100): " DOMAIN_OR_IP

if [ -z "$DOMAIN_OR_IP" ]; then
    print_warning "No domain/IP provided. Using localhost as default."
    DOMAIN_OR_IP="localhost"
fi

# Ask for Sentry DSN (optional)
echo ""
print_info "Sentry Setup (Optional - for error tracking)"
read -p "Enter Sentry DSN for backend (press Enter to skip): " BACKEND_SENTRY_DSN
read -p "Enter Sentry DSN for frontend (press Enter to skip): " FRONTEND_SENTRY_DSN

# Generate secure secrets
print_info "Generating secure secrets..."
JWT_SECRET=$(openssl rand -hex 32)
MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

print_success "Secrets generated"
echo ""

# Create .env.prod file
print_info "Creating production environment file..."

cat > .env.prod << EOF
# MongoDB Configuration
MONGO_ROOT_USERNAME=trackr_admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_URI=mongodb://trackr_admin:${MONGO_PASSWORD}@mongo:27017/trackr?authSource=admin
MONGO_DB_NAME=trackr

# Backend Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://${DOMAIN_OR_IP}

# Sentry Configuration (Error Tracking)
SENTRY_DSN=${BACKEND_SENTRY_DSN}
VITE_SENTRY_DSN=${FRONTEND_SENTRY_DSN}
VITE_SENTRY_DEBUG=false
VITE_APP_VERSION=1.0.0

# API URL
VITE_API_URL=http://${DOMAIN_OR_IP}:5000
EOF

print_success ".env.prod created"
echo ""

# Save credentials to a secure file
cat > .deployment-credentials.txt << EOF
=================================
  Trackr ITAM - Deployment Info
=================================

🔐 IMPORTANT: Save these credentials securely!

MongoDB Credentials:
  Username: trackr_admin
  Password: ${MONGO_PASSWORD}
  Connection: mongodb://trackr_admin:${MONGO_PASSWORD}@localhost:27017/trackr

JWT Secret: ${JWT_SECRET}

Application URL: http://${DOMAIN_OR_IP}
API Documentation: http://${DOMAIN_OR_IP}:5000/api-docs
Backend API: http://${DOMAIN_OR_IP}:5000

Default Admin Credentials (CHANGE AFTER FIRST LOGIN):
  Email: admin@company.com
  Password: password123

Generated on: $(date)

⚠️  SECURITY REMINDERS:
1. Change the default admin password immediately after first login
2. Keep this file secure and delete it after saving credentials elsewhere
3. Set up SSL/HTTPS for production use
4. Enable firewall rules to restrict access
EOF

chmod 600 .deployment-credentials.txt

print_success "Deployment credentials saved to .deployment-credentials.txt"
print_warning "Please save these credentials securely!"
echo ""

# Show summary
echo "=================================="
echo "  Deployment Configuration Summary"
echo "=================================="
echo ""
echo "Application URL:    http://${DOMAIN_OR_IP}"
echo "API Documentation:  http://${DOMAIN_OR_IP}:5000/api-docs"
echo "Backend API:        http://${DOMAIN_OR_IP}:5000/api/v1"
echo ""
echo "MongoDB Username:   trackr_admin"
echo "MongoDB Password:   ${MONGO_PASSWORD}"
echo ""
echo "Sentry Backend:     ${BACKEND_SENTRY_DSN:-Not configured}"
echo "Sentry Frontend:    ${FRONTEND_SENTRY_DSN:-Not configured}"
echo ""
echo "=================================="
echo ""

# Confirm deployment
read -p "Ready to deploy? This will start building and deploying the application. Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled by user"
    exit 0
fi

echo ""
print_info "Starting deployment..."
echo ""

# Stop any existing containers
print_info "Stopping any existing containers..."
$COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true
print_success "Cleaned up existing containers"

# Build and start services
print_info "Building Docker images (this may take 5-10 minutes)..."
$COMPOSE_CMD -f docker-compose.prod.yml --env-file .env.prod build --no-cache

print_success "Docker images built successfully"
echo ""

print_info "Starting services..."
$COMPOSE_CMD -f docker-compose.prod.yml --env-file .env.prod up -d

print_success "Services started"
echo ""

# Wait for services to be healthy
print_info "Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check service status
print_info "Checking service status..."
$COMPOSE_CMD -f docker-compose.prod.yml ps

echo ""

# Run database migrations
print_info "Running database migrations..."
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend npm run migrate:up || print_warning "Migrations may have already been run"

print_success "Database migrations completed"
echo ""

# Final health check
print_info "Performing health checks..."
echo ""

# Check backend health
if curl -f -s http://localhost:5000/health > /dev/null; then
    print_success "Backend is healthy and responding"
else
    print_warning "Backend health check failed - may still be starting up"
fi

# Check frontend
if curl -f -s http://localhost:80 > /dev/null; then
    print_success "Frontend is healthy and responding"
else
    print_warning "Frontend health check failed - may still be starting up"
fi

echo ""
echo "=================================="
echo "  🎉 Deployment Complete!"
echo "=================================="
echo ""
print_success "Trackr ITAM is now running!"
echo ""
echo "📱 Access your application:"
echo "   Frontend:        http://${DOMAIN_OR_IP}"
echo "   API Docs:        http://${DOMAIN_OR_IP}:5000/api-docs"
echo "   Backend API:     http://${DOMAIN_OR_IP}:5000/api/v1"
echo ""
echo "🔐 Default Login (CHANGE IMMEDIATELY):"
echo "   Email:     admin@company.com"
echo "   Password:  password123"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:           $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "   Stop services:       $COMPOSE_CMD -f docker-compose.prod.yml down"
echo "   Restart services:    $COMPOSE_CMD -f docker-compose.prod.yml restart"
echo "   View status:         $COMPOSE_CMD -f docker-compose.prod.yml ps"
echo ""
echo "📄 Credentials saved to: .deployment-credentials.txt"
echo ""
print_warning "Next Steps:"
echo "1. Log in and change the default admin password"
echo "2. Set up SSL/HTTPS if deploying to production"
echo "3. Configure firewall rules"
echo "4. Set up automated backups for MongoDB"
echo ""
if [[ "$DOCKER_CMD" == "sudo docker" ]]; then
    echo ""
    print_warning "IMPORTANT: Fix Docker Permissions"
    echo "You're currently using sudo for Docker. To avoid this in the future:"
    echo "  sudo usermod -aG docker \$USER"
    echo "  newgrp docker"
    echo ""
fi
echo "=================================="
