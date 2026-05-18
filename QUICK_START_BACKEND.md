# V.I.B.E Backend - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- Python 3.9+ (for ML service)

### Step 1: Install Dependencies
```bash
cd vibe-backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vibe_db
JWT_SECRET=your_secret_key
```

### Step 3: Initialize Database
```bash
mysql -u root -p vibe_db < ../../database/schema.sql
```

### Step 4: Start Backend Server
```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Step 5: Start ML Service
```bash
cd ../vibe-ml
pip install -r requirements.txt
python training/train_model.py
python -m src.app
```

ML Service runs on `http://localhost:5000`

---

## 🧪 Test the Backend

### Health Check
```bash
curl http://localhost:3001/health
```

### Create User (Register)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "role": "buyer"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Create Auction
```bash
curl -X POST http://localhost:3001/api/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Vintage Camera",
    "description": "Beautiful vintage camera",
    "category": "Electronics",
    "primaryImageUrl": "http://example.com/image.jpg",
    "startingPrice": 100,
    "endTime": "2025-12-31T23:59:59Z"
  }'
```

### Place Bid
```bash
curl -X POST http://localhost:3001/api/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "auctionId": 1,
    "bidAmount": 150
  }'
```

### List Auctions
```bash
curl http://localhost:3001/api/auctions
```

---

## 🔌 Socket.IO Connection

### JavaScript Client Example
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate
socket.emit('authenticate', { userId: 1 });

// Join auction room
socket.emit('joinAuction', { auctionId: 1 });

// Listen for bid updates
socket.on('bidPlaced', (data) => {
  console.log('New bid:', data);
});

// Listen for outbid notification
socket.on('userOutbid', (data) => {
  console.log('You were outbid:', data);
});
```

---

## 📊 Admin Dashboard

### Login as Admin
```bash
# Use an admin account or modify user role in database
```

### Access Dashboard
```
GET /api/admin/dashboard/stats
GET /api/admin/dashboard/fraud
GET /api/admin/stats/sellers
```

---

## 🧬 ML Service Testing

### Score a Bid
```bash
curl -X POST http://localhost:5000/api/score-bid \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "auction_id": 1,
    "bid_amount": 150
  }'
```

### Get Model Info
```bash
curl http://localhost:5000/api/model-info
```

---

## 🚀 Docker Deployment

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f vibe-backend
docker-compose logs -f vibe-ml
```

### Stop Services
```bash
docker-compose down
```

---

## 🧪 Run Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test
```bash
npm test -- auth.test.js
npm test -- auctions.test.js
```

---

## 📊 Monitor Performance

### Check Logs
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Performance Metrics
```bash
curl http://localhost:3001/api/admin/dashboard/performance
```

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Create database if needed
mysql -u root -p -e "CREATE DATABASE vibe_db"
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
```

### ML Service Timeout
```bash
# Check Flask service is running
curl http://localhost:5000/health

# Check model file exists
ls -la models/fraud_model.joblib
```

### Port Already in Use
```bash
# Change port in .env
PORT=3002

# Or kill process on port
lsof -ti:3001 | xargs kill -9
```

---

## 📚 Documentation

- **[Backend Implementation Guide](vibe-backend/BACKEND_GUIDE.md)** - Complete API docs
- **[Completion Summary](BACKEND_COMPLETION_SUMMARY.md)** - What's implemented
- **[Phase 2 Report](PHASE_2_COMPLETION_REPORT.md)** - Detailed breakdown
- **[Main Summary](IMPLEMENTATION_SUMMARY.md)** - Project overview

---

## 🎯 Key Endpoints

### Auctions
```
GET    /api/auctions              - List auctions
POST   /api/auctions              - Create auction
GET    /api/auctions/:id          - Get auction
PUT    /api/auctions/:id          - Update auction
DELETE /api/auctions/:id          - Delete auction
```

### Bidding
```
POST   /api/bids                  - Place bid
GET    /api/bids/:auctionId/history - Bid history
GET    /api/bids/user/my-bids     - My bids
```

### Users
```
GET    /api/users/profile         - Get profile
PUT    /api/users/profile         - Update profile
GET    /api/users/notifications   - Get notifications
GET    /api/users/wishlist        - Get wishlist
```

### Admin
```
GET    /api/admin/dashboard/stats - Dashboard stats
GET    /api/admin/dashboard/fraud - Fraud dashboard
GET    /api/admin/stats/sellers   - Seller stats
```

---

## ✨ Features at a Glance

✅ **Real-Time Bidding**
- Sub-100ms bid placement
- Live price updates
- Outbid notifications

✅ **Fraud Detection**
- ML-powered scoring
- Risk assessment
- User blocking

✅ **Admin Dashboard**
- System statistics
- User management
- Fraud monitoring

✅ **Security**
- JWT authentication
- Role-based access
- Rate limiting

---

## 📞 Need Help?

1. Check logs: `logs/error.log`
2. Review docs: See Documentation section above
3. Test endpoints: Use curl examples above
4. Check health: `curl http://localhost:3001/health`

---

## 🎊 Ready to Go!

Your V.I.B.E backend is now running. Connect your frontend and start building!

For more details, see [BACKEND_GUIDE.md](vibe-backend/BACKEND_GUIDE.md)
