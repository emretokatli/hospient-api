# GitHub + Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Your MariaDB database credentials

## Step 1: Prepare Your Project

### 1.1 Create a .env file for local development
Copy the `env.example` file to `.env` and update the values:

```bash
cp env.example .env
```

### 1.2 Update your .env file with your actual values:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (MariaDB)
DB_HOST=database-5018207746.webspace-host.com
DB_PORT=3306
DB_NAME=dbs14426978
DB_USER=dbu1445585
DB_PASSWORD=BJK1903bjk1903!!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Step 2: Deploy to GitHub

### 2.1 Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2.2 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it `hospient-api` (or your preferred name)
4. Make it public or private (your choice)
5. Don't initialize with README (since you already have one)

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/hospient-api.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect Vercel to GitHub
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your GitHub repository (`hospient-api`)
5. Vercel will automatically detect it's a Node.js project

### 3.2 Configure Environment Variables in Vercel
In the Vercel project settings, add these environment variables:

**Production Environment:**
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

**Preview Environment (for testing):**
```
NODE_ENV=development
DB_HOST=database-5018207746.webspace-host.com
DB_PORT=3306
DB_NAME=dbs14426978
DB_USER=dbu1445585
DB_PASSWORD=BJK1903bjk1903!!
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-preview-domain.vercel.app
```

### 3.3 Deploy
1. Click "Deploy" in Vercel
2. Vercel will build and deploy your application
3. You'll get a URL like: `https://hospient-api-xxxxx.vercel.app`

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain in Vercel
1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., `api.hospient.com`)
4. Follow the DNS configuration instructions

### 4.2 Update CORS Configuration
Update the `CORS_ORIGIN` environment variable to include your custom domain.

## Step 5: Test Your Deployment

### 5.1 Test API Endpoints
```bash
# Test health endpoint
curl https://your-vercel-domain.vercel.app/api/public/hotels

# Test Swagger documentation
curl https://your-vercel-domain.vercel.app/api-docs
```

### 5.2 Test Database Connection
Your API should automatically connect to your MariaDB database when deployed.

## Step 6: Continuous Deployment

### 6.1 Automatic Deployments
- Every push to the `main` branch will trigger a production deployment
- Every pull request will create a preview deployment

### 6.2 Environment-Specific Deployments
- Production: `main` branch
- Preview: Pull requests
- Development: You can create additional branches

## Step 7: Monitoring and Logs

### 7.1 Vercel Dashboard
- Monitor deployments in the Vercel dashboard
- View function logs and performance metrics
- Set up alerts for errors

### 7.2 Database Monitoring
- Monitor your MariaDB database performance
- Set up database backups
- Monitor connection pool usage

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify your MariaDB credentials
   - Check if your database allows external connections
   - Ensure the database server is accessible from Vercel's servers

2. **Environment Variables Not Working**
   - Double-check variable names in Vercel dashboard
   - Ensure no extra spaces or quotes
   - Redeploy after adding new environment variables

3. **CORS Errors**
   - Update `CORS_ORIGIN` to include your frontend domain
   - Test with different origins if needed

4. **File Upload Issues**
   - Vercel has read-only filesystem
   - Consider using external storage (AWS S3, Cloudinary) for file uploads
   - Update your file upload logic accordingly

5. **WebSocket Issues**
   - Vercel doesn't support persistent WebSocket connections
   - Consider using external WebSocket services (Socket.io Cloud, Pusher)
   - Update your WebSocket implementation for serverless environment

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to Git
   - Use Vercel's environment variable system
   - Rotate JWT secrets regularly

2. **Database Security**
   - Use strong passwords
   - Limit database access to specific IPs if possible
   - Regularly backup your database

3. **API Security**
   - Implement proper rate limiting
   - Use HTTPS (automatic with Vercel)
   - Validate all inputs

## Next Steps

1. **Set up monitoring and alerts**
2. **Configure database backups**
3. **Set up staging environment**
4. **Implement CI/CD pipeline**
5. **Add API documentation**
6. **Set up error tracking (Sentry, etc.)**

Your API is now deployed and ready to use! 🚀 