# Plesk Deployment Guide - Gastlook API

## Prerequisites
- Plesk Panel with Node.js support
- MySQL database access
- Domain/subdomain configured in Plesk

## Step 1: Database Setup

1. **Create MySQL Database in Plesk:**
   - Go to Plesk Panel → Databases 
   - Create a new database (e.g., `gastlook_db`)
   - Create a database user with full privileges
   - Note down the database credentials

2. **Import Database Schema:**
   - Upload your database schema/migrations
   - Execute the SQL files to create tables

## Step 2: File Upload

1. **Upload Project Files:**
   - Compress your project (excluding `node_modules`)
   - Upload via Plesk File Manager or FTP
   - Extract to your domain's document root or subdirectory

2. **Create Required Directories:**
   ```
   mkdir logs
   mkdir uploads
   ```

## Step 3: Environment Configuration

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_gastlook_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

## Step 4: Install Dependencies

⚠️ **IMPORTANT: Fix Node.js Path First** (See troubleshooting section if you get exit code 127)

Via Plesk Node.js interface or SSH:
```bash
npm install --production
```

## Step 5: Plesk Node.js Configuration

1. **Go to Plesk Panel → Node.js**
2. **Configure Application:**
   - Application Root: `/httpdocs` (or your app directory)
   - Application Startup File: `src/index.js`
   - Node.js Version: Choose latest stable (v18+)

3. **Environment Variables:**
   Add all environment variables from your `.env` file in the Plesk interface

4. **Install Dependencies:**
   Click "NPM Install" in Plesk interface

## Step 6: Domain Configuration

1. **Apache/Nginx Configuration:**
   - If using subdirectory: Configure proxy rules
   - If using subdomain: Point to Node.js application

2. **Example Apache Configuration (if needed):**
   ```apache
   ProxyPass /api http://localhost:3000/api
   ProxyPassReverse /api http://localhost:3000/api
   ```

## Step 7: SSL Certificate

1. **Enable SSL in Plesk:**
   - Go to SSL/TLS Certificates
   - Install Let's Encrypt or upload your certificate
   - Force HTTPS redirect

## Step 8: Process Management (Optional but Recommended)

If PM2 is available:

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start Application with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

## Step 9: Testing

1. **Test API endpoints:**
   ```bash
   curl https://yourdomain.com/api/auth/login
   ```

2. **Check logs:**
   - Plesk Node.js logs
   - Application logs in `logs/` directory

## Step 10: Monitoring and Maintenance

1. **Log Rotation:**
   Configure log rotation for application logs

2. **Backup Strategy:**
   - Database backups
   - File backups
   - Environment configuration backup

3. **Updates:**
   - Test in staging environment
   - Deploy with minimal downtime

## Troubleshooting

### Common Issues:

**🔥 CRITICAL: npm install fails with exit code 127**

This error occurs when Plesk can't find the Node.js executable. Here are the solutions:

**🎯 SPECIFIC FIX: @scarf/scarf postinstall failure**

If you see this specific error:
```
error command sh -c node ./report.js
error nodenv: node: command not found
```

This is caused by the `@scarf/scarf` package (analytics dependency). Here are the solutions:

**Solution A: Use .npmrc to skip problematic scripts**
Create a `.npmrc` file in your project root:
```
ignore-scripts=true
```
Then run:
```bash
npm install --production
npm rebuild --production
```

**Solution B: Install with specific flags**
```bash
npm install --production --ignore-scripts
npm rebuild --production
```

**Solution C: Use Plesk Node.js interface (Recommended)**
1. Delete any existing `node_modules` folder
2. Use Plesk Panel → Node.js → "NPM Install" button
3. This bypasses the shell environment issues

**Solution 1: Set Node.js version in Plesk Panel**
1. Go to Plesk Panel → Node.js
2. Make sure "Node.js support" is enabled
3. Select the correct Node.js version (v18+ recommended)
4. Click "Apply" and wait for it to complete
5. Try npm install again in the Plesk interface

**Solution 2: Via SSH with proper environment**
```bash
# Connect via SSH to your Plesk server
ssh your-username@your-server.com

# Navigate to your project directory
cd /var/www/vhosts/your-domain.com/httpdocs

# Set the Node.js version (if using nodenv)
nodenv local 24  # or whatever version you want to use

# Verify Node.js is working
node --version
npm --version

# Now install dependencies with script workaround
npm install --production --ignore-scripts
npm rebuild --production
```

**Solution 3: Use Plesk Node.js Manager**
1. In Plesk Panel → Node.js
2. Click "NPM Install" button instead of using terminal
3. This uses Plesk's Node.js environment properly

**Solution 4: Fix PATH environment**
Add to your .bashrc or .profile:
```bash
export PATH="$HOME/.nodenv/bin:$PATH"
eval "$(nodenv init -)"
```

1. **Port Conflicts:**
   - Ensure PORT in .env matches Plesk Node.js settings
   - Check if port is available

2. **Database Connection:**
   - Verify database credentials
   - Check database server status
   - Ensure database user has proper privileges

3. **File Permissions:**
   - Set proper permissions for uploads directory
   - Ensure log directory is writable

4. **Environment Variables:**
   - Double-check all required variables are set
   - Verify JWT_SECRET is properly configured

**🚨 Security Warnings in npm install:**

The warnings you see are about deprecated packages:
- `inflight@1.0.6` - Memory leak issue (from older dependencies)
- `multer@1.4.5-lts.2` - Security vulnerabilities (upgrade recommended)
- `glob@7.x` - Outdated version

To fix these, update your dependencies:
```bash
npm update
npm audit fix
```

### Useful Commands:

```bash
# Check Node.js environment
node --version
npm --version
nodenv versions  # if using nodenv

# Install with script workarounds
npm install --ignore-scripts
npm rebuild

# Clear npm cache if needed
npm cache clean --force

# Check application status
pm2 status

# View logs
pm2 logs gastlook-api

# Restart application
pm2 restart gastlook-api

# Check database connection
mysql -h localhost -u your_user -p your_database
```

## Security Checklist

- [ ] Database credentials secured
- [ ] JWT_SECRET is strong and unique
- [ ] CORS_ORIGIN properly configured
- [ ] SSL certificate installed
- [ ] File upload directory secured
- [ ] Error messages don't expose sensitive data
- [ ] Rate limiting implemented (if needed)
- [ ] Firewall rules configured 