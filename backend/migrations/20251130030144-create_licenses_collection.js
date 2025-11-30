module.exports = {
  async up(db, client) {
    // Create licenses collection with schema validation
    await db.createCollection('licenses', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'vendor', 'type', 'totalSeats', 'usedSeats'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'license name and is required'
            },
            vendor: {
              bsonType: 'string',
              description: 'vendor name and is required'
            },
            type: {
              bsonType: 'string',
              enum: ['perpetual', 'subscription', 'user-based', 'device-based'],
              description: 'license type and is required'
            },
            category: {
              bsonType: 'string',
              description: 'license category (e.g., Productivity, Security)'
            },
            totalSeats: {
              bsonType: 'int',
              minimum: 0,
              description: 'total number of available seats and is required'
            },
            usedSeats: {
              bsonType: 'int',
              minimum: 0,
              description: 'number of used seats and is required'
            },
            availableSeats: {
              bsonType: 'int',
              minimum: 0,
              description: 'calculated available seats'
            },
            purchaseDate: {
              bsonType: 'date',
              description: 'purchase date'
            },
            expirationDate: {
              bsonType: 'date',
              description: 'expiration date'
            },
            purchaseCost: {
              bsonType: 'number',
              minimum: 0,
              description: 'purchase cost'
            },
            renewalCost: {
              bsonType: 'number',
              minimum: 0,
              description: 'renewal cost'
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'expiring', 'expired', 'cancelled'],
              description: 'license status'
            },
            complianceStatus: {
              bsonType: 'string',
              enum: ['compliant', 'at-risk', 'non-compliant'],
              description: 'compliance status based on usage'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('licenses').createIndex({ name: 1, vendor: 1 });
    await db.collection('licenses').createIndex({ vendor: 1 });
    await db.collection('licenses').createIndex({ type: 1 });
    await db.collection('licenses').createIndex({ category: 1 });
    await db.collection('licenses').createIndex({ status: 1 });
    await db.collection('licenses').createIndex({ complianceStatus: 1 });
    await db.collection('licenses').createIndex({ expirationDate: 1 });
    await db.collection('licenses').createIndex({ purchaseDate: -1 });

    console.log('✓ Created licenses collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('licenses').drop();
    console.log('✓ Dropped licenses collection');
  }
};
