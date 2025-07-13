# Vercel Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. FUNCTION_INVOCATION_FAILED Error

**Symptoms:**
- 500 Internal Server Error
- Code: FUNCTION_INVOCATION_FAILED
- Serverless Function has crashed

**Causes and Solutions:**

#### A. Missing Environment Variables
**Check in Vercel Dashboard:**
1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Ensure these variables are set:

```
NODE_ENV=production
DB_HOST=database-5018207746.webspace-host.com
DB_PORT=3306
DB_NAME=dbs14426978
DB_USER=dbu1445585
DB_PASSWORD=BJK1903bjk1903!!
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

#### B. Database Connection Issues
**Test your database connection:**
```bash
# Test from your local machine
mysql -h database-5018207746.webspace-host.com -u dbu1445585 -p dbs14426978
```

**Common database issues:**
1. **Firewall blocking connections** - Contact your hosting provider
2. **Wrong credentials** - Double-check username/password
3. **Database doesn't exist** - Verify database name
4. **User permissions** - Ensure user has proper access

#### C. WebSocket/HTTP Server Issues
**Solution:** The updated `src/index.js` removes WebSocket server initialization for serverless compatibility.

### 2. Build Failures

**Check build logs in Vercel dashboard:**
1. Go to your project in Vercel
2. Click on the latest deployment
3. Check "Build Logs" for errors

**Common build issues:**
- Missing dependencies
- Syntax errors
- Import/require errors

### 3. Environment Variable Issues

**Debug environment variables:**
Add this to your API to check if variables are loaded:

```javascript
app.get('/api/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET',
    DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
  });
});
```

### 4. File Upload Issues

**Problem:** Vercel has a read-only filesystem
**Solution:** Use external storage services:
- AWS S3
- Cloudinary
- Firebase Storage

### 5. WebSocket Issues

**Problem:** Vercel doesn't support persistent WebSocket connections
**Solution:** Use external WebSocket services:
- Socket.io Cloud
- Pusher
- Ably

## Debugging Steps

### Step 1: Check Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all required variables are set
3. Check for typos or extra spaces

### Step 2: Test Database Connection
1. Try connecting from your local machine
2. Check if the database server allows external connections
3. Verify credentials

### Step 3: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the function that's failing
3. Check "Runtime Logs" for error messages

### Step 4: Test Health Endpoint
After deployment, test:
```
https://your-domain.vercel.app/api/health
```

### Step 5: Check Function Timeout
Vercel has a 10-second timeout for Hobby plan. If your database connection takes too long:
1. Upgrade to Pro plan (30-second timeout)
2. Optimize database queries
3. Use connection pooling

## Quick Fixes

### 1. Redeploy After Environment Variable Changes
After adding/updating environment variables, redeploy your project.

### 2. Clear Vercel Cache
Sometimes clearing the cache helps:
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Click "Clear Build Cache"

### 3. Check Node.js Version
Ensure you're using a compatible Node.js version (14+ recommended).

### 4. Verify Package.json
Make sure your `package.json` has:
- Correct `main` field
- All required dependencies
- Proper scripts

## Getting Help

### 1. Vercel Support
- Check Vercel documentation
- Use Vercel Discord community
- Contact Vercel support

### 2. Database Issues
- Contact your hosting provider
- Check database server logs
- Verify network connectivity

### 3. Application Issues
- Check your application logs
- Test locally first
- Use debugging endpoints

## Prevention

### 1. Test Locally First
Always test your application locally before deploying.

### 2. Use Environment-Specific Configs
Have different configurations for development, staging, and production.

### 3. Monitor Deployments
Set up monitoring and alerts for your deployed application.

### 4. Regular Backups
Backup your database regularly.

## Success Checklist

- [ ] Environment variables set in Vercel
- [ ] Database connection working
- [ ] Health endpoint responding
- [ ] API endpoints working
- [ ] No WebSocket dependencies
- [ ] File uploads configured for external storage
- [ ] Error handling in place
- [ ] Monitoring set up

Your API should work properly once all these items are checked! 🚀 