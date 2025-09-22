import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { DatabaseManager } from "./database/DatabaseManager";
import { ServerConfig, HealthMonitoringConfig } from "./types";
import reviewRoutes from "./routes/reviews";
import propertyRoutes from "./routes/properties";
import hostawayRoutes from "./routes/hostaway";
import googleRoutes from "./routes/google";
import healthMonitoringRoutes, {
  initializeHealthMonitoringRoutes,
} from "./routes/healthMonitoring";
import { seedDatabase } from "./utils/seedDatabase";
import { env } from "./config";
import { HealthMonitoringService } from "./services/HealthMonitoringService";
import { CronJobManager } from "./services/CronJobManager";

class Server {
  private app: express.Application;
  private config: ServerConfig;
  private databaseManager: DatabaseManager | null = null;
  private healthMonitoringService: HealthMonitoringService | null = null;
  private cronJobManager: CronJobManager | null = null;

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
      host: env.host,
      corsOrigin: env.corsOrigin,
      mongoUri: env.mongoUri || "mongodb://localhost:27017/flexliving-reviews",
    };
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use((_req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      next();
    });

    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
      })
    );
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging in development
    if (env.nodeEnv === "development") {
      this.app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
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
    this.app.use("/api/health-monitoring", healthMonitoringRoutes);

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

      // Initialize health monitoring system
      await this.initializeHealthMonitoring();

      // Start the server
      const server = this.app.listen(this.config.port, () => {
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

  /**
   * Construct the base URL for health monitoring
   */
  private constructBaseUrl(): string {
    // Use explicit base URL if provided
    if (env.healthMonitoring.baseUrl) {
      return env.healthMonitoring.baseUrl;
    }

    // Construct base URL from host and port
    console.log(this.config.host);
    
    const protocol =
      env.nodeEnv === "production" && this.config.host !== "localhost"
        ? "https"
        : "http";
    return `${protocol}://${this.config.host}:${this.config.port}`;
  }

  /**
   * Initialize health monitoring system
   */
  private async initializeHealthMonitoring(): Promise<void> {
    if (!env.healthMonitoring.enabled) {
      console.log("🔍 Health monitoring is disabled");
      return;
    }

    try {
      // Create health monitoring configuration
      const healthConfig: HealthMonitoringConfig = {
        cronJob: {
          schedule: env.healthMonitoring.cronSchedule,
          enabled: true,
          maxRetries: env.healthMonitoring.maxRetries,
          retryDelay: env.healthMonitoring.retryDelay,
          timeout: env.healthMonitoring.timeout,
        },
        healthCheckEndpoint: env.healthMonitoring.endpoint,
        logging: env.healthMonitoring.logging,
      };

      // Validate configuration
      HealthMonitoringService.validateConfig(healthConfig);

      // Initialize health monitoring service with dynamic base URL
      const baseUrl = this.constructBaseUrl();
      this.healthMonitoringService = new HealthMonitoringService(
        healthConfig,
        baseUrl
      );

      // Initialize cron job manager
      this.cronJobManager = new CronJobManager();
      this.cronJobManager.setHealthMonitoringService(
        this.healthMonitoringService
      );

      // Create and start the health monitoring cron job
      this.cronJobManager.createHealthMonitoringJob(healthConfig.cronJob);

      // Initialize health monitoring routes
      initializeHealthMonitoringRoutes(
        this.healthMonitoringService,
        this.cronJobManager
      );

      console.log(`✅ Health monitoring system initialized`);
      console.log(`📅 Cron schedule: ${env.healthMonitoring.cronSchedule}`);
      console.log(
        `📊 Health endpoint: ${baseUrl}${env.healthMonitoring.endpoint}`
      );
      console.log(`📝 Logging to: ${env.healthMonitoring.logging.filePath}`);
    } catch (error) {
      console.error("❌ Failed to initialize health monitoring:", error);
      // Don't throw here - let the server start without health monitoring
    }
  }

  public async shutdown(): Promise<void> {
    console.log("🛑 Shutting down server...");

    try {
      // Shutdown health monitoring system
      if (this.cronJobManager) {
        this.cronJobManager.shutdown();
      }

      // Disconnect from database
      if (this.databaseManager) {
        await this.databaseManager.disconnect();
      }

      console.log("✅ Server shutdown complete");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
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
