# Trackr - IT Asset Management Platform

Professional IT asset management system for tracking hardware, licenses, and warranties.

---

## Stack

**Frontend:**
- React 19 + TypeScript
- Vite build system
- TailwindCSS styling
- Zustand state management
- React Query data fetching

**Backend:**
- Node.js + Express + TypeScript
- MongoDB database
- JWT authentication
- RESTful API

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (or use Docker)

### Development

```bash
# Install dependencies
npm install

# Start backend (port 5000)
cd backend
npm run dev

# Start frontend (port 5173)
cd frontend
npm run dev
```

**Access:** http://localhost:5173

### Production (Docker)

```bash
# Build and run all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access:** http://localhost:3000

---

## Environment Configuration

### Backend `.env`
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/trackr
JWT_SECRET=your-secret-key-here
PORT=5000

# Optional
NODE_ENV=development
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Trackr ITAM
```

---

## Core Features

### Asset Management
- Hardware inventory tracking
- QR code generation
- Warranty monitoring
- Depreciation calculationsLicense Management
- Software license tracking
- Compliance monitoring
- Seat utilization
- Renewal alerts

### Reporting
- Custom report builder
- Financial dashboards
- Compliance reports
- Export to CSV/PDF

### Security
- JWT authentication
- Role-based access control (Admin, Manager, Staff)
- Audit logging
- Data encryption

---

## Project Structure

```
Trackr/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   └── server.ts       # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API calls
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Root component
│   └── package.json
│
├── docker-compose.yml      # Docker orchestration
├── package.json            # Root workspace
└── scripts/                # Deployment scripts
```

---

## API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout

**Assets:**
- `GET /api/v1/assets` - List assets
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/:id` - Get asset details
- `PUT /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset

**Licenses:**
- `GET /api/v1/licenses` - List licenses
- `POST /api/v1/licenses` - Create license
- `GET /api/v1/licenses/:id` - Get license details
- `PUT /api/v1/licenses/:id` - Update license

**Reports:**
- `GET /api/v1/reports/assets` - Asset summary
- `GET /api/v1/reports/licenses` - License utilization
- `GET /api/v1/reports/financial` - Financial analysis

---

## Testing

### Frontend
```bash
cd frontend
npm run test              # Unit tests (Vitest)
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests (Playwright)
```

### Backend
```bash
cd backend
npm run test              # All tests (Jest)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report
```

---

## Deployment

### Option 1: Docker (Recommended)
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=3
```

### Option 2: Manual
```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Start services
npm start
```

See `scripts/` directory for deployment automation.

---

## Database Migrations

```bash
cd backend

# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create <name>
```

---

## Performance Optimization

**Frontend:**
- Code splitting (React.lazy)
- Asset compression (Vite plugin)
- Image optimization (WebP format)
- Service worker caching

**Backend:**
- MongoDB indexing
- Redis caching (optional)
- Rate limiting (express-rate-limit)
- Response compression

---

## Security Best Practices

1. **Never commit `.env` files** (use `.env.example` templates)
2. **Rotate JWT secrets** regularly
3. **Use HTTPS** in production
4. **Enable rate limiting** on auth endpoints
5. **Validate all inputs** (Zod schemas)
6. **Sanitize user data** before storage
7. **Implement CORS** properly
8. **Log security events** (Winston)

---

## Troubleshooting

**Backend won't start:**
```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/trackr

# Verify environment variables
cat backend/.env

# Check port availability
lsof -i :5000
```

**Frontend build fails:**
```bash
# Clear cache
rm -rf frontend/node_modules frontend/.vite
cd frontend && npm install

# Check Node version
node --version  # Should be v18+
```

**Docker issues:**
```bash
# Reset containers
docker-compose down -v
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

---

## License

MIT

---

## Support

**Issues:** https://github.com/Gerritbandison/Trackr/issues  
**Docs:** See `scripts/` directory for deployment guides
