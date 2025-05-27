# Bonderud Law Firm API - Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage > 80%
- [ ] No ESLint errors or warnings
- [ ] No security vulnerabilities (`npm audit`)
- [ ] All TODO comments addressed
- [ ] Code reviewed and approved
- [ ] Version number updated in package.json

### 2. Security Audit
- [ ] Environment variables secured
- [ ] JWT secrets are strong (min 32 chars)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled and configured
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention tested
- [ ] XSS protection enabled
- [ ] CSRF protection configured
- [ ] File upload restrictions in place
- [ ] Sensitive data encryption enabled

### 3. Database Preparation
- [ ] Production MongoDB cluster configured
- [ ] Database indexes created
- [ ] Backup strategy implemented
- [ ] Replica set configured
- [ ] Connection pooling optimized
- [ ] Migration scripts tested
- [ ] Initial admin user created
- [ ] Database monitoring enabled

### 4. Performance Optimization
- [ ] API response compression enabled
- [ ] Static assets served via CDN
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Connection pooling configured
- [ ] Memory usage profiled
- [ ] Load testing completed
- [ ] Response time targets met

### 5. Infrastructure Setup
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] Health check endpoints working
- [ ] Monitoring alerts configured
- [ ] Logging aggregation setup
- [ ] Backup automation configured

## Environment Configuration

### Production Environment Variables
```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bonderud-law?retryWrites=true&w=majority
MONGODB_OPTIONS_MAX_POOL_SIZE=50
MONGODB_OPTIONS_MIN_POOL_SIZE=10

# Security
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-different-strong-secret>
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://bonderudlaw.com,https://www.bonderudlaw.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
EMAIL_FROM=noreply@bonderudlaw.com
EMAIL_REPLY_TO=info@bonderudlaw.com

# File Upload
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_DESTINATION=./uploads

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=bonderud-law-assets

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_LICENSE_KEY=<new-relic-key>
LOGGLY_TOKEN=<loggly-token>

# Google Services
GOOGLE_RECAPTCHA_SECRET_KEY=<recaptcha-secret>
GOOGLE_ANALYTICS_ID=<ga-tracking-id>

# Payment Gateway (if needed)
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>

# Redis (for sessions/caching)
REDIS_URL=redis://username:password@redis-server:6379
REDIS_TTL=3600

# Backup
BACKUP_ENCRYPTION_KEY=<backup-encryption-key>
BACKUP_S3_BUCKET=bonderud-law-backups
```

## Deployment Steps

### 1. Server Setup (Ubuntu 20.04 LTS)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/bonderud-law/api.git /var/www/bonderud-api
cd /var/www/bonderud-api

# Install dependencies
npm ci --production

# Create required directories
mkdir -p logs uploads

# Set permissions
sudo chown -R www-data:www-data /var/www/bonderud-api
sudo chmod -R 755 /var/www/bonderud-api

# Copy environment file
cp .env.production .env

# Run database migrations
npm run migrate:prod

# Seed initial data
npm run seed:prod
```

### 3. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bonderud-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration
```nginx
# /etc/nginx/sites-available/bonderud-api
server {
    listen 80;
    server_name api.bonderudlaw.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bonderudlaw.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.bonderudlaw.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bonderudlaw.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API Configuration
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location /uploads {
        alias /var/www/bonderud-api/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/bonderud-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate
```bash
sudo certbot --nginx -d api.bonderudlaw.com
```

## Monitoring Setup

### 1. Application Monitoring (PM2)
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Monitor metrics
pm2 monit
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup CloudWatch agent (AWS)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### 3. Database Monitoring
```javascript
// MongoDB monitoring user
use admin
db.createUser({
  user: "monitoring",
  pwd: "secure_password",
  roles: [
    { role: "clusterMonitor", db: "admin" },
    { role: "read", db: "bonderud-law" }
  ]
})
```

### 4. Health Check Endpoint
```javascript
// src/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'healthy',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
  
  try {
    await mongoose.connection.db.admin().ping();
  } catch (error) {
    health.checks.database = 'unhealthy';
    res.status(503);
  }
  
  res.json(health);
});
```

## Backup Strategy

### 1. Database Backup Script
```bash
#!/bin/bash
# /home/ubuntu/scripts/backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
S3_BUCKET="bonderud-law-backups"

# Create backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb-$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb-$DATE.tar.gz" "$BACKUP_DIR/mongodb-$DATE"

# Upload to S3
aws s3 cp "$BACKUP_DIR/mongodb-$DATE.tar.gz" "s3://$S3_BUCKET/mongodb/"

# Clean up local files older than 7 days
find "$BACKUP_DIR" -name "mongodb-*.tar.gz" -mtime +7 -delete
```

### 2. Automated Backup Cron
```bash
# Add to crontab
0 2 * * * /home/ubuntu/scripts/backup-mongodb.sh >> /home/ubuntu/logs/backup.log 2>&1
```

## Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban Setup
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for API
cat > /etc/fail2ban/filter.d/bonderud-api.conf << EOF
[Definition]
failregex = ^<HOST> .* 401 .*$
            ^<HOST> .* 403 .*$
ignoreregex =
EOF

cat > /etc/fail2ban/jail.d/bonderud-api.conf << EOF
[bonderud-api]
enabled = true
port = http,https
filter = bonderud-api
logpath = /var/www/bonderud-api/logs/access.log
maxretry = 10
findtime = 600
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

## Post-Deployment Verification

### 1. API Testing
```bash
# Test health endpoint
curl https://api.bonderudlaw.com/api/health

# Test API endpoints
curl -X POST https://api.bonderudlaw.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### 2. Performance Testing
```bash
# Run load test
artillery run tests/load/production-test.yml
```

### 3. Security Testing
```bash
# SSL test
nmap --script ssl-cert,ssl-enum-ciphers -p 443 api.bonderudlaw.com

# Security headers test
curl -I https://api.bonderudlaw.com
```

## Rollback Plan

### 1. Quick Rollback
```bash
# Tag current release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Rollback procedure
cd /var/www/bonderud-api
git fetch --tags
git checkout v0.9.0  # Previous version
npm ci --production
pm2 restart all
```

### 2. Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --drop backup/mongodb-20240115_020000/
```

## Maintenance Mode

### 1. Enable Maintenance
```nginx
# Add to nginx config
location / {
    if (-f /var/www/maintenance.flag) {
        return 503;
    }
    # ... existing proxy config
}

error_page 503 @maintenance;
location @maintenance {
    rewrite ^(.*)$ /maintenance.html break;
}
```

### 2. Maintenance Page
```html
<!-- /var/www/maintenance.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - Bonderud Law Firm</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>We'll be back soon!</h1>
    <p>We're performing scheduled maintenance. Please check back in a few minutes.</p>
    <p>If you need immediate assistance, please call (555) 123-4567</p>
</body>
</html>
```

## Disaster Recovery

### 1. Recovery Time Objectives
- RTO (Recovery Time Objective): 2 hours
- RPO (Recovery Point Objective): 1 hour

### 2. Incident Response Plan
1. Identify and assess the incident
2. Activate maintenance mode
3. Notify stakeholders
4. Execute recovery procedure
5. Verify system functionality
6. Document incident and resolution

### 3. Contact Information
- DevOps Lead: [Name] - [Phone]
- Database Admin: [Name] - [Phone]
- Security Lead: [Name] - [Phone]
- Business Owner: [Name] - [Phone]

## Final Checklist

### Before Going Live
- [ ] All items in pre-deployment checklist completed
- [ ] Production environment fully configured
- [ ] SSL certificates working
- [ ] Monitoring and alerts configured
- [ ] Backup automation verified
- [ ] Load testing passed
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Team trained on deployment procedures
- [ ] Rollback plan tested

### After Going Live
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup execution
- [ ] Review security logs
- [ ] Test all critical endpoints
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Schedule post-deployment review

## Support Resources

- **Documentation**: [Internal Wiki URL]
- **Monitoring Dashboard**: [Dashboard URL]
- **Log Aggregation**: [Logs URL]
- **Error Tracking**: [Sentry URL]
- **Performance Monitoring**: [New Relic URL]

---

Last Updated: January 2025
Version: 1.0.0