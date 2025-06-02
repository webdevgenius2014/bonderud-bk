#!/bin/bash

# Server Setup Script for Bonderud Law API
# Run this on a fresh Ubuntu server

set -e

echo "🔧 Setting up server for Bonderud Law API..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
log_info "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
log_info "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
log_info "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
log_info "Installing Nginx..."
sudo apt install -y nginx

# Install Git
log_info "Installing Git..."
sudo apt install -y git

# Create app user
log_info "Creating application user..."
sudo useradd -m -s /bin/bash bonderud || true
sudo usermod -aG sudo bonderud

# Setup firewall
log_info "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create app directory
log_info "Creating application directory..."
sudo mkdir -p /var/www/bonderud-api
sudo chown bonderud:bonderud /var/www/bonderud-api

log_info "✅ Server setup completed!"
log_info "Next steps:"
echo "1. Switch to app user: sudo su - bonderud"
echo "2. Clone repository: git clone <your-repo> /var/www/bonderud-api"
echo "3. Setup environment: cp .env.example .env.production"
echo "4. Deploy: npm run deploy"