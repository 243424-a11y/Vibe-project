# V.I.B.E PROJECT - QUICK REFERENCE GUIDE

## 🚀 START HERE

### Quick Start (5 minutes)
```bash
cd "FYP PROJECT"

# Copy environment file
cp .env.example .env

# Start all services with Docker
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# ML Service: http://localhost:5000
```

### Manual Start (for development)
```bash
# Terminal 1: Backend
cd vibe-backend
npm install
npm run dev

# Terminal 2: Frontend
cd vibe-frontend
npm install
npm start

# Terminal 3: ML Service
cd vibe-ml
pip install -r requirements.txt
python src/app.py
```

---

## 📂 PROJECT STRUCTURE AT A GLANCE

```
vibe-backend/          ← Backend API server (Node.js)
vibe-frontend/         ← Frontend app (React)
vibe-ml/               ← ML service (Python)
database/              ← Database schema & migrations
docs/                  ← Documentation
docker-compose.yml     ← Docker orchestration
.env.example          ← Environment template
```

---

## 🔑 KEY ENDPOINTS

### Authentication
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
POST   /api/auth/refresh       - Refresh token
```

### Auctions (Ready in Phase 2)
```
GET    /api/auctions           - List all
GET    /api/auctions/:id       - Get details
POST   /api/auctions           - Create
PUT    /api/auctions/:id       - Update
DELETE /api/auctions/:id       - Delete
```

### Bidding (Ready in Phase 2)
```
POST   /api/bids               - Place bid
GET    /api/auctions/:id/bids  - Get bid history
GET    /api/users/:id/bids     - Get user's bids
```

---

## 💾 DATABASE QUICK ACCESS

### Login to MySQL
```bash
mysql -u root -p

# In MySQL:
USE vibe_db;
SHOW TABLES;
SELECT * FROM Users;
SELECT * FROM Auctions;
```

### Reset Database
```bash
mysql -u root -p vibe_db < database/schema.sql
```

---

## 🧪 TEST THE SYSTEM

### 1. Test Auth Flow
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test@123456"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123456"}'

# Use returned token in Authorization header
```

### 2. Test Health Endpoints
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/version
curl http://localhost:5000/health
```

### 3. Test Frontend
```
http://localhost:3000
- Navigate to Login
- Register new account
- Login
- View Dashboard
```

---

## 📝 IMPORTANT FILES TO EDIT

### Backend Config
- `vibe-backend/.env` - Environment variables
- `vibe-backend/src/server.js` - Entry point
- `vibe-backend/src/routes/` - Add new routes here

### Frontend Config
- `vibe-frontend/.env` - Environment variables
- `vibe-frontend/src/App.js` - Main app
- `vibe-frontend/src/pages/` - Add new pages here

### Database
- `database/schema.sql` - Schema definition

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Port Already in Use
```bash
# Find process on port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: MySQL Connection Error
```bash
# Check MySQL running
mysql -u root -p -e "SELECT 1"

# Verify .env credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your-password>
```

### Issue: Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Redis Connection Error
```bash
# Check Redis
redis-cli ping

# Verify .env
REDIS_URL=redis://localhost:6379
```

---

## 📊 FILE STATISTICS

| Component | Files | LOC | Status |
|-----------|-------|-----|--------|
| Backend | 12 | 1,200+ | ✅ Ready |
| Frontend | 15 | 800+ | ✅ Ready |
| ML Service | 1 | 200+ | ✅ Ready |
| Database | 1 | 300+ | ✅ Ready |
| Docs | 3 | 1,500+ | ✅ Complete |
| **Total** | **32** | **4,000+** | **✅ 30% Done** |

---

## 🎯 PHASE 2 CHECKLIST

Before starting Phase 2, ensure:
- [x] Project structure verified
- [x] Dependencies installed
- [x] Database schema created
- [x] Authentication working
- [x] Docker containers running
- [x] Environment variables set
- [x] Backend server starting
- [x] Frontend app loading
- [x] No console errors

---

## 👥 TEAM RESPONSIBILITIES (SUGGESTED)

### Developer 1: Backend API
- Auction CRUD endpoints
- Bidding system
- Auto-bid logic
- ML integration

### Developer 2: Frontend UI
- Auction listing & detail pages
- Bidding interface
- Dashboard components
- Image upload form

### Developer 3: Real-Time & ML
- Socket.IO implementation
- ML fraud detection model
- Testing & optimization
- Deployment setup

---

## 📚 REFERENCE LINKS

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [Flask Docs](https://flask.palletsprojects.com/)

---

## 🔐 SECURITY REMINDERS

1. **Never commit .env file** - Use .env.example
2. **Always validate inputs** - Frontend & backend
3. **Hash passwords** - Never store plain text
4. **Use HTTPS** - In production only
5. **Rate limit endpoints** - Prevent abuse
6. **Log security events** - Monitor suspicious activity
7. **Keep dependencies updated** - Regular npm/pip updates

---

## ✅ DEPLOYMENT CHECKLIST

Before going live:
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database backup strategy
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup & recovery tested
- [ ] Performance benchmarked
- [ ] Security audit passed
- [ ] Documentation updated

---

## 📞 GET HELP

### Documentation
- `docs/SETUP.md` - Installation guide
- `docs/ARCHITECTURE.md` - System design
- `docs/IMPLEMENTATION_SUMMARY.md` - This phase details
- `README.md` - Project overview

### Troubleshooting
1. Check logs: `docker-compose logs -f backend`
2. Verify connections: `npm test`
3. Review error messages carefully
4. Check GitHub issues
5. Ask supervisor or team members

---

## 🎓 NEXT STEPS

1. **Today**: Get the project running locally
2. **Tomorrow**: Implement Auction APIs
3. **Next Week**: Build Auction Frontend
4. **Next Phase**: Real-time Bidding System

---

**Last Updated**: January 2025  
**Version**: 1.0 Alpha  
**Status**: Ready for Phase 2  

Happy coding! 🚀
