module.exports = {
  async up(db, client) {
    // Create asset_groups collection with schema validation
    await db.createCollection('assetgroups', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'category', 'currentStock', 'createdBy'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            description: {
              bsonType: 'string',
              description: 'optional description field'
            },
            category: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            minStock: {
              bsonType: 'int',
              minimum: 0,
              description: 'optional minimum stock level'
            },
            currentStock: {
              bsonType: 'int',
              minimum: 0,
              description: 'current stock count, required'
            },
            location: {
              bsonType: 'string',
              description: 'optional location field'
            },
            assets: {
              bsonType: 'array',
              items: { bsonType: 'objectId' },
              description: 'array of asset ObjectIds'
            },
            createdBy: {
              bsonType: 'objectId',
              description: 'user who created the group, required'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('assetgroups').createIndex({ name: 'text', description: 'text' });
    await db.collection('assetgroups').createIndex({ category: 1 });
    await db.collection('assetgroups').createIndex({ currentStock: 1 });
    await db.collection('assetgroups').createIndex({ createdAt: -1 });

    console.log('✓ Created assetgroups collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('assetgroups').drop();
    console.log('✓ Dropped assetgroups collection');
  }
};
