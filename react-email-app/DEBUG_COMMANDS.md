# Debug Commands for 404 Error

Run these commands on your server to diagnose the issue:

## 1. Check what the container is serving

```bash
# Test root path
curl -I http://localhost:3012/

# Test /supabase path
curl -I http://localhost:3012/supabase/

# Get actual content
curl http://localhost:3012/ | head -20
```

## 2. Check container logs

```bash
docker logs react-email-app --tail 50
```

## 3. Check which Dockerfile was used

```bash
docker exec react-email-app ls -la /app/
```

## 4. Test if it's a serve vs nginx issue

```bash
# Check if serve is running
docker exec react-email-app ps aux

# Check if nginx is running
docker exec react-email-app nginx -v 2>&1 || echo "Nginx not installed"
```

## Expected Results

### If using serve (old setup):
- Should respond at `http://localhost:3012/`
- Will 404 at `http://localhost:3012/supabase/` unless you add trailing slash to nginx proxy_pass

### If using nginx (new setup):
- Should respond at `http://localhost:3012/supabase/`
- Container should be exposing port 80, not 3012

## Quick Fixes

### Fix 1: Update Nginx proxy (if using serve)
In your production nginx config, change:
```nginx
location /supabase {
    proxy_pass http://localhost:3012/;  # <-- Add trailing slash
    # ... rest of config
}
```

### Fix 2: Rebuild container (if vite.config.ts changed)
```bash
cd /var/www/react-email-app
docker-compose down
docker-compose up --build -d
docker logs -f react-email-app
```

### Fix 3: Check if index.html exists
```bash
docker exec react-email-app ls -la /app/dist/
```
