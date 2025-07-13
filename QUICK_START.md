# Quick Start Guide - Deploy to GitHub & Vercel

## 🚀 Immediate Steps (5 minutes)

### 1. Create .env file
```bash
cp env.example .env
```
Edit `.env` and update with your actual values.

### 2. Initialize Git & Push to GitHub
```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for Vercel deployment"

# Create GitHub repository at https://github.com/new
# Then push (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hospient-api.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `hospient-api` repository
5. **Important**: Add these environment variables in Vercel dashboard:

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

6. Click "Deploy"

### 4. Test Your API
Your API will be available at: `https://your-project-name.vercel.app`

Test endpoints:
- `https://your-project-name.vercel.app/api-docs` (Swagger docs)
- `https://your-project-name.vercel.app/api/public/hotels` (Public API)

## ⚠️ Important Notes

1. **WebSocket Limitation**: Vercel doesn't support persistent WebSocket connections. You'll need to use external services like Socket.io Cloud or Pusher for real-time features.

2. **File Uploads**: Vercel has a read-only filesystem. Consider using AWS S3 or Cloudinary for file storage.

3. **Database**: Your MariaDB connection should work fine with Vercel.

## 🔧 Troubleshooting

If you get database connection errors:
1. Verify your MariaDB credentials
2. Check if your database allows external connections
3. Ensure the database server is accessible from Vercel's servers

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT.md` for detailed instructions and troubleshooting.

## 🎯 Next Steps

1. Set up custom domain
2. Configure monitoring
3. Set up database backups
4. Implement CI/CD pipeline

Your API is now live! 🎉 