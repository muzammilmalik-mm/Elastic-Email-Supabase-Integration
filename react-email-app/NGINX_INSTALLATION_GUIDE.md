# Nginx Configuration Installation Guide

## Step 1: Backup Your Current Config

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d)
```

## Step 2: Edit Your Nginx Config

```bash
sudo nano /etc/nginx/sites-available/default
```

## Step 3: Add the Supabase Configuration

Find the `server` block with `listen 443 ssl http2` and add the Supabase configuration **after** the `/big-commerce/` location block and **before** the error pages section.

### Minimal Configuration (Quick Fix)

If you just want to fix the 404, add this:

```nginx
# Supabase Email Integration App
location /supabase {
    proxy_pass http://localhost:3012/;  # <--- Trailing slash is CRITICAL
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https://*.supabase.co https://*.elasticemail.com http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
}
```

### Full Optimized Configuration (Recommended)

For better performance with caching and compression, copy the entire content from `PRODUCTION_NGINX_SUPABASE.conf` file.

## Step 4: Test the Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
```

## Step 6: Verify It Works

```bash
# Test from server
curl -I https://integrations.elasticemail.in/supabase

# Check logs
sudo tail -f /var/log/nginx/integrations.elasticemail.in.access.log
```

You should see a **304** or **200** response, not 404.

## Troubleshooting

### Still getting 404?
1. Check if Docker container is running:
   ```bash
   docker ps | grep react-email-app
   ```

2. Test local access:
   ```bash
   curl -I http://localhost:3012/
   ```

3. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/integrations.elasticemail.in.error.log
   ```

### Assets not loading?
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for CSP violations
- Verify asset paths in browser Network tab

### Need to rollback?
```bash
sudo cp /etc/nginx/sites-available/default.backup.YYYYMMDD /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
```
