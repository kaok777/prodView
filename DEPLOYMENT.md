# ProdView Deployment Guide

This guide covers deploying ProdView to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [VPS Deployment (Ubuntu/Debian)](#vps-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Environment Configuration](#environment-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Logging](#monitoring-and-logging)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL database (local or managed service like AWS RDS, DigitalOcean Managed DB)
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Production environment variables configured
- [ ] Database backups strategy planned
- [ ] Monitoring solution in place (optional)

### Security Checklist

- [ ] Changed default admin credentials
- [ ] Generated strong JWT_SECRET (min 32 characters)
- [ ] Configured proper CORS origins
- [ ] Set secure database password
- [ ] Disabled unnecessary ports in firewall
- [ ] Configured rate limiting appropriately
- [ ] Reviewed and updated all `.env` values

---

## VPS Deployment

### Prerequisites

- Ubuntu 22.04 LTS or Debian 11+ server
- Root or sudo access
- Minimum 2GB RAM, 2 CPU cores
- 20GB storage minimum

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 2: PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE prodview;
CREATE USER prodview_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE prodview TO prodview_user;
\q
```

### Step 3: Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/prodview
sudo chown -R $USER:$USER /var/www/prodview
cd /var/www/prodview

# Clone repository
git clone <your-repo-url> .

# Setup Backend
cd backend
npm install --production
cp .env.example .env
nano .env  # Configure production variables

# Generate Prisma Client and run migrations
npm run prisma:generate
npm run prisma:deploy

# Seed database (optional)
npm run db:seed

# Build backend
npm run build

# Setup Frontend
cd ..
npm install
cp .env.example .env
nano .env  # Configure production variables

# Build frontend
npm run build
```

### Step 4: PM2 Setup for Backend

```bash
cd /var/www/prodview/backend

# Start backend with PM2
pm2 start dist/main.js --name prodview-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 5: Nginx Configuration

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/prodview
```

Add the following configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images
    location /uploads {
        alias /var/www/prodview/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/prodview/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/prodview /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured by default
# Test renewal:
sudo certbot renew --dry-run
```

---

## Docker Deployment

### Step 1: Create Docker Files

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile** (`Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: prodview
      POSTGRES_USER: prodview_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prodview_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://prodview_user:${DB_PASSWORD}@db:5432/prodview
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 24h
      PORT: 3000
      NODE_ENV: production
      CORS_ORIGIN: ${FRONTEND_URL}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    command: sh -c "npx prisma migrate deploy && npm run start:prod"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      VITE_API_URL: ${API_URL}
    depends_on:
      - backend

volumes:
  postgres_data:
```

**nginx.conf** for frontend:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 2: Deploy with Docker Compose

```bash
# Create .env file for Docker Compose
cat > .env << EOF
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
FRONTEND_URL=http://yourdomain.com
API_URL=http://api.yourdomain.com
EOF

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Environment Configuration

### Production Backend `.env`

```bash
DATABASE_URL="postgresql://prodview_user:SECURE_PASSWORD@localhost:5432/prodview?schema=public"
JWT_SECRET="GENERATE_STRONG_32_CHAR_MIN_SECRET_HERE"
JWT_EXPIRATION="24h"
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
ALLOWED_FILE_EXTENSIONS=".jpg,.jpeg,.png,.gif,.webp"
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="CHANGE_THIS_IMMEDIATELY"
ADMIN_NAME="Admin User"
LOG_LEVEL="info"
```

### Production Frontend `.env`

```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## Database Setup

### Managed Database Services

#### AWS RDS

1. Create PostgreSQL RDS instance
2. Configure security groups to allow backend access
3. Use connection string in DATABASE_URL
4. Enable automated backups
5. Configure Multi-AZ for high availability

#### DigitalOcean Managed Database

1. Create PostgreSQL database cluster
2. Add backend droplet to trusted sources
3. Use connection string provided
4. Enable automatic backups
5. Configure connection pooling

### Database Backup Strategy

```bash
# Manual backup
pg_dump -U prodview_user -h localhost prodview > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * pg_dump -U prodview_user -h localhost prodview > /backups/prodview_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U prodview_user -h localhost prodview < backup_file.sql
```

---

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/prodview
            git pull origin main
            cd backend
            npm install --production
            npm run build
            pm2 restart prodview-backend
            cd ..
            npm install
            npm run build
            sudo systemctl reload nginx
```

---

## Monitoring and Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs prodview-backend

# Monitor resources
pm2 monit

# Install PM2 web dashboard
pm2 install pm2-server-monit
```

### Log Rotation

```bash
# Install logrotate
sudo apt install -y logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/prodview
```

Add:

```
/var/www/prodview/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Health Checks

Add health check endpoint in backend (`src/app.controller.ts`):

```typescript
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

---

## Troubleshooting

### Backend Issues

- Check PM2 logs: `pm2 logs prodview-backend`
- Verify database connection: `psql -U prodview_user -h localhost -d prodview`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Frontend Issues

- Verify build completed: `ls -la dist/`
- Check Nginx access logs: `sudo tail -f /var/log/nginx/access.log`
- Clear browser cache and test

### Database Issues

- Check PostgreSQL status: `sudo systemctl status postgresql`
- View PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
- Test connection: `pg_isready -h localhost -p 5432`

---

## Performance Optimization

1. **Enable Gzip compression in Nginx**
2. **Configure PostgreSQL connection pooling**
3. **Implement Redis caching** (optional)
4. **Use CDN for static assets** (optional)
5. **Enable HTTP/2 in Nginx**
6. **Optimize images before upload**
7. **Implement database query optimization**

---

## Security Hardening

1. Configure firewall (UFW):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

2. Install fail2ban:
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

3. Keep system updated:
```bash
sudo apt update && sudo apt upgrade -y
```

4. Regular security audits:
```bash
npm audit
npm audit fix
```

---

For additional support, refer to the main [README.md](./README.md) or open an issue.
