# V.I.B.E Backend Implementation Guide

## Overview
V.I.B.E (Validated Intelligent Bidding Engine) is a real-time auction platform with advanced fraud detection using machine learning.

## Architecture

### Core Components
1. **Express.js Backend** - RESTful API + WebSocket real-time updates
2. **MySQL Database** - Persistent data storage with optimized indexing
3. **Redis Cache** - Real-time data caching and session management
4. **Socket.IO** - Real-time bidding and notifications
5. **Python ML Service** - Fraud detection using Ensemble models
6. **Docker** - Containerized deployment

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Auctions
- `GET /api/auctions` - List auctions (with filtering)
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create new auction (requires auth)
- `PUT /api/auctions/:id` - Update auction (requires auth)
- `DELETE /api/auctions/:id` - Delete auction (requires auth)
- `GET /api/auctions/stats` - Get auction statistics
- `GET /api/auctions/seller/:sellerId` - Get seller's auctions

### Bidding
- `POST /api/bids` - Place bid (requires auth)
- `GET /api/bids/:auctionId/history` - Get bid history
- `GET /api/bids/:auctionId/highest` - Get highest bid
- `GET /api/bids/user/my-bids` - Get user's bids (requires auth)
- `PUT /api/bids/:bidId/auto-bid` - Update auto-bid limit

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `GET /api/users/profile/:userId` - Get public user profile
- `PUT /api/users/profile` - Update profile (requires auth)
- `GET /api/users/preferences` - Get preferences (requires auth)
- `PUT /api/users/preferences` - Update preferences (requires auth)
- `GET /api/users/notifications` - Get notifications (requires auth)
- `GET /api/users/wishlist` - Get wishlist (requires auth)
- `POST /api/users/wishlist` - Add to wishlist (requires auth)
- `DELETE /api/users/wishlist/:auctionId` - Remove from wishlist

### Fraud Detection
- `GET /api/fraud/logs` - Get fraud logs (admin only)
- `GET /api/fraud/stats` - Get fraud statistics (admin only)
- `GET /api/fraud/user/:userId/history` - Get user fraud history (admin only)
- `GET /api/fraud/bid/:bidId` - Check bid fraud status (admin only)

### Admin Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/auctions` - Get active auctions
- `GET /api/admin/dashboard/users` - Get user management data
- `GET /api/admin/dashboard/fraud` - Get fraud dashboard
- `GET /api/admin/stats/sellers` - Get seller statistics
- `GET /api/admin/stats/buyers` - Get buyer statistics

## Real-Time Events (Socket.IO)

### Client Events
- `authenticate` - Authenticate user connection
- `joinAuction` - Join auction room
- `leaveAuction` - Leave auction room
- `placeBid` - Place bid (acknowledge)

### Server Events
- `bidPlaced` - New bid placed (broadcast to auction room)
- `userOutbid` - User outbid (sent to specific user)
- `countdownUpdate` - Auction countdown (broadcast)
- `auctionEnding` - Auction ending alert
- `auctionEnded` - Auction ended (final result)

## Database Schema

### Core Tables
1. **Users** - User accounts and profiles
2. **Auctions** - Auction listings
3. **Bids** - Bid history (partitioned by year)
4. **FraudLogs** - Fraud detection logs
5. **UserPreferences** - User settings
6. **Notifications** - User notifications

## Background Jobs

### Auction Processing
- **Every 1 minute** - Process expired auctions
- **Every 30 seconds** - Send auction ending alerts (5 min remaining)
- **Every second** - Update countdown timers

## ML Service

### Models
- **Random Forest** - Primary classification model
- **Isolation Forest** - Anomaly detection
- **Ensemble** - Weighted combination of both models

### Features (6 categories)
1. Bid Frequency - How often user places bids
2. Bid Pattern - Consistency of bidding behavior
3. Account Age - Days since account creation (normalized)
4. Device Consistency - IP/device fingerprint matching
5. Temporal Pattern - Time-based anomalies
6. Auction Context - Auction type/price similarity

### Fraud Scoring
- Score range: 0-1
- Low risk: < 0.3
- Medium risk: 0.3-0.7
- High risk: > 0.7

## Security Features

### Authentication
- JWT tokens (15 minute expiration)
- Refresh tokens (7 day HTTP-only cookies)
- bcryptjs password hashing (12 rounds)

### Authorization
- Role-based access control (RBAC)
- Admin-only endpoints protected
- User-specific data isolation

### Rate Limiting
- General: 100 requests/minute per IP
- Bidding: 10 requests/minute per IP

### Input Validation
- Schema validation with Joi
- SQL injection prevention
- XSS protection

## Environment Variables

```
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=vibe_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ML Service
ML_SERVICE_URL=http://localhost:5000
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Bid placement to update | < 100ms |
| API response time | < 300ms |
| Database query time | < 200ms |
| Frontend LCP | < 2.5s |
| Fraud detection | < 100ms |
| Concurrent users | 1000+ |

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Initialize Database
```bash
# Run schema.sql
mysql -u root -p vibe_db < ../../database/schema.sql
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Start ML Service
```bash
cd ../vibe-ml
python training/train_model.py  # Train model first
python -m src.app               # Start Flask service
```

## Testing

### Run Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- auth.test.js
npm test -- auctions.test.js
npm test -- bids.test.js
```

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### AWS EC2 Deployment
1. Set up EC2 instance
2. Install Node.js, MySQL, Redis
3. Clone repository
4. Configure environment variables
5. Start with PM2

```bash
pm2 start src/server.js --name "vibe-backend"
pm2 save
pm2 startup
```

## Monitoring

### Logs
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

### Health Check
```bash
curl http://localhost:3001/health
```

### Performance Metrics
```
GET /api/admin/dashboard/performance
```

## Troubleshooting

### Database Connection Failed
- Check MySQL is running
- Verify credentials in .env
- Check network connectivity

### Redis Connection Failed
- Check Redis is running
- Verify Redis host and port
- Use in-memory cache as fallback

### ML Service Timeout
- Check Python service is running
- Verify network connectivity to port 5000
- Check model file exists

## Support

For issues and questions:
1. Check logs in `logs/` directory
2. Review API documentation
3. Contact development team

## References

- [Express.js Documentation](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [Scikit-learn Documentation](https://scikit-learn.org)
