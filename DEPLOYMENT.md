# Deployment Guide - Bonderud Law Firm API

## 🚀 Production Deployment Guide

### Prerequisites
- Node.js 18+ (for local deployment)
- Docker & Docker Compose (for containerized deployment)
- MongoDB 6.0+
- SSL Certificate (for HTTPS)
- Domain name configured

## 🔧 Environment Configuration

### 1. Create Production Environment File
Create `.env.production` with:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://username:password@localhost:27017/bonderud-law?authSource=admin

# JWT Secrets (Generate strong secrets!)
JWT_SECRET=your-very-long-random-string-here
JWT_REFRESH_SECRET=another-very-long-random-string-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=https://www.bonderudlaw.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Add when ready)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@bonderudlaw.com
SMTP_PASS=your-email-password

# AWS S3 (For file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=bonderud-law-uploads
AWS_REGION=us-east-1
```

### 2. Generate Secure Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📦 Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow official MongoDB installation guide

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/bonderudlaw/api.git
cd api

# Install dependencies
npm ci --only=production

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
pm2 startup
```

#### 3. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'bonderud-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

#### 4. Nginx Configuration
Create `/etc/nginx/sites-available/bonderud-api`:
```nginx
server {
    listen 80;
    server_name api.bonderudlaw.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/bonderud-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Build and Run
```bash
# Build image
docker build -t bonderud-api .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f api
```

#### 2. Update containers
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Option 3: Cloud Deployment

#### AWS EC2
1. Launch EC2 instance (Ubuntu 22.04)
2. Configure security groups (ports 80, 443, 22)
3. Follow Traditional Server Deployment steps
4. Set up Elastic IP
5. Configure Route 53 for domain

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create bonderud-api

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure environment variables
3. Set build command: `npm ci --only=production`
4. Set run command: `node src/server.js`
5. Add MongoDB database

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.bonderudlaw.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs bonderud-api

# Server metrics
pm2 web
```

### 2. Database Monitoring
```bash
# MongoDB monitoring
mongosh
> db.serverStatus()
> db.currentOp()
```

### 3. Log Aggregation
- Use services like:
  - LogDNA
  - Papertrail
  - ELK Stack
  - CloudWatch (AWS)

## 🔄 Backup Strategy

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://..." --out=/backups/mongo-backup-$DATE
find /backups -type d -mtime +7 -exec rm -rf {} +
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * /home/ubuntu/backup-mongo.sh
```

## 🚨 Security Checklist

- [ ] Change all default passwords
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Configure fail2ban
- [ ] Enable SSL/HTTPS
- [ ] Set secure headers
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Set up intrusion detection

## 📈 Performance Optimization

### 1. Database Indexes
```bash
# Check indexes
mongosh
> db.users.getIndexes()
> db.attorneys.getIndexes()
```

### 2. Caching
- Add Redis for session storage
- Implement API response caching
- Use CDN for static assets

### 3. Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api.bonderudlaw.com/api/v1/attorneys
```

## 🔧 Maintenance

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm test
```

### Database Maintenance
```bash
# Compact database
mongosh
> db.runCommand({ compact: 'attorneys' })

# Rebuild indexes
> db.attorneys.reIndex()
```

## 📞 Support & Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB service: `sudo systemctl status mongod`
   - Verify connection string
   - Check firewall rules

2. **Port Already in Use**
   - Find process: `lsof -i :5000`
   - Kill process: `kill -9 <PID>`

3. **Memory Issues**
   - Increase swap: `sudo fallocate -l 4G /swapfile`
   - Monitor memory: `free -h`

### Health Checks
```bash
# API health
curl https://api.bonderudlaw.com/health

# Database health
mongosh --eval "db.adminCommand('ping')"
```

## 🎯 Post-Deployment

1. **Test all endpoints**
   ```bash
   ./test-api.sh
   ```

2. **Monitor logs**
   ```bash
   tail -f logs/app-*.log
   ```

3. **Set up alerts**
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Error tracking (Sentry)
   - Performance monitoring (New Relic, DataDog)

4. **Documentation**
   - Update API docs
   - Share credentials securely
   - Document custom configurations

---

**Last Updated**: January 2025  
**Version**: 1.0.0