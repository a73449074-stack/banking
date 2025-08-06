# Deployment Guide for SecureBank

This guide covers deploying the SecureBank application to production using Render (backend) and Vercel (frontend).

## Prerequisites

1. **MongoDB Atlas Account** - For production database
2. **Render Account** - For backend deployment
3. **Vercel Account** - For frontend deployment
4. **GitHub Repository** - Code should be pushed to GitHub

## Step 1: Setup MongoDB Atlas

1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Create a database user with read/write privileges
4. Add your IP address to the IP access list (or use 0.0.0.0/0 for all IPs)
5. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/banking-app`)

## Step 2: Deploy Backend to Render

1. **Create a New Web Service on Render**
   - Go to https://render.com
   - Click "New" > "Web Service"
   - Connect your GitHub repository

2. **Configure the Service**
   - Name: `securebank-backend`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main` (or your primary branch)
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-app
   JWT_SECRET=your_super_secure_jwt_secret_for_production
   FRONTEND_URL=https://your-app-name.vercel.app
   PORT=5000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://securebank-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from Frontend Directory**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N`
   - Project name: `securebank-frontend`
   - Directory: `./` (current directory)

4. **Set Environment Variables**
   In Vercel dashboard or via CLI:
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://your-render-app.onrender.com/api
   
   vercel env add REACT_APP_SOCKET_URL
   # Enter: https://your-render-app.onrender.com
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 4: Update Backend CORS Settings

1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend service

## Step 5: Test Deployment

1. **Test Backend Health**
   - Visit: `https://your-render-app.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Banking API is running"}`

2. **Test Frontend**
   - Visit your Vercel URL
   - Try logging in with demo accounts:
     - Admin: `admin@demo.com` / `password`
     - User: `user@demo.com` / `password`

3. **Test Real-Time Features**
   - Open app on two different devices/browsers
   - Login as user on one, admin on another
   - Create a transaction as user
   - Approve it as admin
   - Verify real-time updates work

## Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-app
JWT_SECRET=your_super_secure_jwt_secret_for_production
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=5000
```

### Frontend (Vercel)
```env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
   - Check that both HTTP and HTTPS are handled correctly

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **WebSocket Connection Issues**
   - Verify `REACT_APP_SOCKET_URL` points to your Render backend
   - Check that Render service is running and accessible

4. **Build Failures**
   - Check build logs in Render/Vercel dashboards
   - Ensure all dependencies are listed in package.json
   - Verify Node.js version compatibility

### Monitoring

1. **Render Monitoring**
   - Check service logs in Render dashboard
   - Monitor service health and performance
   - Set up alerts for downtime

2. **Vercel Monitoring**
   - Check function logs in Vercel dashboard
   - Monitor build and deployment status
   - Use Vercel Analytics for usage insights

### Scaling Considerations

1. **Backend Scaling**
   - Render automatically scales based on traffic
   - Consider upgrading to paid plan for better performance
   - Monitor database performance and upgrade as needed

2. **Database Optimization**
   - Add indexes for frequently queried fields
   - Consider MongoDB Atlas auto-scaling
   - Monitor connection pool usage

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Limit IP access where possible
   - Enable MongoDB Atlas security features

3. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Monitor for suspicious activity

## Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging first

2. **Backups**
   - Setup MongoDB Atlas automated backups
   - Export important data regularly
   - Test backup restoration procedures

3. **Monitoring**
   - Set up uptime monitoring
   - Monitor error rates and performance
   - Create alerts for critical issues

## Cost Optimization

1. **Render**
   - Free tier available with limitations
   - Paid plans start at $7/month
   - Auto-sleep on free tier (25 minutes of inactivity)

2. **Vercel**
   - Generous free tier for personal projects
   - Paid plans for commercial use
   - Monitor usage to avoid overages

3. **MongoDB Atlas**
   - Free tier (M0) available with 512MB storage
   - Shared clusters for development
   - Dedicated clusters for production

This deployment setup provides a production-ready banking application with proper security, scalability, and monitoring capabilities.
