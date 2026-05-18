# Setup Guide for V.I.B.E Project

## Prerequisites

- Node.js 18+
- Python 3.9+
- MySQL 8.0+
- Redis 7.0+
- Docker & Docker Compose (optional)
- Git

## Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd "FYP PROJECT"
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

#### Option A: Using Docker Compose
```bash
docker-compose up -d mysql redis
docker exec vibe_mysql mysql -u root -proot vibe_db < database/schema.sql
```

#### Option B: Manual MySQL
```bash
# Create database and import schema
mysql -u root -p < database/schema.sql
```

### 4. Backend Setup
```bash
cd vibe-backend
npm install
npm run dev      # Runs on http://localhost:3001
```

### 5. Frontend Setup
```bash
cd vibe-frontend
npm install
npm start        # Runs on http://localhost:3000
```

### 6. ML Service Setup
```bash
cd vibe-ml
pip install -r requirements.txt
python src/app.py     # Runs on http://localhost:5000
```

## Using Docker Compose

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ml_service
```

## Testing Authentication

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
vibe-backend/
├── src/
│   ├── config/       # Database, Redis, JWT, Socket.IO configs
│   ├── routes/       # API endpoints
│   ├── controllers/  # Business logic (to be implemented)
│   ├── services/     # Reusable services
│   ├── middleware/   # Auth, validation, error handling
│   └── utils/        # Helper functions
├── tests/            # Unit tests
└── package.json

vibe-frontend/
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── redux/        # Redux store & slices
│   ├── services/     # API client (to be implemented)
│   └── utils/        # Utilities
└── public/           # Static assets

vibe-ml/
├── src/
│   ├── app.py        # Flask server
│   ├── model.py      # Model loading (to be implemented)
│   └── features.py   # Feature extraction (to be implemented)
├── models/           # Trained model files
├── training/         # Training scripts (to be implemented)
└── requirements.txt
```

## Common Commands

### Backend
```bash
npm run dev           # Start with nodemon
npm run test          # Run unit tests
npm run lint          # Run ESLint
npm run build         # Build for production
```

### Frontend
```bash
npm start             # Start development server
npm run build         # Build for production
npm test              # Run tests
npm run eject         # Eject from Create React App
```

### ML Service
```bash
python src/app.py     # Start Flask server
python -m pytest      # Run tests (when added)
```

## Troubleshooting

### Database Connection Error
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in .env file
- Ensure database `vibe_db` exists

### Redis Connection Error
- Check Redis is running: `redis-cli ping`
- Verify Redis URL in .env file

### Port Already in Use
- Change PORT in .env or kill existing process
- Windows: `netstat -ano | findstr :PORT` then `taskkill /PID <PID> /F`
- Mac/Linux: `lsof -i :PORT` then `kill -9 <PID>`

### Module Not Found Errors
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- For Python: `pip install -r requirements.txt`

## Next Steps (Phase 2)

1. **Auction APIs** - Implement full CRUD operations
2. **Bidding System** - Real-time bid placement and updates
3. **Fraud Detection** - Train and integrate ML model
4. **Admin Dashboard** - Monitoring and user management
5. **Image Upload** - AWS S3 integration
6. **Socket.IO** - Real-time updates
7. **Testing** - Comprehensive test coverage
8. **Deployment** - AWS EC2 setup

## Support & Help

For issues or questions:
- Check GitHub issues
- Contact supervisor: Sir Zulfiqar Khan
- Team members: Mehtab Khan, Mohammad Rafiq, Furqan Ullah

---

Last Updated: January 2025
