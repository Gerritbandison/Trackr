# Docker Quick Start Guide

## Development Mode (Recommended)

Start all services with hot-reload:
```bash
docker-compose up
```

Stop all services:
```bash
docker-compose down
```

Rebuild after code changes:
```bash
docker-compose up --build
```

## Production Mode

Build and start production containers:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## Individual Services

Start only backend + database:
```bash
docker-compose up backend mongo
```

Start only frontend:
```bash
docker-compose up frontend
```

## Useful Commands

View logs:
```bash
docker-compose logs -f
docker-compose logs -f backend  # specific service
```

Access MongoDB shell:
```bash
docker-compose exec mongo mongosh trackr
```

Access backend shell:
```bash
docker-compose exec backend sh
```

Clean everything (including volumes):
```bash
docker-compose down -v
```

## Health Checks

- Backend: http://localhost:5000/health
- Frontend: http://localhost:5173
- MongoDB: Port 27017

## Troubleshooting

**Containers won't start:**
```bash
docker-compose down -v
docker-compose up --build
```

**Port already in use:**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

**MongoDB connection issues:**
- Wait for health check to pass (check logs)
- Backend will retry connection 5 times
