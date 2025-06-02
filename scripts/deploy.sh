#!/bin/bash

# Bonderud Law API Deployment Script
# Usage: npm run deploy

set -e  # Exit on any error

echo "🚀 Starting deployment for Bonderud Law API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bonderud-api"
NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-5000}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    mkdir -p logs
    mkdir -p uploads
}

# Install dependencies
install_dependencies() {
    log_info "Installing production dependencies..."
    if [ "$NODE_ENV" = "production" ]; then
        npm ci --only=production
    else
        npm install
    fi
}

# Run build process
build() {
    log_info "Running build process..."
    npm run lint
    log_info "Linting completed ✓"
    
    # Only run tests if not in CI
    if [ -z "$CI" ]; then
        npm run test
        log_info "Tests completed ✓"
    fi
}

# Check if app is already running
check_running() {
    if pm2 list | grep -q "$APP_NAME"; then
        log_warn "Application is already running. Stopping..."
        pm2 stop $APP_NAME
        pm2 delete $APP_NAME
    fi
}

# Start the application
start_app() {
    log_info "Starting application with PM2..."
    pm2 start ecosystem.config.js --env $NODE_ENV
    pm2 save
    log_info "Application started successfully ✓"
}

# Health check
health_check() {
    log_info "Performing health check..."
    sleep 5
    
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        log_info "Health check passed ✓"
    else
        log_warn "Health check failed - check logs with: npm run pm2:logs"
    fi
}

# Show status
show_status() {
    log_info "Application status:"
    pm2 status $APP_NAME
    echo ""
    log_info "View logs with: npm run pm2:logs"
    log_info "Monitor with: pm2 monit"
}

# Main deployment process
main() {
    log_info "Environment: $NODE_ENV"
    log_info "Port: $PORT"
    echo ""
    
    check_pm2
    create_directories
    install_dependencies
    build
    check_running
    start_app
    health_check
    show_status
    
    log_info "🎉 Deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "restart")
        log_info "Restarting application..."
        pm2 restart $APP_NAME
        ;;
    "stop")
        log_info "Stopping application..."
        pm2 stop $APP_NAME
        ;;
    "status")
        pm2 status $APP_NAME
        ;;
    "logs")
        pm2 logs $APP_NAME
        ;;
    *)
        echo "Usage: $0 {deploy|restart|stop|status|logs}"
        exit 1
        ;;
esac