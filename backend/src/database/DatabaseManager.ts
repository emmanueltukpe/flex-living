import mongoose from "mongoose";
import { DatabaseConfig } from "../types";
import { DatabaseError } from "../types/validation";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;
  private connectionString: string;
  private connectionOptions: mongoose.ConnectOptions;

  private constructor(config: DatabaseConfig) {
    this.connectionString = config.uri;
    this.connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      ...config.options,
    };

    this.setupEventListeners();
  }

  public static getInstance(config?: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!config) {
        throw new DatabaseError(
          "Database configuration is required for first initialization"
        );
      }
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(this.connectionString, this.connectionOptions);
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw new DatabaseError("Failed to connect to MongoDB", error as Error);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
    } catch (error) {
      throw new DatabaseError(
        "Failed to disconnect from MongoDB",
        error as Error
      );
    }
  }

  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[mongoose.connection.readyState] || "unknown";
  }

  public async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    state: string;
    host?: string;
    database?: string;
    error?: string;
  }> {
    try {
      const state = this.getConnectionState();

      if (state !== "connected") {
        return {
          status: "unhealthy",
          state,
          error: "Database not connected",
        };
      }

      // Test the connection with a simple operation
      if (!mongoose.connection.db) {
        throw new Error("Database connection not established");
      }
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        state,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        state: this.getConnectionState(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async getStats(): Promise<{
    connections: number;
    collections: number;
    indexes: number;
    dataSize: number;
    storageSize: number;
  }> {
    try {
      if (!this.isConnectionActive()) {
        throw new DatabaseError("Database not connected");
      }

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not established");
      }

      const stats = await db.stats();
      const collections = await db.listCollections().toArray();

      let totalIndexes = 0;
      for (const collection of collections) {
        const indexes = await db.collection(collection.name).indexes();
        totalIndexes += indexes.length;
      }

      return {
        connections: mongoose.connections.length,
        collections: stats.collections,
        indexes: totalIndexes,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
      };
    } catch (error) {
      throw new DatabaseError(
        "Failed to get database statistics",
        error as Error
      );
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
    });

    mongoose.connection.on("error", (error) => {
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      this.isConnected = true;
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  public static async createConnection(
    uri: string,
    options?: mongoose.ConnectOptions
  ): Promise<DatabaseManager> {
    const config: DatabaseConfig = {
      uri,
      options,
    };

    const manager = DatabaseManager.getInstance(config);
    await manager.connect();
    return manager;
  }

  public static async closeConnection(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.disconnect();
    }
  }
}
