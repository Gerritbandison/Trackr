module.exports = {
  async up(db, client) {
    // Create departments collection with schema validation
    await db.createCollection('departments', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'department name and is required'
            },
            code: {
              bsonType: 'string',
              description: 'department code'
            },
            manager: {
              bsonType: 'objectId',
              description: 'user ID of department manager'
            },
            costCenter: {
              bsonType: 'string',
              description: 'cost center code'
            },
            budget: {
              bsonType: 'number',
              minimum: 0,
              description: 'department budget'
            },
            isActive: {
              bsonType: 'bool',
              description: 'department active status'
            },
            description: {
              bsonType: 'string',
              description: 'department description'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('departments').createIndex({ name: 1 }, { unique: true });
    await db.collection('departments').createIndex({ code: 1 }, { unique: true, sparse: true });
    await db.collection('departments').createIndex({ manager: 1 });
    await db.collection('departments').createIndex({ isActive: 1 });

    console.log('✓ Created departments collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('departments').drop();
    console.log('✓ Dropped departments collection');
  }
};
