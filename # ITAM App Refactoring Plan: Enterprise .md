# ITAM App Refactoring Plan: Enterprise Architecture

## Project Goal
Refactor the existing "Trackr" ITAM application from a flat structure into a Domain-Driven Design (DDD) architecture to support scalability, role-based access, and automated lifecycle management.

## Architectural Guidelines
- **Pattern:** Feature-based modular architecture.
- **Strict Separation:** Business logic must reside in `services`, not `controllers`.
- **Type Safety:** All data passing between frontend and backend must be typed (Interfaces/DTOs).

---

## Phase 1: Scaffold & Structure (Backend)
**Objective:** create the directory tree and move existing logic without breaking the app.

1. **Create Directory Tree:**
   - `/backend/src/modules/assets`
   - `/backend/src/modules/licenses`
   - `/backend/src/modules/maintenance`
   - `/backend/src/core/middleware` (Auth, ErrorHandling)

2. **Refactor Assets Module:**
   - Identify all current asset-related routes and move them to `modules/assets/asset.routes.ts`.
   - Extract database logic into `modules/assets/asset.service.ts`.
   - Ensure the `Asset` model includes fields for: `purchaseDate`, `depreciationType`, `assignedUser`, `status` (Active, Retired, Repair).

3. **Implement Core Middleware:**
   - Create a centralized Error Handler in `core/middleware/error.middleware.ts`.
   - Ensure standard API response format: `{ success: boolean, data: any, error: string | null }`.

## Phase 2: Frontend Feature Alignment
**Objective:** Align frontend `features` folder with backend `modules`.

1. **Component Migration:**
   - Move generic UI elements (Buttons, Cards) to `src/components/ui`.
   - Move Asset-specific views (Tables, Forms) to `src/features/assets/components`.

2. **State & Data Fetching:**
   - Create a custom hook `src/features/assets/hooks/useAssets.ts` that centralizes all API calls for assets.
   - Ensure API calls use the standard response format defined in Phase 1.

## Phase 3: Enterprise Features (New Implementation)
**Objective:** Add "Real World" ITAM functionality.

1. **Depreciation Engine:**
   - Create a service method `calculateDepreciation(assetId)` in the backend that uses "Straight Line" depreciation logic.
   - Formula: `(PurchasePrice - SalvageValue) / UsefulLife`.

2. **Audit Logging:**
   - Create a middleware that intercepts POST/PUT/DELETE requests and logs the action to a `HistoryLogs` collection in the DB.
   - Structure: `[Timestamp, ActorID, Action, PreviousValue, NewValue]`.