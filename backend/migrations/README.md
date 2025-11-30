# Database Migrations

This directory contains MongoDB database migrations for the Trackr ITAM application.

## Overview

We use `migrate-mongo` for managing database schema changes. Migrations ensure:
- **Version control** for database schema
- **Reproducible** database states across environments
- **Safe rollback** capabilities
- **Schema validation** at the database level
- **Proper indexing** for query performance

## Migration Scripts

```bash
# Run all pending migrations
npm run migrate:up

# Rollback the last migration
npm run migrate:down

# Check migration status
npm run migrate:status

# Create a new migration
npm run migrate:create <migration-name>
```

## Existing Migrations

### 1. `create_users_collection.js`
Creates the `users` collection with:
- **Schema validation**: Email format, role enum, required fields
- **Indexes**:
  - Unique email index
  - Role, department, isActive indexes
  - Timestamp index for sorting

### 2. `create_assets_collection.js`
Creates the `assets` collection with:
- **Schema validation**: Category and status enums, required fields
- **Indexes**:
  - Unique assetTag and serialNumber
  - Category, status, assignedTo, department indexes
  - Purchase date and warranty expiration indexes

### 3. `create_licenses_collection.js`
Creates the `licenses` collection with:
- **Schema validation**: License type enum, seat validation
- **Indexes**:
  - Compound name + vendor index
  - Type, category, status, compliance indexes
  - Expiration and purchase date indexes

### 4. `create_departments_collection.js`
Creates the `departments` collection with:
- **Schema validation**: Required name, budget constraints
- **Indexes**:
  - Unique name and code
  - Manager and isActive indexes

### 5. `create_vendors_collection.js`
Creates the `vendors` collection with:
- **Schema validation**: Email format, rating range (1-5)
- **Indexes**:
  - Unique name
  - Category, rating, isActive, contactEmail indexes

## Environment Configuration

Migrations use the MongoDB connection from environment variables:

```env
MONGO_URI=mongodb://localhost:27017/trackr
MONGO_DB_NAME=trackr  # Optional, extracted from URI if not provided
```

Configuration is defined in `migrate-mongo-config.js`.

## Creating New Migrations

### 1. Generate Migration File

```bash
npm run migrate:create add_new_field_to_users
```

### 2. Write Migration Logic

```javascript
module.exports = {
  async up(db, client) {
    // Forward migration
    await db.collection('users').updateMany(
      {},
      { $set: { newField: 'defaultValue' } }
    );
  },

  async down(db, client) {
    // Rollback migration
    await db.collection('users').updateMany(
      {},
      { $unset: { newField: '' } }
    );
  }
};
```

### 3. Run Migration

```bash
npm run migrate:up
```

## Best Practices

1. **Always write both `up` and `down`** functions
2. **Test migrations** on a copy of production data before deploying
3. **Make migrations idempotent** where possible
4. **Never modify** existing migration files once they've been run in production
5. **Backup database** before running migrations in production
6. **Use transactions** for critical multi-step migrations

## Migration Workflow

### Development
```bash
# Create and test migration locally
npm run migrate:create my_feature
# Edit migration file
npm run migrate:up
# Test application
npm run migrate:down  # If needed to rollback
```

### Staging/Production
```bash
# Check current status
npm run migrate:status

# Backup database first!
# Run migrations
npm run migrate:up

# Verify migrations were applied
npm run migrate:status
```

## Troubleshooting

### Migration Failed Mid-Way
```bash
# Check status to see what succeeded
npm run migrate:status

# Manually fix any data issues
# Then either:
# - Fix the migration and run again (dev only)
# - Rollback and fix (if safe)
npm run migrate:down
```

### Lock Issues
If migrations are stuck with a lock:
```javascript
// Connect to MongoDB and run:
db.changelog_lock.deleteMany({})
```

## Schema Validation

All collections have MongoDB schema validation enabled. This provides:
- **Data integrity** at the database level
- **Type safety** beyond application validation
- **Constraint enforcement** (enums, ranges, patterns)

To modify schema validation, create a new migration:
```javascript
await db.command({
  collMod: 'users',
  validator: { $jsonSchema: { /* new schema */ } }
});
```

## Monitoring

The `changelog` collection tracks all applied migrations:
```javascript
db.changelog.find().pretty()
```

This shows:
- Migration filename
- Applied timestamp
- File hash (if enabled)
