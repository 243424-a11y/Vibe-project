# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│ React.js 18 + Redux Toolkit (vibe-frontend)                    │
│ - Real-time UI updates via Socket.IO                           │
│ - Image-rich auction display                                   │
│ - Authentication & dashboards                                  │
└─────────────────────────────────────────────────────────────────┘
          ↑                                      ↑
          │ HTTP/REST API                       │ WebSocket
          │ Axios                               │ Socket.IO Client
          ↓                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│ Express.js 4.18+ Server (vibe-backend)                         │
│ - Authentication & Authorization                               │
│ - Rate Limiting                                                │
│ - Request Validation                                           │
│ - CORS & Security Headers                                      │
└─────────────────────────────────────────────────────────────────┘
          ↑                                      ↑
          │ Native Queries                       │ Socket.IO Server
          │ Connection Pool                      │ Redis Adapter
          │                                      │
          ↓                                      ↓
    ┌──────────────┐                      ┌──────────────┐
    │   MySQL 8    │                      │   Redis 7    │
    │   Database   │                      │   Cache      │
    │              │                      │              │
    │ - Users      │                      │ - Sessions   │
    │ - Auctions   │                      │ - Bid Queue  │
    │ - Bids       │                      │ - Pub/Sub    │
    │ - Fraud Logs │                      │              │
    └──────────────┘                      └──────────────┘
                                               ↑
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │  Flask ML Service│
                                    │  (vibe-ml)       │
                                    │                  │
                                    │ - Fraud Scoring  │
                                    │ - ML Model       │
                                    │ - Feature Ext.   │
                                    └──────────────────┘
```

## Data Flow - Real-Time Bidding

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME BID PLACEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

1. CLIENT SIDE (Frontend)
   User clicks "Place Bid" → Input validation → Send to API

2. API LAYER (Backend)
   ├─ Authenticate user
   ├─ Validate bid amount
   ├─ Begin database transaction
   └─ Lock auction row (SELECT ... FOR UPDATE)

3. FRAUD DETECTION (ML Service)
   ├─ Extract features
   ├─ Score bid (< 100ms)
   └─ Flag if suspicious

4. DATABASE (MySQL)
   ├─ Insert bid record
   ├─ Update auction current_price
   ├─ Update highest_bidder_id
   ├─ Increment bid_count
   └─ Commit transaction

5. CACHE (Redis)
   ├─ Update auction cache
   └─ Queue bid broadcast

6. REAL-TIME (Socket.IO)
   ├─ Broadcast 'bidPlaced' to all in auction room
   ├─ Send 'userOutbid' to previous highest bidder
   └─ Update price in all clients (< 100ms total)

7. NOTIFICATIONS
   └─ Create notification record for outbid user
```

## Database Design

### Tables & Relationships

```
Users (1) ──────────────┬──────────── (M) Auctions
   |                    |
   |            ┌───────┴─────────┐
   |            |                 |
   └────────────┼──────────── Bids (M)
                |
           Auctions
                |
        ┌───────┴───────┐
        |               |
    AutoBids      FraudLogs

UserPreferences ──── (1:1) ──── Users
Notifications ────────────────── Users
```

### Key Design Patterns

1. **Connection Pooling** - MySQL connection pool (max 10)
2. **Caching Strategy** - Redis for auctions (5min), bids (30sec)
3. **Real-Time Updates** - Socket.IO rooms by auction_id
4. **Fraud Detection** - Async ML scoring via HTTP
5. **Error Handling** - Centralized middleware

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│              SECURITY LAYERS                        │
├─────────────────────────────────────────────────────┤
│ 1. HTTPS/TLS (Transport)                           │
│    └─ All communication encrypted                  │
│                                                     │
│ 2. AUTHENTICATION (JWT)                            │
│    └─ 15-min tokens + 7-day refresh               │
│                                                     │
│ 3. AUTHORIZATION (RBAC)                            │
│    └─ Roles: buyer, seller, admin                 │
│                                                     │
│ 4. INPUT VALIDATION                                │
│    └─ Sanitization + Type checking                │
│                                                     │
│ 5. RATE LIMITING                                   │
│    └─ 100 req/min global, 10 req/min bidding      │
│                                                     │
│ 6. FRAUD DETECTION (ML)                            │
│    └─ Real-time scoring > 85% accuracy            │
│                                                     │
│ 7. DATABASE SECURITY                               │
│    └─ Parameterized queries, encrypted passwords  │
└─────────────────────────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy
```
Auctions Detail   → 5 minutes (refreshed after bid)
Auctions List     → 2 minutes
User Profile      → 10 minutes
Bid History       → 30 seconds (frequent updates)
Categories        → 24 hours
```

### Database Optimization
```
Indexes:
- idx_auctions_status_endtime (status, end_time)
- idx_bids_auction_time (auction_id, bid_time DESC)
- idx_users_email (email)
- idx_users_blocked (is_blocked)

Query Strategies:
- Select only needed columns
- Use joins with indexes
- Pagination (limit 20 max)
- Connection pooling
```

### Frontend Optimization
```
Images:
- WebP with JPEG fallback
- < 150KB per image
- Lazy loading below fold
- CDN served

Code Splitting:
- Route-based splitting
- Component lazy loading
- Tree shaking

State Management:
- Redux selectors prevent re-renders
- React Query for API caching
- Memoization of expensive components
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│           PRODUCTION DEPLOYMENT                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  AWS EC2 Instance (t3.medium or larger)            │
│  ├─ Docker container: vibe-backend                 │
│  ├─ Docker container: vibe-frontend                │
│  ├─ Docker container: vibe-ml                      │
│  ├─ MySQL (AWS RDS recommended)                    │
│  └─ Redis (AWS ElastiCache recommended)            │
│                                                     │
│  Nginx Reverse Proxy                               │
│  ├─ Load balancing                                 │
│  ├─ SSL/TLS termination                            │
│  └─ Static file serving                            │
│                                                     │
│  PM2 Process Manager                               │
│  └─ Auto-restart on crash                          │
│                                                     │
│  CloudFlare CDN                                    │
│  └─ Image & static asset caching                   │
│                                                     │
│  Monitoring                                         │
│  ├─ New Relic / DataDog                            │
│  ├─ AWS CloudWatch                                 │
│  └─ Winston Logs                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## API Response Format

All API responses follow this structure:

```json
{
  "success": true/false,
  "data": { /* response data */ },
  "message": "Operation successful",
  "error": "Error message (if failed)",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling Flow

```
Request → Validation → Authentication → Authorization → Business Logic
                          ↓
                    Error Caught
                          ↓
                    Log to Winston
                          ↓
                    Sanitize Error
                          ↓
                    Return JSON Response
```

## Next Phase Implementations

1. **Auction APIs** - Full CRUD with image upload
2. **Auto-Bidding** - Background worker process
3. **Notification System** - WebSocket notifications
4. **Admin Dashboard** - Fraud monitoring & user management
5. **Analytics** - User behavior & sales metrics
6. **Performance** - Load testing & optimization

---

For detailed API documentation, see [API.md](./API.md)
