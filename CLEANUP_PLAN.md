# Trackr Cleanup Plan

## Files to DELETE (Excess AI Bloat)

### Root Level Markdown (Delete 15+ files, keep only README.md)
- DEVELOPMENT.md
- DOCKER.md
- FUNCTIONAL_GAPS.md
- IMPLEMENTATION_STATUS.md
- LINUX_DEPLOYMENT_TEST.md
- MASTER_BRANCH_REVIEW.md
- MICROSOFT_INTEGRATION_REVIEW.md
- MOBILE_ACCESS_GUIDE.md
- PRODUCTION_READINESS_REVIEW.md
- QUICK_REFERENCE.md
- TROUBLESHOOTING_GUIDE.md

### Root Level Scripts (Move to scripts/ or delete)
- fix-deployment.sh (move to scripts/)
- test-deployment.sh (move to scripts/)
- deploy.sh (move to scripts/)

### Security Issues (Delete immediately)
- .env.prod (contains sensitive data)

### Duplicate Configs (Delete, keep only in proper locations)
- /postcss.config.js (frontend already has one)
- /tailwind.config.js (frontend already has one)
- /index.html (Vite handles this)

### Frontend Bloat
- frontend/docs/ (entire directory - AI-generated reviews)
- frontend/design-specs/ (mock data, move essentials to docs if needed)
- frontend/QUICK_REFERENCE.md (redundant)

### Backend (Audit but looks clean)
- Keep all (looks minimal)

## Result
- **Before:** 6.8MB (lots of markdown)
- **After:** ~4MB (core code only)
- **Lines of docs:** 6043 → ~500 (95% reduction)

## New Structure
```
Trackr/
├── README.md (trimmed to essentials)
├── .gitignore
├── docker-compose.yml
├── package.json
├── backend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile (if exists)
└── scripts/ (deployment scripts)
```
