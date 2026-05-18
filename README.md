# V.I.B.E (Validated Intelligent Bidding Engine)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-yellow)
![Team](https://img.shields.io/badge/team-Air%20University%20Islamabad-green)

A production-ready, real-time intelligent auction platform with fraud detection, built for the Final Year Project at Air University Islamabad.

## 🎯 Quick Features

- ⚡ **Real-Time Bidding** - < 100ms bid-to-broadcast latency
- 🤖 **ML Fraud Detection** - > 85% accuracy shill bidding detection
- 🔐 **Production Security** - JWT, bcryptjs, RBAC, rate limiting
- 📊 **Professional UI** - Image-rich, responsive design
- 📈 **High Performance** - Optimized queries, caching, compression
- 🌍 **Scalable Architecture** - Docker, Redis, WebSockets

## 📁 Project Structure

```
FYP PROJECT/
├── vibe-backend/          # Node.js + Express server
│   ├── src/
│   │   ├── config/        # Database, Redis, JWT configs
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database queries
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── services/      # Reusable services (email, storage, etc)
│   │   └── utils/         # Helper functions
│   ├── tests/             # Jest unit tests
│   ├── package.json
│   └── Dockerfile
│
├── vibe-frontend/         # React 18 + Redux
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # Redux store, slices
│   │   ├── services/      # API client, Socket.IO
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utilities
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── vibe-ml/               # Python + Flask ML Service
│   ├── src/
│   │   ├── app.py         # Flask server
│   │   ├── model.py       # ML model loading/scoring
│   │   └── features.py    # Feature extraction
│   ├── models/            # Trained model files
│   ├── training/          # Training scripts
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   ├── schema.sql         # Complete database schema
│   ├── migrations/        # Migration scripts
│   └── seeds/             # Sample data
│
├── docs/                  # Documentation
│   ├── API.md             # API documentation
│   ├── SETUP.md           # Setup guide
│   └── ARCHITECTURE.md    # Architecture decisions
│
├── docker-compose.yml     # Docker orchestration
├── .env.example           # Environment template
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- Python 3.9+
- MySQL 8.0+
- Redis 7.0+

### Option 1: Docker (Recommended)

```bash
# 1. Clone and setup
git clone <repo-url>
cd "FYP PROJECT"

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Initialize database
docker exec vibe_mysql mysql -u root -p<root> vibe_db < database/schema.sql

# Access services:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# ML Service: http://localhost:5000
```

### Option 2: Local Setup

#### Backend
```bash
cd vibe-backend
npm install
npm run dev          # Runs on port 3001
```

#### Frontend
```bash
cd vibe-frontend
npm install
npm start            # Runs on port 3000
```

#### ML Service
```bash
cd vibe-ml
pip install -r requirements.txt
python src/app.py    # Runs on port 5000
```

## 📊 Database Setup

```bash
# Create database and tables
mysql -u root -p < database/schema.sql

# Or using Docker
docker exec vibe_mysql mysql -u root -p<root> vibe_db < database/schema.sql
```

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.2, Redux Toolkit, Socket.IO Client, TailwindCSS |
| **Backend** | Node.js 18+, Express 4.18+, Socket.IO 4.5+ |
| **Database** | MySQL 8.0+, Redis 7.0+ |
| **Authentication** | JWT, bcryptjs |
| **ML/AI** | Python 3.9+, Scikit-learn, Flask |
| **Deployment** | Docker, AWS EC2, PM2 |
| **Testing** | Jest, Supertest |
| **Monitoring** | Winston, New Relic |

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Auction Endpoints
- `GET /api/auctions` - List all auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create new auction
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction (admin only)

### Bidding Endpoints (Real-Time)
- `POST /api/bids` - Place bid (< 100ms latency)
- `GET /api/auctions/:id/bids` - Get auction bids
- `GET /api/users/:id/bids` - Get user's bids

### Auto-Bid Endpoints
- `POST /api/auto-bids` - Enable auto-bidding
- `DELETE /api/auto-bids/:id` - Disable auto-bidding

See [docs/API.md](docs/API.md) for complete documentation.

## 🤖 ML Fraud Detection

Real-time fraud scoring with > 85% accuracy:

- **Ensemble Model**: Random Forest + Isolation Forest
- **Features**: Bid frequency, patterns, account behavior, device/IP, temporal, context
- **Response Time**: < 100ms per bid
- **Fraud Types**: Shill bidding, bot behavior, price manipulation, rapid bidding, sniping patterns

## ⚡ Performance Targets

| Metric | Target |
|--------|--------|
| Bid placement → broadcast | < 100ms |
| Database queries | < 200ms |
| API response time | < 300ms |
| Frontend LCP | < 2.5s |
| Concurrent users | 1000+ |
| Test coverage | > 80% |

## 🔐 Security Features

✅ JWT authentication (15 min tokens)
✅ bcryptjs password hashing (12 rounds)
✅ Role-based access control (RBAC)
✅ Rate limiting (100 req/min global)
✅ SQL injection prevention (parameterized queries)
✅ XSS protection (input sanitization)
✅ CSRF token validation
✅ HTTPS/TLS enforcement
✅ HTTP-only cookies
✅ Device fingerprinting

## 📝 Environment Variables

Create `.env` file (see `.env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vibe_db

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=15m

# Redis
REDIS_URL=redis://localhost:6379

# ML Service
ML_SERVICE_URL=http://localhost:5000
```

## 🧪 Testing

```bash
# Backend tests
cd vibe-backend
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Frontend tests
cd vibe-frontend
npm test              # Run tests
npm run test:coverage # Coverage report
```

## 📦 Build & Deployment

### Production Build

```bash
# Backend
cd vibe-backend
npm run build
npm start

# Frontend
cd vibe-frontend
npm run build
# Serve build/ directory

# ML Service
cd vibe-ml
python src/app.py
```

### Docker Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

## 📈 Performance Monitoring

- **New Relic / DataDog** - Backend monitoring
- **Lighthouse** - Frontend performance
- **Apache JMeter** - Load testing
- **Winston Logger** - Application logging
- **Redis** - Cache metrics

## 👥 Team

- **Supervisor**: Sir Zulfiqar Khan
- **Developer 1**: Mehtab Khan
- **Developer 2**: Mohammad Rafiq
- **Developer 3**: Furqan Ullah

## 📅 Project Timeline

- **Week 1-2**: Database + Backend APIs ✅
- **Week 3-4**: Authentication + Bidding Logic
- **Week 5-6**: Frontend + Real-time Integration
- **Week 7-8**: ML Fraud Detection + Testing
- **Week 9-10**: Optimization + Security
- **Week 11-12**: Documentation + Final Testing
- **Week 13-24**: Refinement + Deployment

## 📞 Support & Escalation

- Database issues: Contact supervisor
- Real-time issues: Check Socket.IO docs
- ML problems: Consult ML team member
- Deployment issues: Reference AWS docs

## 📄 License

This project is created for Air University Islamabad FYP. All rights reserved.

---

**Created**: January 2024  
**Version**: 1.0.0  
**Last Updated**: January 2025

For detailed documentation, see [docs/SETUP.md](docs/SETUP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
