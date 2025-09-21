#!/usr/bin/env ts-node

/**
 * Database Migration Script
 * 
 * This script handles database migrations for schema changes and data transformations.
 * Each migration is versioned and tracked to ensure they run only once.
 * 
 * Usage: npm run migrate
 */

import mongoose from 'mongoose';
import { env } from '../config';

interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

// Migration tracking schema
const migrationSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
});

const MigrationModel = mongoose.model('Migration', migrationSchema);

class DatabaseMigrator {
  private connection: mongoose.Connection | null = null;

  async connect(): Promise<void> {
    try {
      const mongoUri = env.mongoUri || process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      console.log('🔌 Connecting to MongoDB for migrations...');
      await mongoose.connect(mongoUri);
      this.connection = mongoose.connection;
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async getAppliedMigrations(): Promise<string[]> {
    const appliedMigrations = await MigrationModel.find({ success: true }).sort({ appliedAt: 1 });
    return appliedMigrations.map(m => m.version);
  }

  async applyMigration(migration: Migration): Promise<void> {
    console.log(`🔄 Applying migration ${migration.version}: ${migration.description}`);
    
    try {
      await migration.up();
      
      // Record successful migration
      await MigrationModel.create({
        version: migration.version,
        description: migration.description,
        success: true
      });
      
      console.log(`✅ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      
      // Record failed migration
      await MigrationModel.create({
        version: migration.version,
        description: migration.description,
        success: false
      });
      
      throw error;
    }
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    console.log('📋 Applied migrations:', appliedMigrations);

    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.version));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Define your migrations here
const MIGRATIONS: Migration[] = [
  {
    version: '001_initial_setup',
    description: 'Initial database setup with indexes',
    up: async () => {
      // This migration is handled by the setup script
      console.log('Initial setup migration - handled by setup script');
    }
  },
  
  {
    version: '002_add_review_categories',
    description: 'Add categories field to reviews for better categorization',
    up: async () => {
      const reviewsCollection = mongoose.connection.collection('reviews');
      
      // Add categories field to existing reviews
      await reviewsCollection.updateMany(
        { categories: { $exists: false } },
        { 
          $set: { 
            categories: [] 
          } 
        }
      );
      
      console.log('Added categories field to reviews');
    }
  },
  
  {
    version: '003_add_property_amenities',
    description: 'Add amenities field to properties',
    up: async () => {
      const propertiesCollection = mongoose.connection.collection('properties');
      
      // Add amenities field to existing properties
      await propertiesCollection.updateMany(
        { amenities: { $exists: false } },
        { 
          $set: { 
            amenities: [] 
          } 
        }
      );
      
      console.log('Added amenities field to properties');
    }
  },
  
  {
    version: '004_normalize_review_sources',
    description: 'Normalize review source values',
    up: async () => {
      const reviewsCollection = mongoose.connection.collection('reviews');
      
      // Normalize source values
      await reviewsCollection.updateMany(
        { source: { $regex: /hostaway/i } },
        { $set: { source: 'hostaway' } }
      );
      
      await reviewsCollection.updateMany(
        { source: { $regex: /google/i } },
        { $set: { source: 'google' } }
      );
      
      await reviewsCollection.updateMany(
        { source: { $regex: /manual/i } },
        { $set: { source: 'manual' } }
      );
      
      console.log('Normalized review source values');
    }
  }
];

async function main() {
  const migrator = new DatabaseMigrator();
  
  try {
    await migrator.connect();
    await migrator.runMigrations(MIGRATIONS);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseMigrator, MIGRATIONS };
