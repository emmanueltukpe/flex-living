// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('flexliving-reviews');

// Create application user with read/write permissions
db.createUser({
  user: 'flexliving',
  pwd: 'flexliving-password',
  roles: [
    {
      role: 'readWrite',
      db: 'flexliving-reviews'
    }
  ]
});

// Create indexes for better performance
db.reviews.createIndex({ "propertyId": 1 });
db.reviews.createIndex({ "status": 1 });
db.reviews.createIndex({ "source": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "createdAt": -1 });
db.reviews.createIndex({ "propertyId": 1, "status": 1 });

db.properties.createIndex({ "hostawayId": 1 }, { unique: true });
db.properties.createIndex({ "name": 1 });
db.properties.createIndex({ "location.city": 1 });

print('MongoDB initialization completed successfully');
