module.exports = {
  async up(db, client) {
    // Create assets collection with schema validation
    await db.createCollection('assets', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['assetTag', 'serialNumber', 'category', 'status'],
          properties: {
            assetTag: {
              bsonType: 'string',
              description: 'unique asset tag identifier and is required'
            },
            serialNumber: {
              bsonType: 'string',
              description: 'serial number and is required'
            },
            category: {
              bsonType: 'string',
              enum: ['laptop', 'desktop', 'server', 'network', 'mobile', 'printer', 'monitor', 'other'],
              description: 'asset category and is required'
            },
            status: {
              bsonType: 'string',
              enum: ['available', 'in-use', 'maintenance', 'retired', 'lost', 'disposed'],
              description: 'asset status and is required'
            },
            manufacturer: {
              bsonType: 'string',
              description: 'manufacturer name'
            },
            model: {
              bsonType: 'string',
              description: 'model name'
            },
            purchaseDate: {
              bsonType: 'date',
              description: 'purchase date'
            },
            purchaseCost: {
              bsonType: 'number',
              minimum: 0,
              description: 'purchase cost'
            },
            warrantyExpiration: {
              bsonType: 'date',
              description: 'warranty expiration date'
            },
            assignedTo: {
              bsonType: 'objectId',
              description: 'user ID if assigned'
            },
            location: {
              bsonType: 'string',
              description: 'physical location'
            },
            department: {
              bsonType: 'objectId',
              description: 'department ID'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('assets').createIndex({ assetTag: 1 }, { unique: true });
    await db.collection('assets').createIndex({ serialNumber: 1 }, { unique: true });
    await db.collection('assets').createIndex({ category: 1 });
    await db.collection('assets').createIndex({ status: 1 });
    await db.collection('assets').createIndex({ assignedTo: 1 });
    await db.collection('assets').createIndex({ department: 1 });
    await db.collection('assets').createIndex({ purchaseDate: -1 });
    await db.collection('assets').createIndex({ warrantyExpiration: 1 });

    console.log('✓ Created assets collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('assets').drop();
    console.log('✓ Dropped assets collection');
  }
};
