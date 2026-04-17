# Redis Setup Guide for Windows

## What is Redis?

Redis is an in-memory data store used for caching in Campus Connect. It's **optional** but improves performance by caching:
- Proposal lists
- User data
- Analytics data
- Search results

## Current Status

❌ Redis is **not installed** on your system
⚠️ Application works without Redis (caching disabled)
✅ Application will automatically use Redis if installed

## Option 1: Install Redis (Recommended for Production)

### Method A: Using Memurai (Redis for Windows)

**Memurai** is a Redis-compatible server for Windows.

1. **Download Memurai:**
   - Visit: https://www.memurai.com/get-memurai
   - Download Memurai Developer Edition (Free)

2. **Install:**
   - Run the installer
   - Follow installation wizard
   - Choose default settings

3. **Verify Installation:**
   ```powershell
   memurai-cli ping
   ```
   Should return: `PONG`

4. **Configure Campus Connect:**
   Add to `.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

5. **Restart Backend:**
   ```powershell
   .\restart-backend.ps1
   ```

### Method B: Using Docker (If Docker is Installed)

1. **Pull Redis Image:**
   ```powershell
   docker pull redis:latest
   ```

2. **Run Redis Container:**
   ```powershell
   docker run -d --name redis -p 6379:6379 redis:latest
   ```

3. **Verify:**
   ```powershell
   docker ps
   ```
   Should show redis container running

4. **Configure Campus Connect:**
   Add to `.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

5. **Restart Backend:**
   ```powershell
   .\restart-backend.ps1
   ```

### Method C: Using WSL2 (Windows Subsystem for Linux)

1. **Install WSL2** (if not already installed):
   ```powershell
   wsl --install
   ```

2. **Open WSL Terminal:**
   ```bash
   wsl
   ```

3. **Install Redis in WSL:**
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

4. **Start Redis:**
   ```bash
   sudo service redis-server start
   ```

5. **Verify:**
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

6. **Configure Campus Connect:**
   Add to `.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

7. **Restart Backend:**
   ```powershell
   .\restart-backend.ps1
   ```

## Option 2: Continue Without Redis (Current Setup)

The application works fine without Redis. Caching is automatically disabled.

**Pros:**
- ✅ No additional installation needed
- ✅ Simpler setup
- ✅ Good for development

**Cons:**
- ⚠️ Slower response times for repeated queries
- ⚠️ More database load
- ⚠️ Not recommended for production

## Verifying Redis is Working

### 1. Check Backend Logs

After starting the backend with Redis installed, you should see:
```
✓ Redis connected successfully
```

Without Redis:
```
⚠️  Redis not configured - caching disabled (development mode)
```

### 2. Test Redis Connection

Create a test file `test-redis.js`:
```javascript
require('dotenv').config();
const redis = require('redis');

async function testRedis() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    console.log('✓ Redis connected');
    
    await client.set('test', 'Hello Redis!');
    const value = await client.get('test');
    console.log('✓ Redis working:', value);
    
    await client.quit();
  } catch (error) {
    console.error('✗ Redis error:', error.message);
  }
}

testRedis();
```

Run:
```powershell
node test-redis.js
```

### 3. Check Redis Data

If using Memurai or Redis CLI:
```powershell
# Connect to Redis
redis-cli
# or
memurai-cli

# List all keys
KEYS *

# Get a specific key
GET proposals:all

# Check Redis info
INFO
```

## Redis Configuration in Campus Connect

### Environment Variables

Add to `.env`:
```env
# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=          # Leave empty if no password
REDIS_TTL=3600          # Cache expiry in seconds (1 hour)
```

### Cache Keys Used

The application uses these cache keys:
- `proposals:all` - All proposals list
- `proposals:{id}` - Individual proposal
- `users:{id}` - User data
- `analytics:*` - Analytics data
- `search:*` - Search results

### Cache Expiry Times

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Proposals | 5 min | Frequently updated |
| Users | 15 min | Rarely changes |
| Analytics | 1 hour | Expensive queries |
| Search | 10 min | Balance freshness/performance |

## Troubleshooting

### Issue: "Redis connection failed"

**Causes:**
- Redis not running
- Wrong port or URL
- Firewall blocking connection

**Solutions:**
1. Check if Redis is running:
   ```powershell
   # For Memurai
   Get-Service Memurai
   
   # For Docker
   docker ps | findstr redis
   ```

2. Verify port 6379 is open:
   ```powershell
   netstat -ano | findstr :6379
   ```

3. Check `.env` has correct `REDIS_URL`

### Issue: "Redis unavailable (development)"

**Cause:** Redis not installed or not running

**Solution:**
- This is normal in development
- Application continues without caching
- Install Redis if you want caching

### Issue: Redis works but cache not updating

**Solution:**
```powershell
# Clear all cache
redis-cli FLUSHALL
# or
memurai-cli FLUSHALL
```

### Issue: High memory usage

**Solution:**
```powershell
# Check Redis memory
redis-cli INFO memory

# Set max memory in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Performance Impact

### Without Redis:
- Every request hits the database
- Slower response times (100-500ms)
- Higher database load

### With Redis:
- Cached requests return instantly (1-10ms)
- Reduced database load (50-80% reduction)
- Better scalability

## Production Recommendations

For production deployment:

1. **Use Redis** - Essential for performance
2. **Set Password:**
   ```env
   REDIS_URL=redis://:password@localhost:6379
   ```
3. **Enable Persistence:**
   - Configure RDB snapshots
   - Or use AOF (Append Only File)
4. **Monitor Memory:**
   - Set `maxmemory` limit
   - Use `allkeys-lru` eviction policy
5. **Use Redis Cluster** (for high availability)

## Quick Start Commands

```powershell
# Install Memurai (Windows)
# Download from: https://www.memurai.com/get-memurai

# Start Memurai service
Start-Service Memurai

# Test connection
memurai-cli ping

# Add to .env
# REDIS_URL=redis://localhost:6379

# Restart backend
.\restart-backend.ps1

# Verify in logs
# Should see: "✓ Redis connected successfully"
```

## Summary

| Scenario | Redis Status | Performance | Recommendation |
|----------|-------------|-------------|----------------|
| Development | Optional | Good | Continue without or install |
| Testing | Optional | Good | Install if testing caching |
| Production | Required | Excellent | Must install |

**Current Status:** ⚠️ Redis not installed - Application works but caching disabled

**Next Steps:**
1. For development: Continue without Redis (current setup works)
2. For production: Install Memurai or use Docker
3. Add `REDIS_URL` to `.env`
4. Restart backend server

**Redis is optional for development but recommended for production!**
