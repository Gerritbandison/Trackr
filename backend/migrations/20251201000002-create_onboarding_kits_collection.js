module.exports = {
  async up(db, client) {
    // Create onboardingkits collection with schema validation
    await db.createCollection('onboardingkits', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'createdBy'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            description: {
              bsonType: 'string',
              description: 'optional description field'
            },
            department: {
              bsonType: 'string',
              description: 'optional department field'
            },
            role: {
              bsonType: 'string',
              description: 'optional role field'
            },
            assets: {
              bsonType: 'array',
              items: { bsonType: 'objectId' },
              description: 'array of asset group ObjectIds'
            },
            licenses: {
              bsonType: 'array',
              items: { bsonType: 'objectId' },
              description: 'array of license ObjectIds'
            },
            isActive: {
              bsonType: 'bool',
              description: 'kit active status'
            },
            createdBy: {
              bsonType: 'objectId',
              description: 'user who created the kit, required'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('onboardingkits').createIndex({ department: 1, role: 1 });
    await db.collection('onboardingkits').createIndex({ isActive: 1 });
    await db.collection('onboardingkits').createIndex({ createdAt: -1 });

    console.log('✓ Created onboardingkits collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('onboardingkits').drop();
    console.log('✓ Dropped onboardingkits collection');
  }
};
