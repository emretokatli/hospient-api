# AWS EC2 Deployment Guide - Hospient API Project

## Table of Contents
1. [Initial Server Setup](#initial-server-setup)
2. [Project File Transfer and Setup](#project-file-transfer-and-setup)
3. [Database Configuration](#database-configuration)
4. [Domain Configuration](#domain-configuration)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [PM2 Process Management](#pm2-process-management)
8. [Environment Configurations](#environment-configurations)
9. [Troubleshooting](#troubleshooting)
10. [AWS Route 53 Subdomain Configuration](#aws-route-53-subdomain-configuration)

---

## Initial Server Setup

### AWS EC2 Instance Details
- **Instance Type**: Ubuntu Server
- **IP Address**: 18.205.158.139
- **SSH Access**: Use PuTTY with your private key
- **User**: ubuntu

### Required Software Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Git (if needed)
sudo apt install git -y
```

---

## Project File Transfer and Setup

### Method 1: Using SCP (Secure Copy) - Recommended for Windows

#### Prerequisites
- Your project files should be compressed into a ZIP or TAR file
- You should have your EC2 private key (.pem or .ppk file)
- For Windows users: Install WinSCP or use built-in PowerShell SCP

#### Step 1: Prepare Your Project Locally
```bash
# On your local machine, navigate to your project directory
cd /path/to/your/hospient-api-project

# Create a compressed archive (choose one method):
# Method A: ZIP file
zip -r hospient-api.zip . -x "node_modules/*" ".git/*" "*.log"

# Method B: TAR.GZ file (more efficient)
tar -czf hospient-api.tar.gz --exclude=node_modules --exclude=.git --exclude="*.log" .
```

#### Step 2: Transfer Files Using SCP

**For Windows (PowerShell/Command Prompt):**
```bash
# Using SCP with PEM key
scp -i "C:\path\to\your\key.pem" hospient-api.tar.gz ubuntu@18.205.158.139:/home/ubuntu/

# Or using WinSCP (GUI method):
# 1. Open WinSCP
# 2. New Session
# 3. File protocol: SCP
# 4. Host name: 18.205.158.139
# 5. User name: ubuntu
# 6. Private key file: Browse to your .ppk key
# 7. Connect and drag/drop files
```

**For Linux/Mac:**
```bash
# Using SCP
scp -i ~/.ssh/your-key.pem hospient-api.tar.gz ubuntu@18.205.158.139:/home/ubuntu/
```

#### Step 3: Extract and Set Up Project on Server
```bash
# SSH into your server
ssh -i your-key.pem ubuntu@18.205.158.139

# Navigate to home directory
cd /home/ubuntu

# Extract the project files
tar -xzf hospient-api.tar.gz -C . || unzip hospient-api.zip

# Create proper directory structure for live environment
sudo mkdir -p /var/www/api.hospient.com
sudo mkdir -p /var/www/admin.hospient.com
sudo mkdir -p /var/www/app.hospient.com

# Create directory structure for test environment
sudo mkdir -p /var/www/api-test.hospient.com
sudo mkdir -p /var/www/admin-test.hospient.com
sudo mkdir -p /var/www/app-test.hospient.com

# Copy project files to live API directory
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api.hospient.com/

# Copy project files to test API directory
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api-test.hospient.com/

# Set proper ownership
sudo chown -R ubuntu:ubuntu /var/www/api.hospient.com
sudo chown -R ubuntu:ubuntu /var/www/api-test.hospient.com

# Set proper permissions
sudo chmod -R 755 /var/www/api.hospient.com
sudo chmod -R 755 /var/www/api-test.hospient.com
```

### Method 2: Using Git Clone (Recommended for Version Control)

#### Prerequisites
- Your project should be in a Git repository (GitHub, GitLab, Bitbucket, etc.)
- You should have access to the repository

#### Step 1: SSH into Your Server
```bash
# SSH into your server
ssh -i your-key.pem ubuntu@18.205.158.139
```

#### Step 2: Clone Repository
```bash
# Navigate to home directory
cd /home/ubuntu

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/hospient-api.git

# Or if using SSH keys:
git clone git@github.com:yourusername/hospient-api.git

# Or if using a specific branch:
git clone -b main https://github.com/yourusername/hospient-api.git

# Navigate into the project
cd hospient-api
```

#### Step 3: Set Up Directory Structure
```bash
# Create proper directory structure for live environment
sudo mkdir -p /var/www/api.hospient.com
sudo mkdir -p /var/www/admin.hospient.com
sudo mkdir -p /var/www/app.hospient.com

# Create directory structure for test environment
sudo mkdir -p /var/www/api-test.hospient.com
sudo mkdir -p /var/www/admin-test.hospient.com
sudo mkdir -p /var/www/app-test.hospient.com

# Copy project files to live API directory
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api.hospient.com/
sudo cp -r /home/ubuntu/hospient-api/.* /var/www/api.hospient.com/ 2>/dev/null || true

# Copy project files to test API directory
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api-test.hospient.com/
sudo cp -r /home/ubuntu/hospient-api/.* /var/www/api-test.hospient.com/ 2>/dev/null || true

# Set proper ownership
sudo chown -R ubuntu:ubuntu /var/www/api.hospient.com
sudo chown -R ubuntu:ubuntu /var/www/api-test.hospient.com

# Set proper permissions
sudo chmod -R 755 /var/www/api.hospient.com
sudo chmod -R 755 /var/www/api-test.hospient.com
```

### Method 3: Using RSYNC (Advanced)

#### For Continuous Deployment
```bash
# From your local machine, sync files with server
rsync -avz -e "ssh -i your-key.pem" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.log' \
  /local/path/to/hospient-api/ \
  ubuntu@18.205.158.139:/home/ubuntu/hospient-api/
```

### Project Setup Commands

#### Step 4: Install Dependencies and Configure
```bash
# Navigate to live API directory
cd /var/www/api.hospient.com

# Install production dependencies
npm install --production

# Create .env file for live environment
sudo nano .env
```

**Add the following content to .env:**
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db
API_URL=https://api.hospient.com
ADMIN_URL=https://admin.hospient.com
APP_URL=https://app.hospient.com
MAIN_URL=https://hospient.com
```

#### Step 5: Set Up Test Environment
```bash
# Navigate to test API directory
cd /var/www/api-test.hospient.com

# Install all dependencies (including dev dependencies for testing)
npm install

# Create .env file for test environment
sudo nano .env
```

**Add the following content to test .env:**
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db_test
API_URL=https://api-test.hospient.com
ADMIN_URL=https://admin-test.hospient.com
APP_URL=https://app-test.hospient.com
MAIN_URL=https://test.hospient.com
```

### Essential Configuration Files Creation

#### Step 6: Create PM2 Ecosystem Files

**Live Environment PM2 Config:**
```bash
# Create ecosystem config for live environment
cd /var/www/api.hospient.com
sudo nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'hospient-api-live',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

**Test Environment PM2 Config:**
```bash
# Create ecosystem config for test environment
cd /var/www/api-test.hospient.com
sudo nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'hospient-api-test',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      }
    }
  ]
};
```

#### Step 7: Verify Project Structure
```bash
# Check live environment structure
ls -la /var/www/api.hospient.com/

# Check test environment structure
ls -la /var/www/api-test.hospient.com/

# Verify package.json exists
cat /var/www/api.hospient.com/package.json

# Check if src/index.js exists (main entry point)
ls -la /var/www/api.hospient.com/src/
```

### File Permission Setup

#### Step 8: Set Correct Permissions
```bash
# Set ownership for all www directories
sudo chown -R ubuntu:ubuntu /var/www/

# Set directory permissions
sudo find /var/www/ -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/ -type f -exec chmod 644 {} \;

# Make specific files executable if needed
sudo chmod +x /var/www/api.hospient.com/src/index.js
sudo chmod +x /var/www/api-test.hospient.com/src/index.js

# Set special permissions for log directories (if they exist)
sudo mkdir -p /var/www/api.hospient.com/logs
sudo mkdir -p /var/www/api-test.hospient.com/logs
sudo chmod 755 /var/www/api.hospient.com/logs
sudo chmod 755 /var/www/api-test.hospient.com/logs
```

### Quick Setup Script

#### Create an Automated Setup Script
```bash
# Create a setup script for faster deployment
sudo nano /home/ubuntu/setup-project.sh
```

**Add this content:**
```bash
#!/bin/bash

echo "Starting Hospient API Project Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if project files exist
if [ ! -d "/home/ubuntu/hospient-api" ]; then
    print_error "Project directory not found. Please upload or clone your project first."
    exit 1
fi

print_status "Creating directory structure..."

# Create directories
sudo mkdir -p /var/www/api.hospient.com
sudo mkdir -p /var/www/admin.hospient.com
sudo mkdir -p /var/www/app.hospient.com
sudo mkdir -p /var/www/api-test.hospient.com
sudo mkdir -p /var/www/admin-test.hospient.com
sudo mkdir -p /var/www/app-test.hospient.com

print_status "Copying project files..."

# Copy files
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api.hospient.com/
sudo cp -r /home/ubuntu/hospient-api/* /var/www/api-test.hospient.com/

print_status "Setting permissions..."

# Set ownership and permissions
sudo chown -R ubuntu:ubuntu /var/www/api.hospient.com
sudo chown -R ubuntu:ubuntu /var/www/api-test.hospient.com
sudo chmod -R 755 /var/www/api.hospient.com
sudo chmod -R 755 /var/www/api-test.hospient.com

print_status "Installing dependencies for live environment..."

# Install dependencies for live
cd /var/www/api.hospient.com
npm install --production

print_status "Installing dependencies for test environment..."

# Install dependencies for test
cd /var/www/api-test.hospient.com
npm install

print_status "Creating environment files..."

# Create .env for live
cat > /var/www/api.hospient.com/.env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db
API_URL=https://api.hospient.com
ADMIN_URL=https://admin.hospient.com
APP_URL=https://app.hospient.com
MAIN_URL=https://hospient.com
EOF

# Create .env for test
cat > /var/www/api-test.hospient.com/.env << EOF
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db_test
API_URL=https://api-test.hospient.com
ADMIN_URL=https://admin-test.hospient.com
APP_URL=https://app-test.hospient.com
MAIN_URL=https://test.hospient.com
EOF

print_status "Creating PM2 ecosystem files..."

# Create PM2 config for live
cat > /var/www/api.hospient.com/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'hospient-api-live',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

# Create PM2 config for test
cat > /var/www/api-test.hospient.com/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'hospient-api-test',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      }
    }
  ]
};
EOF

print_status "Project setup completed successfully!"
print_warning "Next steps:"
echo "1. Configure your database (see Database Configuration section)"
echo "2. Run database migrations"
echo "3. Set up Nginx configuration"
echo "4. Start PM2 processes"

echo -e "${GREEN}Setup script finished!${NC}"
```

**Make the script executable:**
```bash
chmod +x /home/ubuntu/setup-project.sh
```

**Run the setup script:**
```bash
sudo /home/ubuntu/setup-project.sh
```

### Verification Commands

#### Step 9: Verify Everything is Set Up Correctly
```bash
# Check if all directories exist
ls -la /var/www/

# Verify project files are in place
ls -la /var/www/api.hospient.com/
ls -la /var/www/api-test.hospient.com/

# Check if package.json exists
cat /var/www/api.hospient.com/package.json | grep name

# Verify environment files
cat /var/www/api.hospient.com/.env
cat /var/www/api-test.hospient.com/.env

# Check PM2 ecosystem files
cat /var/www/api.hospient.com/ecosystem.config.js
cat /var/www/api-test.hospient.com/ecosystem.config.js

# Test if Node.js can find the main file
node -e "console.log('Testing Node.js...')" && echo "Node.js is working!"

# Check if dependencies are installed
ls -la /var/www/api.hospient.com/node_modules/ | head
ls -la /var/www/api-test.hospient.com/node_modules/ | head
```

### Common File Transfer Issues and Solutions

#### Issue 1: Permission Denied
```bash
# Solution: Use sudo or fix ownership
sudo chown -R ubuntu:ubuntu /var/www/
```

#### Issue 2: Files Not Found After Transfer
```bash
# Solution: Check hidden files
ls -la /var/www/api.hospient.com/
# Make sure .env and other dot files are transferred
```

#### Issue 3: Node Modules Issues
```bash
# Solution: Clean install
cd /var/www/api.hospient.com
rm -rf node_modules package-lock.json
npm install --production

cd /var/www/api-test.hospient.com
rm -rf node_modules package-lock.json
npm install
```

#### Issue 4: Git Clone Permission Issues
```bash
# Solution: Use HTTPS instead of SSH for public repos
git clone https://github.com/username/repo.git

# Or set up SSH keys for private repos
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# Add the public key to your Git provider
```

---

## Database Configuration

### MySQL Setup
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE hospient_db_test;
CREATE USER 'superadmin'@'localhost' IDENTIFIED BY 'MelisEnes2404!!';
GRANT ALL PRIVILEGES ON hospient_db_test.* TO 'superadmin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Database Configuration File
File: `config/config.json`
```json
{
  "development": {
    "username": "superadmin",
    "password": "MelisEnes2404!!",
    "database": "hospient_db",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "superadmin",
    "password": "MelisEnes2404!!",
    "database": "hospient_db_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "superadmin",
    "password": "MelisEnes2404!!",
    "database": "hospient_db",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

---

## Domain Configuration

### DNS Records Setup

#### Live Environment DNS Records
Configure these A records at your domain registrar for `hospient.com`:

| Type | Name | Value | TTL |
|------|------|--------|-----|
| A | @ | 18.205.158.139 | 300 |
| A | api | 18.205.158.139 | 300 |
| A | admin | 18.205.158.139 | 300 |
| A | app | 18.205.158.139 | 300 |
| CNAME | www | hospient.com | 300 |

#### Test Environment DNS Records
| Type | Name | Value | TTL |
|------|------|--------|-----|
| A | test | 18.205.158.139 | 300 |
| A | api-test | 18.205.158.139 | 300 |
| A | admin-test | 18.205.158.139 | 300 |
| A | app-test | 18.205.158.139 | 300 |

### DNS Verification
```bash
# Check DNS propagation
nslookup hospient.com
nslookup api.hospient.com
nslookup admin.hospient.com
nslookup app.hospient.com
nslookup test.hospient.com
nslookup api-test.hospient.com
nslookup admin-test.hospient.com
nslookup app-test.hospient.com
```

---

## Nginx Configuration

### Directory Structure Setup
```bash
# Create directory structure for Live Environment
sudo mkdir -p /var/www/hospient.com
sudo mkdir -p /var/www/api.hospient.com
sudo mkdir -p /var/www/admin.hospient.com
sudo mkdir -p /var/www/app.hospient.com

# Create directory structure for Test Environment
sudo mkdir -p /var/www/test.hospient.com
sudo mkdir -p /var/www/api-test.hospient.com
sudo mkdir -p /var/www/admin-test.hospient.com
sudo mkdir -p /var/www/app-test.hospient.com

# Set proper ownership
sudo chown -R www-data:www-data /var/www/
```

### Live Environment Nginx Configurations

#### Main Site Configuration
File: `/etc/nginx/sites-available/hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name hospient.com www.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name hospient.com www.hospient.com;

    ssl_certificate /etc/letsencrypt/live/hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Optional: Redirect to app subdomain
    # location / {
    #     return 301 https://app.hospient.com$request_uri;
    # }
}
```

#### API Configuration
File: `/etc/nginx/sites-available/api.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/api.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name api.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.hospient.com;

    ssl_certificate /etc/letsencrypt/live/api.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/api.hospient.com;
    index index.html index.htm index.nginx-debian.html;

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
}
```

#### Admin Configuration
File: `/etc/nginx/sites-available/admin.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/admin.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name admin.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.hospient.com;

    ssl_certificate /etc/letsencrypt/live/admin.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:3001;
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

#### App Configuration
File: `/etc/nginx/sites-available/app.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/app.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name app.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name app.hospient.com;

    ssl_certificate /etc/letsencrypt/live/app.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/app.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:3002;
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

### Test Environment Nginx Configurations

#### Test Main Site Configuration
File: `/etc/nginx/sites-available/test.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/test.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Test API Configuration
File: `/etc/nginx/sites-available/api-test.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/api-test.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name api-test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/api-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/api-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4000;
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

#### Test Admin Configuration
File: `/etc/nginx/sites-available/admin-test.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/admin-test.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name admin-test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/admin-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4001;
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

#### Test App Configuration
File: `/etc/nginx/sites-available/app-test.hospient.com`

**Create the file:**
```bash
sudo nano /etc/nginx/sites-available/app-test.hospient.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name app-test.hospient.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name app-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/app-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/app-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
```

### Quick Script to Create All Nginx Files

**Create all files at once with this script:**
```bash
# Create a script to generate all nginx configs
sudo nano /home/ubuntu/create-nginx-configs.sh
```

**Add this content to the script:**
```bash
#!/bin/bash

echo "Creating all Nginx configuration files..."

# Create Live Environment configs
sudo tee /etc/nginx/sites-available/hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name hospient.com www.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name hospient.com www.hospient.com;

    ssl_certificate /etc/letsencrypt/live/hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

sudo tee /etc/nginx/sites-available/api.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name api.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.hospient.com;

    ssl_certificate /etc/letsencrypt/live/api.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/api.hospient.com;
    index index.html index.htm index.nginx-debian.html;

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
}
EOF

sudo tee /etc/nginx/sites-available/admin.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name admin.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.hospient.com;

    ssl_certificate /etc/letsencrypt/live/admin.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:3001;
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
EOF

sudo tee /etc/nginx/sites-available/app.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name app.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name app.hospient.com;

    ssl_certificate /etc/letsencrypt/live/app.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/app.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:3002;
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
EOF

# Create Test Environment configs
sudo tee /etc/nginx/sites-available/test.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

sudo tee /etc/nginx/sites-available/api-test.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name api-test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/api-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/api-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4000;
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
EOF

sudo tee /etc/nginx/sites-available/admin-test.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name admin-test.hospient.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/admin-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4001;
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
EOF

sudo tee /etc/nginx/sites-available/app-test.hospient.com > /dev/null <<EOF
server {
    listen 80;
    server_name app-test.hospient.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name app-test.hospient.com;

    ssl_certificate /etc/letsencrypt/live/app-test.hospient.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app-test.hospient.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/app-test.hospient.com;
    index index.html index.htm index.nginx-debian.html;

    location / {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo "All Nginx configuration files created successfully!"
echo "Next steps:"
echo "1. Enable the sites"
echo "2. Test nginx configuration"
echo "3. Reload nginx"
```

**Make the script executable and run it:**
```bash
chmod +x /home/ubuntu/create-nginx-configs.sh
sudo /home/ubuntu/create-nginx-configs.sh
```

### Enable Nginx Sites
```bash
# Enable Live Environment sites
sudo ln -s /etc/nginx/sites-available/hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app.hospient.com /etc/nginx/sites-enabled/

# Enable Test Environment sites
sudo ln -s /etc/nginx/sites-available/test.hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api-test.hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin-test.hospient.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app-test.hospient.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### Stop Nginx for Certificate Generation
```bash
sudo systemctl stop nginx
```

### Generate SSL Certificates for Live Environment
```bash
# Main site
sudo certbot certonly --standalone -d hospient.com -d www.hospient.com

# API
sudo certbot certonly --standalone -d api.hospient.com

# Admin
sudo certbot certonly --standalone -d admin.hospient.com

# App
sudo certbot certonly --standalone -d app.hospient.com
```

### Generate SSL Certificates for Test Environment
```bash
# Test site
sudo certbot certonly --standalone -d test.hospient.com

# Test API
sudo certbot certonly --standalone -d api-test.hospient.com

# Test Admin
sudo certbot certonly --standalone -d admin-test.hospient.com

# Test App
sudo certbot certonly --standalone -d app-test.hospient.com
```

### Start Nginx
```bash
sudo systemctl start nginx
```

### Auto-renewal Setup
```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## PM2 Process Management

### Live Environment PM2 Configuration
File: `/var/www/api.hospient.com/ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'hospient-api-live',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'hospient-admin-live',
      script: 'src/index.js',
      cwd: '/var/www/admin.hospient.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'hospient-app-live',
      script: 'src/index.js',
      cwd: '/var/www/app.hospient.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
```

### Test Environment PM2 Configuration
File: `/var/www/api-test.hospient.com/ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'hospient-api-test',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      }
    },
    {
      name: 'hospient-admin-test',
      script: 'src/index.js',
      cwd: '/var/www/admin-test.hospient.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4001
      }
    },
    {
      name: 'hospient-app-test',
      script: 'src/index.js',
      cwd: '/var/www/app-test.hospient.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4002
      }
    }
  ]
};
```

### PM2 Commands
```bash
# Start all applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Environment Configurations

### Port Assignments

#### Live Environment
- **Main Site**: Static files (Nginx serves directly)
- **API**: Port 3000 → `api.hospient.com`
- **Admin**: Port 3001 → `admin.hospient.com`
- **App**: Port 3002 → `app.hospient.com`

#### Test Environment
- **Test Site**: Static files (Nginx serves directly)
- **API Test**: Port 4000 → `api-test.hospient.com`
- **Admin Test**: Port 4001 → `admin-test.hospient.com`
- **App Test**: Port 4002 → `app-test.hospient.com`

### Environment Variables

#### Live Environment (.env)
File: `/var/www/api.hospient.com/.env`
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db
API_URL=https://api.hospient.com
ADMIN_URL=https://admin.hospient.com
APP_URL=https://app.hospient.com
MAIN_URL=https://hospient.com
```

#### Test Environment (.env)
File: `/var/www/api-test.hospient.com/.env`
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!
DB_NAME=hospient_db_test
API_URL=https://api-test.hospient.com
ADMIN_URL=https://admin-test.hospient.com
APP_URL=https://app-test.hospient.com
MAIN_URL=https://test.hospient.com
```

### Database Setup for Test Environment
```bash
# Create test database
sudo mysql -u root -p

CREATE DATABASE hospient_db_test;
GRANT ALL PRIVILEGES ON hospient_db_test.* TO 'superadmin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Deployment Scripts

### Live Deployment Script
File: `/home/ubuntu/deploy-live.sh`
```bash
#!/bin/bash

echo "Starting Live Environment Deployment..."

# Navigate to API directory
cd /var/www/api.hospient.com

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npx sequelize-cli db:migrate

# Restart PM2 processes
pm2 restart hospient-api-live
pm2 restart hospient-admin-live
pm2 restart hospient-app-live

echo "Live deployment completed!"
```

### Test Deployment Script
File: `/home/ubuntu/deploy-test.sh`
```bash
#!/bin/bash

echo "Starting Test Environment Deployment..."

# Navigate to API directory
cd /var/www/api-test.hospient.com

# Pull latest changes
git pull origin develop

# Install dependencies
npm install

# Run database migrations
npx sequelize-cli db:migrate

# Restart PM2 processes
pm2 restart hospient-api-test
pm2 restart hospient-admin-test
pm2 restart hospient-app-test

echo "Test deployment completed!"
```

### Make scripts executable
```bash
chmod +x /home/ubuntu/deploy-live.sh
chmod +x /home/ubuntu/deploy-test.sh
```

---

## Firewall Configuration

### UFW Setup
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow specific ports for testing (optional)
sudo ufw allow 3000:4002/tcp

# Check status
sudo ufw status
```

---

## Monitoring and Logs

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs for specific app
pm2 logs hospient-api-live
pm2 logs hospient-api-test

# View error logs only
pm2 logs --err

# Clear logs
pm2 flush
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Site-specific logs (if configured)
sudo tail -f /var/log/nginx/api.hospient.com.access.log
sudo tail -f /var/log/nginx/api.hospient.com.error.log
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop

# Check system logs
sudo journalctl -f
```

---

## Backup Strategy

### Database Backup Script
File: `/home/ubuntu/backup-db.sh`
```bash
#!/bin/bash

# Create backup directory
mkdir -p /home/ubuntu/backups

# Backup live database
mysqldump -u superadmin -p'MelisEnes2404!!' hospient_db > /home/ubuntu/backups/hospient_db_$(date +%Y%m%d_%H%M%S).sql

# Backup test database
mysqldump -u superadmin -p'MelisEnes2404!!' hospient_db_test > /home/ubuntu/backups/hospient_db_test_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days of backups
find /home/ubuntu/backups -name "*.sql" -mtime +7 -delete

echo "Database backup completed!"
```

### Automated Backup (Crontab)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/ubuntu/backup-db.sh
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Nginx Configuration Errors
```bash
# Test configuration
sudo nginx -t

# Check for syntax errors
sudo nginx -T

# Restart nginx
sudo systemctl restart nginx
```

#### 2. PM2 Process Issues
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs --lines 100

# Restart specific process
pm2 restart hospient-api-live

# Delete and restart
pm2 delete hospient-api-live
pm2 start ecosystem.config.js --only hospient-api-live
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### 4. Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test database connection
mysql -u superadmin -p'MelisEnes2404!!' hospient_db

# Check database permissions
SHOW GRANTS FOR 'superadmin'@'localhost';
```

#### 5. Port Conflicts
```bash
# Check what's running on specific ports
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :4000

# Kill process on specific port
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Useful Commands

#### System Information
```bash
# Check system resources
top
htop
df -h
free -h

# Check network connections
netstat -tulpn
ss -tulpn

# Check system logs
sudo journalctl -u nginx
sudo journalctl -u mysql
```

#### File Permissions
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/

# Fix permissions
sudo find /var/www/ -type d -exec chmod 755 {} \;
sudo find /var/www/ -type f -exec chmod 644 {} \;
```

---

## Security Considerations

### 1. Firewall Rules
- Only allow necessary ports (22, 80, 443)
- Consider changing default SSH port
- Use key-based authentication only

### 2. Database Security
- Use strong passwords
- Limit database user privileges
- Regular security updates

### 3. Application Security
- Keep Node.js and npm packages updated
- Use environment variables for sensitive data
- Implement proper input validation
- Set up proper CORS policies

### 4. Server Security
- Regular system updates
- Monitor logs for suspicious activity
- Use fail2ban for SSH protection
- Regular backups

---

## Testing URLs

### Live Environment
- Main Site: https://hospient.com
- API Documentation: https://api.hospient.com/api-docs/
- Admin Panel: https://admin.hospient.com
- Main App: https://app.hospient.com

### Test Environment
- Test Site: https://test.hospient.com
- Test API Documentation: https://api-test.hospient.com/api-docs/
- Test Admin Panel: https://admin-test.hospient.com
- Test App: https://app-test.hospient.com

---

## Contact Information

**Server Details:**
- IP: 18.205.158.139
- SSH User: ubuntu
- Database User: superadmin
- Database Password: MelisEnes2404!!

**Domain:** hospient.com
**Registrar:** [Your Domain Registrar]

---

*Last Updated: [Current Date]*
*Document Version: 1.0*

---

## AWS Route 53 Subdomain Configuration

### Overview
Since you're using AWS Route 53 for DNS management, you can create all subdomains directly in the AWS Console. This is much more reliable and faster than traditional domain registrars.

### Accessing Route 53
1. Log into your AWS Console
2. Navigate to **Route 53** service
3. Click on **Hosted zones**
4. Select your **hospient.com** hosted zone

### Required DNS Records

You need to create the following A records in your `hospient.com` hosted zone:

#### Live Environment Records
- `hospient.com` (root domain)
- `www.hospient.com`
- `api.hospient.com`
- `admin.hospient.com`
- `app.hospient.com`

#### Test Environment Records
- `test.hospient.com`
- `api-test.hospient.com`
- `admin-test.hospient.com`
- `app-test.hospient.com`

### Step-by-Step Record Creation

#### 1. Create Root Domain Record (hospient.com)
```
Record Name: (leave empty for root domain)
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

#### 2. Create WWW Subdomain
```
Record Name: www
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

#### 3. Create API Subdomain (Live)
```
Record Name: api
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

#### 4. Create Admin Subdomain (Live)
```
Record Name: admin
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

#### 5. Create App Subdomain (Live)
```
Record Name: app
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

#### 6. Create Test Environment Subdomains
```
Record Name: test
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

```
Record Name: api-test
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

```
Record Name: admin-test
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

```
Record Name: app-test
Record Type: A
Value: 18.205.158.139
TTL: 300 seconds
```

### AWS Console Instructions

#### Method 1: Using the Route 53 Console (Recommended)

1. **Navigate to Route 53**
   - Go to AWS Console → Route 53 → Hosted zones
   - Click on `hospient.com`

2. **Create Each Record**
   - Click **"Create record"** button
   - Select **"Simple routing"**
   - Click **"Define simple record"**

3. **For Each Subdomain:**
   - **Record name**: Enter the subdomain (e.g., `api`, `admin`, `app`, `test`, etc.)
   - **Record type**: Select **A – Routes traffic to an IPv4 address**
   - **Value**: Enter `18.205.158.139`
   - **TTL**: Set to `300` seconds
   - Click **"Define simple record"**

4. **Repeat for All Subdomains**
   - Create 9 total records as listed above
   - Click **"Create records"** when finished

#### Method 2: Using AWS CLI (Advanced)

If you prefer command line, here are the AWS CLI commands:

```bash
# Set your hosted zone ID (replace with your actual zone ID)
ZONE_ID="Z1234567890ABC"

# Create root domain record
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create www subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "www.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create API subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create admin subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "admin.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create app subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "app.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create test subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "test.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create api-test subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api-test.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create admin-test subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "admin-test.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Create app-test subdomain
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "app-test.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'
```

### Verification After Creation

#### 1. Check Route 53 Console
- Go back to your hospient.com hosted zone
- You should see all 9 A records listed
- Verify each record points to `18.205.158.139`

#### 2. DNS Propagation Check
Wait 5-10 minutes after creation, then test:

```bash
# Test from command line (Windows)
nslookup hospient.com
nslookup www.hospient.com
nslookup api.hospient.com
nslookup admin.hospient.com
nslookup app.hospient.com
nslookup test.hospient.com
nslookup api-test.hospient.com
nslookup admin-test.hospient.com
nslookup app-test.hospient.com
```

#### 3. Online DNS Check Tools
Use these tools to verify DNS propagation:
- https://dnschecker.org/
- https://www.whatsmydns.net/
- https://dns.google/ (Google DNS lookup)

### Expected DNS Propagation Time

With Route 53:
- **Internal AWS services**: Almost immediate (1-2 minutes)
- **Global DNS propagation**: 5-15 minutes (much faster than traditional DNS)
- **Complete worldwide propagation**: Up to 1 hour (vs 24-48 hours with other providers)

### Route 53 Advantages

1. **Fast Propagation**: Changes reflect quickly (5-15 minutes)
2. **High Availability**: 100% uptime SLA
3. **Integration**: Works seamlessly with other AWS services
4. **Health Checks**: Can monitor endpoint health
5. **Traffic Routing**: Advanced routing policies available

### Final DNS Record Summary

After creation, your Route 53 hosted zone should contain:

| Record Name | Type | Value | TTL |
|-------------|------|--------|-----|
| hospient.com | A | 18.205.158.139 | 300 |
| www.hospient.com | A | 18.205.158.139 | 300 |
| api.hospient.com | A | 18.205.158.139 | 300 |
| admin.hospient.com | A | 18.205.158.139 | 300 |
| app.hospient.com | A | 18.205.158.139 | 300 |
| test.hospient.com | A | 18.205.158.139 | 300 |
| api-test.hospient.com | A | 18.205.158.139 | 300 |
| admin-test.hospient.com | A | 18.205.158.139 | 300 |
| app-test.hospient.com | A | 18.205.158.139 | 300 |

### Troubleshooting Route 53

#### Common Issues:
1. **Wrong Hosted Zone**: Ensure you're in the correct hospient.com zone
2. **Typos in Record Names**: Double-check subdomain spelling
3. **TTL Too High**: Use 300 seconds for faster updates during setup
4. **Wrong Record Type**: Use A records, not CNAME for root domain

#### Fixing Issues:
```bash
# Delete incorrect record
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "DELETE",
    "ResourceRecordSet": {
      "Name": "wrong-name.hospient.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "18.205.158.139"}]
    }
  }]
}'

# Then create the correct record
```

--- 