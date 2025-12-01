module.exports = {
  async up(db, client) {
    // Create notifications collection with schema validation
    await db.createCollection('notifications', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'type', 'title', 'message'],
          properties: {
            userId: {
              bsonType: 'objectId',
              description: 'user ID, required'
            },
            type: {
              bsonType: 'string',
              enum: ['info', 'warning', 'error', 'success'],
              description: 'notification type, required'
            },
            title: {
              bsonType: 'string',
              description: 'notification title, required'
            },
            message: {
              bsonType: 'string',
              description: 'notification message, required'
            },
            link: {
              bsonType: 'string',
              description: 'optional link field'
            },
            read: {
              bsonType: 'bool',
              description: 'read status'
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('notifications').createIndex({ userId: 1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ read: 1 });

    console.log('✓ Created notifications collection with schema validation and indexes');
  },

  async down(db, client) {
    await db.collection('notifications').drop();
    console.log('✓ Dropped notifications collection');
  }
};
