# Frontend Production Deployment Guide

This guide covers deploying the IT Asset Management System frontend to production.

## Prerequisites

- Node.js v18 or higher
- Build tools (npm/yarn)
- Web server or hosting service (Vercel, Netlify, AWS S3, etc.)

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.production` file:
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=IT Asset Management System
VITE_APP_VERSION=1.0.0
```

**Important:** Replace `api.yourdomain.com` with your actual API URL.

### 2. Build Optimization

The build is already optimized with:
- Code splitting
- Tree shaking
- Minification
- Source maps (hidden in production)
- Console.log removal

### 3. Security

- ✅ API URLs use HTTPS
- ✅ Environment variables don't contain secrets (Vite variables are exposed in client)
- ✅ CORS configured on backend
- ✅ No sensitive data in build

## Build Process

### Local Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Build Configuration

The build is configured in `vite.config.js`:
- Source maps are generated but hidden (for error tracking)
- Console.log statements are removed
- Code is minified with Terser
- Assets are hashed for cache busting
- Chunks are optimized for better caching

## Deployment Methods

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard:
   - `VITE_API_URL`
   - `VITE_APP_NAME`

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

3. Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS S3 + CloudFront

1. Build:
```bash
npm run build
```

2. Upload to S3:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. Configure CloudFront:
   - Point to S3 bucket
   - Set default root object to `index.html`
   - Configure error pages to return `index.html` for 404

### Option 4: Docker

Create `Dockerfile`:
```dockerfile
FROM nginx:alpine

# Copy build output
COPY dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:
```bash
docker build -t asset-mgmt-frontend .
docker run -p 80:80 asset-mgmt-frontend
```

### Option 5: Traditional Web Server (Nginx)

1. Build:
```bash
npm run build
```

2. Copy to server:
```bash
scp -r dist/* user@server:/var/www/asset-mgmt/
```

3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    
    root /var/www/asset-mgmt;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## SSL/TLS Configuration

### Let's Encrypt (Nginx)
```bash
certbot --nginx -d app.yourdomain.com
```

### Vercel/Netlify
SSL is automatically configured on these platforms.

## Performance Optimization

The build is already optimized with:
- Code splitting (separate chunks for React, charts, etc.)
- Asset optimization
- Lazy loading where applicable
- Efficient caching headers

### Additional Optimizations

1. **Enable CDN:**
   - Use CloudFront, Cloudflare, or similar
   - Serve static assets from CDN

2. **Enable Compression:**
   - Gzip/Brotli compression (configure in web server)

3. **Optimize Images:**
   - Use WebP format
   - Lazy load images
   - Responsive images

## Monitoring

### Error Tracking

Consider integrating:
- Sentry for error tracking
- Google Analytics for usage analytics
- LogRocket for session replay

### Performance Monitoring

- Use browser DevTools
- Lighthouse audits
- Web Vitals monitoring
- Real User Monitoring (RUM)

## Security Headers

Add to your web server configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Troubleshooting

### Build Fails
- Check Node.js version (v18+)
- Clear node_modules and reinstall
- Check for syntax errors
- Review build logs

### API Connection Issues
- Verify `VITE_API_URL` is correct
- Check CORS configuration on backend
- Verify API is accessible from browser
- Check network/firewall rules

### Routes Not Working (404)
- Configure server to return `index.html` for all routes
- Check SPA routing configuration
- Verify build files are in correct location

### Assets Not Loading
- Check asset paths are correct
- Verify files are in `dist/` directory
- Check web server configuration
- Verify CORS headers

## Rollback Procedure

1. Keep previous build in backup location
2. Deploy previous build to server
3. Clear browser cache if needed
4. Verify functionality

## Environment-Specific Builds

Create different `.env` files:
- `.env.development` - Development API
- `.env.staging` - Staging API
- `.env.production` - Production API

Build with:
```bash
VITE_API_URL=https://api-staging.example.com npm run build
```

## Support

For issues:
- Check browser console for errors
- Verify API is running and accessible
- Check network tab in DevTools
- Review build logs
- Verify environment variables

