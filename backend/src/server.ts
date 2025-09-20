import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { DatabaseManager } from "./database/DatabaseManager";
import { ServerConfig } from "./types";
import reviewRoutes from "./routes/reviews";
import propertyRoutes from "./routes/properties";
import hostawayRoutes from "./routes/hostaway";
import googleRoutes from "./routes/google";
import { seedDatabase } from "./utils/seedDatabase";
import { env } from "./config";

dotenv.config();

class Server {
  private app: express.Application;
  private config: ServerConfig;
  private databaseManager: DatabaseManager | null = null;

  constructor() {
    this.app = express();
    this.config = this.loadConfiguration();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private loadConfiguration(): ServerConfig {
    return {
      port: typeof env.port === "string" ? parseInt(env.port, 10) : env.port,
      corsOrigin: env.corsOrigin,
      mongoUri: env.mongoUri || "mongodb://localhost:27017/flexliving-reviews",
    };
  }

  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Load OpenAPI specification
    const swaggerDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));

    // Update server URL in the OpenAPI spec to match current configuration
    if (swaggerDocument.servers && swaggerDocument.servers[0]) {
      swaggerDocument.servers[0].url = `http://localhost:${this.config.port}`;
    }

    // Swagger UI setup
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "FlexLiving Reviews API Documentation",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
        },
      })
    );

    // Root redirect to API documentation
    this.app.get("/", (req, res) => {
      res.redirect("/api-docs");
    });

    // Additional Swagger UI routes for convenience
    this.app.get("/docs", (req, res) => {
      res.redirect("/api-docs");
    });

    this.app.get("/swagger", (req, res) => {
      res.redirect("/api-docs");
    });

    // API routes
    this.app.use("/api/reviews", reviewRoutes);
    this.app.use("/api/properties", propertyRoutes);
    this.app.use("/api/hostaway", hostawayRoutes);
    this.app.use("/api/google", googleRoutes);
    this.app.use("/api/templates", require("./routes/templates").default);

    // Health check endpoint
    this.app.get("/api/health", async (req, res) => {
      try {
        const dbHealth = this.databaseManager
          ? await this.databaseManager.healthCheck()
          : { status: "unhealthy", state: "not_initialized" };

        const health = {
          status: dbHealth.status === "healthy" ? "ok" : "degraded",
          message: "FlexLiving Reviews API",
          timestamp: new Date().toISOString(),
          database: dbHealth,
          uptime: process.uptime(),
        };

        const statusCode = health.status === "ok" ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(503).json({
          status: "error",
          message: "Health check failed",
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: `Route ${req.originalUrl} not found`,
      });
    });

    // Global error handler
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const status = err.statusCode || err.status || 500;
        const message = err.message || "Internal server error";

        res.status(status).json({
          status: "error",
          message,
          ...(env.nodeEnv === "development" && { stack: err.stack }),
        });
      }
    );
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      this.databaseManager = await DatabaseManager.createConnection(
        this.config.mongoUri
      );

      // Seed database with mock data on first run
      await seedDatabase();

      // Start the server
      const server = this.app.listen(this.config.port, () => {
        console.log(
          env.hostaway.apiUrl,
          env.hostaway.apiKey,
          env.hostaway.accountId
        );
        console.log(`Server running on port ${this.config.port}`);
      });

      server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          console.error(`Port ${this.config.port} is already in use`);
        } else {
          console.error("Server error:", error);
        }
        throw error;
      });
    } catch (error) {
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.databaseManager) {
        await this.databaseManager.disconnect();
      }
    } catch (error) {
      // Error during shutdown - handled silently
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getConfig(): ServerConfig {
    return this.config;
  }
}

// Create and start the server
const server = new Server();
server.start().catch((error) => {
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await server.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await server.shutdown();
  process.exit(0);
});

export default server;
