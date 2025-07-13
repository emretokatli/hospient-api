# AWS EC2 Ubuntu Deployment Guide - Vivatalia API

## Prerequisites ✅
- [x] AWS EC2 Ubuntu instance running
- [x] SSH access via PuTTY established
- [x] curl installed
- [x] Node.js installed

## Step 1: System Updates and Dependencies

Connect to your EC2 instance via PuTTY and run:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git nginx mysql-server unzip

# Verify Node.js version (should be 18+ for best compatibility)
node --version
npm --version

# Install PM2 globally for process management
sudo npm install -g pm2

# Install MySQL client tools if not already installed
sudo apt install -y mysql-client
```

## Step 2: Database Setup

### Option A: Use MySQL on EC2 (Recommended for development)

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Access MySQL as root
sudo mysql

# Create database and user
CREATE DATABASE vivatalia_db;
CREATE USER 'superadmin'@'localhost' IDENTIFIED BY 'MelisEnes2404!!';
GRANT ALL PRIVILEGES ON vivatalia_db.* TO 'superadmin'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test connection
mysql -u superadmin -p vivatalia_db
```

### Option B: Use AWS RDS (Recommended for production)

If you prefer AWS RDS, create an RDS MySQL instance and note the endpoint, username, and password.

## Step 3: Prepare Project Directory

```bash
# Create application directory
sudo mkdir -p /var/www/vivatalia-api
sudo chown $USER:$USER /var/www/vivatalia-api
cd /var/www/vivatalia-api

# Create required directories
mkdir -p logs uploads
```

## Step 4: Upload Project Files

### Method 1: Using Git (Recommended)

```bash
# If your project is in a Git repository
git clone your-repository-url .

# Or if you need to initialize and push from local
# (Run this on your local machine first, then clone on EC2)
```

### Method 2: Using SCP/SFTP

From your local machine, upload the project files:
```bash
# Using SCP (run from your local machine)
scp -i your-key.pem -r ./vivatalia-project ubuntu@your-ec2-ip:/var/www/vivatalia-api/

# Or use FileZilla/WinSCP with your PuTTY key
```

### Method 3: Direct Upload via PuTTY/WinSCP

1. Use WinSCP or FileZilla to connect to your EC2 instance
2. Upload all project files to `/var/www/vivatalia-api/`
3. Exclude `node_modules` folder (will be installed on server)

## Step 5: Environment Configuration

Create the environment file:

```bash
cd /var/www/vivatalia-api
nano .env
```

Add the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (adjust based on your setup)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vivatalia_db
DB_USER=superadmin
DB_PASSWORD=MelisEnes2404!!

# For AWS RDS, use:
# DB_HOST=your-rds-endpoint.amazonaws.com
# DB_PORT=3306
# DB_NAME=vivatalia_db
# DB_USER=admin
# DB_PASSWORD=your_rds_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_make_it_strong
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://your-domain.com

# AWS Configuration (if using S3 for file uploads)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=your-bucket-name
```

Save the file (Ctrl+X, then Y, then Enter in nano).

## Step 6: Install Dependencies

```bash
# Install project dependencies
npm install --production

# If you encounter issues, try:
npm install --production --ignore-scripts
npm rebuild --production
```

## Step 7: Database Migration (if applicable)

```bash
# Create an initial migration file
cat > src/migrations/20240319000000-create-initial-tables.js << 'EOF'
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create members table first (referenced by organizations)
    await queryInterface.createTable('members', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create organizations table
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        }
      },
      org_slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create hotels table
    await queryInterface.createTable('hotels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create other tables as needed...
    // Add file_categories, restaurants, menus, files tables here
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hotels');
    await queryInterface.dropTable('organizations');
    await queryInterface.dropTable('members');
  }
};
EOF

# Run all migrations in order
NODE_ENV=production npm run db:migrate

# Verify tables were created successfully
mysql -u superadmin -p vivatalia_db -e "SHOW TABLES;"

# Run seeders ONLY if you have seeders directory (optional)
# Check if seeders exist first
if [ -d "src/seeders" ]; then
  NODE_ENV=production npm run db:seed
else
  echo "No seeders found - skipping seed step (this is normal)"
fi
```

## Step 8: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/vivatalia-api
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-public-ip;

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

    # Handle file uploads
    location /uploads {
        alias /var/www/vivatalia-api/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/vivatalia-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Configure AWS Security Groups

In your AWS Console:

1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Add inbound rules:
   - HTTP (port 80) from anywhere (0.0.0.0/0)
   - HTTPS (port 443) from anywhere (0.0.0.0/0)
   - SSH (port 22) from your IP only
   - Custom TCP (port 3000) from anywhere (for direct API access, optional)

## Step 10: Start the Application

```bash
cd /var/www/vivatalia-api

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command that PM2 provides

# Check status
pm2 status
pm2 logs vivatalia-api
```

## Step 11: SSL Certificate (Production)

For production, install SSL certificate:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 12: Testing

Test your deployment:

```bash
# Test local connection
curl http://localhost:3000/api/health

# Test via Nginx
curl http://your-ec2-public-ip/api/health

# Test from external (replace with your domain/IP)
curl http://your-domain.com/api/health
```

## Step 13: Monitoring and Maintenance

### Set up log rotation:

```bash
sudo nano /etc/logrotate.d/vivatalia-api
```

Add:
```
/var/www/vivatalia-api/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload vivatalia-api
    endscript
}
```

### Useful Commands:

```bash
# Application management
pm2 restart vivatalia-api
pm2 stop vivatalia-api
pm2 logs vivatalia-api
pm2 monit

# System monitoring
htop
df -h
free -h

# Nginx management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Check application logs
tail -f /var/www/vivatalia-api/logs/combined.log
```

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible:**
   - Check security groups in AWS
   - Verify Nginx configuration
   - Check if PM2 is running: `pm2 status`

2. **Database connection errors:**
   - Verify database credentials in `.env`
   - Check if MySQL is running: `sudo systemctl status mysql`
   - Test connection: `mysql -u superadmin -p vivatalia_db`

3. **Permission errors:**
   ```bash
   sudo chown -R $USER:$USER /var/www/vivatalia-api
   chmod -R 755 /var/www/vivatalia-api
   chmod -R 777 /var/www/vivatalia-api/uploads
   chmod -R 777 /var/www/vivatalia-api/logs
   ```

4. **Nginx errors:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   tail -f /var/log/nginx/error.log
   ```

5. **PM2 not starting:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js --env production
   ```

## Security Checklist

- [ ] Change default MySQL root password
- [ ] Use strong passwords for database users
- [ ] Configure proper security groups
- [ ] Install SSL certificate
- [ ] Regular system updates
- [ ] Monitor logs regularly
- [ ] Backup database regularly

## Backup Strategy

```bash
# Database backup
mysqldump -u superadmin -p vivatalia_db > backup_$(date +%Y%m%d).sql

# File backup
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/vivatalia-api --exclude=node_modules

# Automate with cron
echo "0 2 * * * mysqldump -u superadmin -p'MelisEnes2404!!' vivatalia_db > /var/backups/vivatalia_db_$(date +\%Y\%m\%d).sql" | sudo crontab -
```

Your Vivatalia API should now be successfully deployed on AWS EC2! 🚀

Access your API at: `http://your-ec2-public-ip/api/` or `http://your-domain.com/api/` 