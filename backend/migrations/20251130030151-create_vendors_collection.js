module.exports = {
  async up(db, client) {
    // Create vendors collection with schema validation
    await db.createCollection('vendors', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'vendor name and is required'
            },
            website: {
              bsonType: 'string',
              description: 'vendor website URL'
            },
            contactPerson: {
              bsonType: 'string',
              description: 'primary contact person name'
            },
            contactEmail: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'contact email address'
            },
            contactPhone: {
              bsonType: 'string',
              description: 'contact phone number'
            },
            address: {
              bsonType: 'object',
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
                state: { bsonType: 'string' },
                postalCode: { bsonType: 'string' },
                country: { bsonType: 'string' }
              }
            },
            category: {
              bsonType: 'string',
              description: 'vendor category (e.g., Hardware, Software, Services)'
            },
            rating: {
              bsonType: 'int',
              minimum: 1,
              maximum: 5,
              description: 'vendor rating (1-5 stars)'
            },
            isActive: {
              bsonType: 'bool',
              description: 'vendor active status'
            },
            notes: {
              bsonType: 'string',
              description: 'additional notes about vendor'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('vendors').createIndex({ name: 1 }, { unique: true });
    await db.collection('vendors').createIndex({ category: 1 });
    await db.collection('vendors').createIndex({ rating: -1 });
    await db.collection('vendors').createIndex({ isActive: 1 });
    await db.collection('vendors').createIndex({ contactEmail: 1 });

    console.log('✓ Created vendors collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('vendors').drop();
    console.log('✓ Dropped vendors collection');
  }
};
