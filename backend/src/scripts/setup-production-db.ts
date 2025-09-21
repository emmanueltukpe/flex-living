#!/usr/bin/env ts-node

/**
 * Production Database Setup Script
 *
 * This script sets up the production MongoDB database with:
 * - Required indexes for optimal performance
 * - Initial data seeding
 * - Database validation
 *
 * Usage: npm run setup-db
 */

import mongoose from "mongoose";
import { env } from "../config";
import { seedDatabase } from "../utils/seedDatabase";
import Review from "../models/Review";
import Property from "../models/Property";

interface IndexDefinition {
  collection: string;
  index: Record<string, number>;
  options?: mongoose.mongo.CreateIndexesOptions;
}

const REQUIRED_INDEXES: IndexDefinition[] = [
  // Reviews collection indexes
  { collection: "reviews", index: { propertyId: 1 } },
  { collection: "reviews", index: { status: 1 } },
  { collection: "reviews", index: { source: 1 } },
  { collection: "reviews", index: { rating: 1 } },
  { collection: "reviews", index: { createdAt: -1 } },
  { collection: "reviews", index: { propertyId: 1, status: 1 } },
  { collection: "reviews", index: { propertyId: 1, source: 1 } },
  {
    collection: "reviews",
    index: { "guest.email": 1 },
    options: { sparse: true },
  },

  // Properties collection indexes
  {
    collection: "properties",
    index: { hostawayId: 1 },
    options: { unique: true, sparse: true },
  },
  { collection: "properties", index: { name: 1 } },
  { collection: "properties", index: { "location.city": 1 } },
  { collection: "properties", index: { "location.country": 1 } },
  { collection: "properties", index: { status: 1 } },
];

class DatabaseSetup {
  private connection: mongoose.Connection | null = null;

  async connect(): Promise<void> {
    try {
      const mongoUri = env.mongoUri || process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is required");
      }

      console.log("🔌 Connecting to MongoDB...");
      await mongoose.connect(mongoUri);
      this.connection = mongoose.connection;
      console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async createIndexes(): Promise<void> {
    if (!this.connection) {
      throw new Error("Database connection not established");
    }

    console.log("📊 Creating database indexes...");

    for (const indexDef of REQUIRED_INDEXES) {
      try {
        const collection = this.connection.collection(indexDef.collection);
        await collection.createIndex(indexDef.index, indexDef.options || {});
        console.log(
          `✅ Created index on ${indexDef.collection}:`,
          indexDef.index
        );
      } catch (error) {
        console.error(
          `❌ Failed to create index on ${indexDef.collection}:`,
          error
        );
        throw error;
      }
    }

    console.log("✅ All indexes created successfully");
  }

  async validateDatabase(): Promise<void> {
    console.log("🔍 Validating database setup...");

    // Check if collections exist
    if (!this.connection || !this.connection.db) {
      throw new Error("Database connection not established");
    }
    const collections = await this.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log("📁 Found collections:", collectionNames);

    // Validate models
    try {
      await Review.init();
      await Property.init();
      console.log("✅ Models validated successfully");
    } catch (error) {
      console.error("❌ Model validation failed:", error);
      throw error;
    }

    // Check indexes
    for (const indexDef of REQUIRED_INDEXES) {
      try {
        const collection = this.connection!.collection(indexDef.collection);
        const indexes = await collection.listIndexes().toArray();
        console.log(
          `📊 ${indexDef.collection} indexes:`,
          indexes.map((i) => i.name)
        );
      } catch (error) {
        console.warn(
          `⚠️  Could not list indexes for ${indexDef.collection}:`,
          error
        );
      }
    }
  }

  async seedInitialData(): Promise<void> {
    console.log("🌱 Seeding initial data...");

    try {
      await seedDatabase();
      console.log("✅ Initial data seeded successfully");
    } catch (error) {
      console.error("❌ Failed to seed initial data:", error);
      throw error;
    }
  }

  async getStats(): Promise<void> {
    console.log("📈 Database statistics:");

    try {
      const reviewCount = await Review.countDocuments();
      const propertyCount = await Property.countDocuments();

      console.log(`  📝 Reviews: ${reviewCount}`);
      console.log(`  🏠 Properties: ${propertyCount}`);

      if (!this.connection || !this.connection.db) {
        throw new Error("Database connection not established");
      }
      const dbStats = await this.connection.db.stats();
      console.log(
        `  💾 Database size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`  📊 Collections: ${dbStats.collections}`);
      console.log(`  🔢 Indexes: ${dbStats.indexes}`);
    } catch (error) {
      console.error("❌ Failed to get database stats:", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

async function main() {
  const setup = new DatabaseSetup();

  try {
    await setup.connect();
    await setup.createIndexes();
    await setup.validateDatabase();
    await setup.seedInitialData();
    await setup.getStats();

    console.log("🎉 Database setup completed successfully!");
  } catch (error) {
    console.error("💥 Database setup failed:", error);
    process.exit(1);
  } finally {
    await setup.disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseSetup };
