import axios, { AxiosResponse, AxiosError } from "axios";
import { BaseService } from "./BaseService";
import { HealthCheckResult, HealthMonitoringConfig } from "../types";
import { HealthLogger } from "../utils/HealthLogger";

export class HealthMonitoringService extends BaseService {
  private config: HealthMonitoringConfig;
  private logger: HealthLogger;
  private baseUrl: string;

  constructor(
    config: HealthMonitoringConfig,
    baseUrl: string = "http://localhost:5000"
  ) {
    super();
    this.config = config;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl; // Remove trailing slash

    // Initialize logger
    this.logger = new HealthLogger({
      filePath: config.logging.filePath,
      maxFileSize: this.parseFileSize(config.logging.maxFileSize),
      maxFiles: config.logging.maxFiles,
      format: config.logging.format,
    });
  }

  /**
   * Perform a health check against the configured endpoint
   */
  public async performHealthCheck(
    retryCount: number = 0
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${this.config.healthCheckEndpoint}`;

    try {
      const response: AxiosResponse = await axios.get(endpoint, {
        timeout: this.config.cronJob.timeout,
        validateStatus: () => true, // Don't throw on non-2xx status codes
        headers: {
          "User-Agent": "FlexLiving-HealthMonitor/1.0",
          Accept: "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      const healthCheckResult: HealthCheckResult = {
        status: this.determineHealthStatus(response.status, response.data),
        timestamp: new Date().toISOString(),
        responseTime,
        httpStatusCode: response.status,
        endpoint,
        message: response.data?.message || "Health check completed",
        details: response.data,
      };

      // Log the health check result
      if (this.config.logging.enabled) {
        await this.logger.logHealthCheck(healthCheckResult, {
          cronJobId: "health-monitor",
          executionTime: responseTime,
          retryCount,
          environment: process.env.NODE_ENV || "development",
        });
      }

      return healthCheckResult;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheckResult = this.handleHealthCheckError(
        error,
        endpoint,
        responseTime,
        retryCount
      );

      // Log the error
      if (this.config.logging.enabled) {
        await this.logger.logHealthCheck(healthCheckResult, {
          cronJobId: "health-monitor",
          executionTime: responseTime,
          retryCount,
          environment: process.env.NODE_ENV || "development",
        });
      }

      return healthCheckResult;
    }
  }

  /**
   * Perform health check with retry logic
   */
  public async performHealthCheckWithRetry(): Promise<HealthCheckResult> {
    let lastResult: HealthCheckResult | null = null;

    for (
      let attempt = 0;
      attempt <= this.config.cronJob.maxRetries;
      attempt++
    ) {
      try {
        const result = await this.performHealthCheck(attempt);

        // If successful (2xx status), return immediately
        if (result.httpStatusCode >= 200 && result.httpStatusCode < 300) {
          return result;
        }

        lastResult = result;

        // If this is not the last attempt, wait before retrying
        if (attempt < this.config.cronJob.maxRetries) {
          await this.delay(this.config.cronJob.retryDelay);
        }
      } catch (error) {
        // This shouldn't happen as performHealthCheck handles all errors
        // But just in case, create an error result
        lastResult = {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          responseTime: 0,
          httpStatusCode: 0,
          endpoint: `${this.baseUrl}${this.config.healthCheckEndpoint}`,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error during health check",
        };
      }
    }

    return lastResult!;
  }

  /**
   * Get recent health monitoring logs
   */
  public async getRecentLogs(limit: number = 100): Promise<any[]> {
    return this.logger.getRecentLogs(limit);
  }

  /**
   * Get health monitoring statistics
   */
  public getLogStatistics(): any {
    return this.logger.getLogStats();
  }

  /**
   * Clear all health monitoring logs
   */
  public async clearLogs(): Promise<void> {
    return this.logger.clearLogs();
  }

  /**
   * Update health monitoring configuration
   */
  public updateConfig(newConfig: Partial<HealthMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize logger if logging config changed
    if (newConfig.logging) {
      this.logger = new HealthLogger({
        filePath: this.config.logging.filePath,
        maxFileSize: this.parseFileSize(this.config.logging.maxFileSize),
        maxFiles: this.config.logging.maxFiles,
        format: this.config.logging.format,
      });
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): HealthMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Determine health status based on HTTP response
   */
  private determineHealthStatus(
    statusCode: number,
    responseData: any
  ): "healthy" | "unhealthy" | "degraded" {
    if (statusCode >= 200 && statusCode < 300) {
      // Check if response data indicates degraded status
      if (
        responseData?.status === "degraded" ||
        responseData?.status === "unhealthy"
      ) {
        return "degraded";
      }
      return "healthy";
    } else if (statusCode >= 500) {
      return "unhealthy";
    } else {
      return "degraded";
    }
  }

  /**
   * Handle health check errors and create appropriate result
   */
  private handleHealthCheckError(
    error: unknown,
    endpoint: string,
    responseTime: number,
    retryCount: number
  ): HealthCheckResult {
    let errorMessage = "Unknown error";
    let httpStatusCode = 0;

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNREFUSED") {
        errorMessage = "Connection refused - service may be down";
      } else if (axiosError.code === "ETIMEDOUT") {
        errorMessage = "Request timeout";
      } else if (axiosError.code === "ENOTFOUND") {
        errorMessage = "Host not found";
      } else if (axiosError.response) {
        httpStatusCode = axiosError.response.status;
        errorMessage = `HTTP ${httpStatusCode}: ${axiosError.response.statusText}`;
      } else {
        errorMessage = axiosError.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime,
      httpStatusCode,
      endpoint,
      error: errorMessage,
      message: `Health check failed${
        retryCount > 0 ? ` (retry ${retryCount})` : ""
      }`,
    };
  }

  /**
   * Parse file size string to bytes
   */
  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const [, size, unit] = match;
    const multiplier = units[unit.toUpperCase()];

    if (!multiplier) {
      throw new Error(`Unknown file size unit: ${unit}`);
    }

    return Math.floor(parseFloat(size) * multiplier);
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate health monitoring configuration
   */
  public static validateConfig(config: HealthMonitoringConfig): void {
    if (!config.healthCheckEndpoint) {
      throw new Error("Health check endpoint is required");
    }

    if (!config.cronJob.schedule) {
      throw new Error("Cron schedule is required");
    }

    if (config.cronJob.maxRetries < 0) {
      throw new Error("Max retries must be non-negative");
    }

    if (config.cronJob.retryDelay < 0) {
      throw new Error("Retry delay must be non-negative");
    }

    if (config.cronJob.timeout <= 0) {
      throw new Error("Timeout must be positive");
    }

    if (config.logging.enabled && !config.logging.filePath) {
      throw new Error("Log file path is required when logging is enabled");
    }
  }

  /**
   * Check if the health monitoring service is healthy
   */
  public async isServiceHealthy(): Promise<boolean> {
    try {
      const result = await this.performHealthCheck();
      return result.httpStatusCode >= 200 && result.httpStatusCode < 300;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service status information
   */
  public getServiceStatus(): {
    isConfigured: boolean;
    baseUrl: string;
    endpoint: string;
    lastCheck?: string;
  } {
    return {
      isConfigured: !!this.config,
      baseUrl: this.baseUrl,
      endpoint: this.config?.healthCheckEndpoint || "unknown",
      // This could be enhanced to track last check time
    };
  }

  /**
   * Perform a connectivity test to the health endpoint
   */
  public async testConnectivity(): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const endpoint = `${this.baseUrl}${this.config.healthCheckEndpoint}`;
      await axios.get(endpoint, {
        timeout: 5000, // Short timeout for connectivity test
        validateStatus: () => true,
      });

      return {
        success: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
