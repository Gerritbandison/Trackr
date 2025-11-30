module.exports = {
  async up(db, client) {
    // Create users collection with schema validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'must be a valid email address and is required'
            },
            password: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            name: {
              bsonType: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'must be a string between 2-100 characters and is required'
            },
            role: {
              bsonType: 'string',
              enum: ['admin', 'manager', 'staff'],
              description: 'must be admin, manager, or staff and is required'
            },
            department: {
              bsonType: 'string',
              description: 'optional department field'
            },
            isActive: {
              bsonType: 'bool',
              description: 'user active status'
            },
            lastLogin: {
              bsonType: 'date',
              description: 'last login timestamp'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ department: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });

    console.log('✓ Created users collection with schema validation and indexes');
  },

  async down(db, client) {
    // Drop users collection
    await db.collection('users').drop();
    console.log('✓ Dropped users collection');
  }
};
