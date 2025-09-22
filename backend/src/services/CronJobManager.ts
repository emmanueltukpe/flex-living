import * as cron from "node-cron";
import { CronJobStatus, CronJobConfig } from "../types";
import { HealthMonitoringService } from "./HealthMonitoringService";

export interface CronJob {
  id: string;
  name: string;
  task: cron.ScheduledTask;
  config: CronJobConfig;
  status: CronJobStatus;
}

export class CronJobManager {
  private jobs: Map<string, CronJob> = new Map();
  private healthMonitoringService: HealthMonitoringService | null = null;

  constructor() {
    // Graceful shutdown handling
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Set the health monitoring service
   */
  public setHealthMonitoringService(service: HealthMonitoringService): void {
    this.healthMonitoringService = service;
  }

  /**
   * Create and schedule a health monitoring cron job
   */
  public createHealthMonitoringJob(config: CronJobConfig): string {
    const jobId = "health-monitoring";
    const jobName = "Health Monitoring";

    if (this.jobs.has(jobId)) {
      throw new Error(`Cron job with ID '${jobId}' already exists`);
    }

    if (!this.healthMonitoringService) {
      throw new Error("Health monitoring service not set");
    }

    // Validate cron schedule
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }

    const jobStatus: CronJobStatus = {
      id: jobId,
      name: jobName,
      schedule: config.schedule,
      enabled: config.enabled,
      status: "stopped",
      runCount: 0,
      errorCount: 0,
    };

    // Create the scheduled task
    const task = cron.schedule(
      config.schedule,
      async () => {
        await this.executeHealthCheck(jobId);
      },
      {
        timezone: config.timezone || "UTC",
      }
    );

    const job: CronJob = {
      id: jobId,
      name: jobName,
      task,
      config,
      status: jobStatus,
    };

    // Stop the task initially since cron.schedule starts it by default
    task.stop();

    this.jobs.set(jobId, job);

    // Start the job if enabled
    if (config.enabled) {
      this.startJob(jobId);
    }

    console.log(`✅ Created health monitoring cron job: ${config.schedule}`);
    return jobId;
  }

  /**
   * Execute health check for a specific job
   */
  private async executeHealthCheck(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !this.healthMonitoringService) {
      return;
    }

    const startTime = Date.now();
    job.status.status = "running";
    job.status.runCount++;

    try {
      console.log(`🔍 Executing health check (run #${job.status.runCount})`);

      const result =
        await this.healthMonitoringService.performHealthCheckWithRetry();

      const executionTime = Date.now() - startTime;
      console.log(
        `✅ Health check completed in ${executionTime}ms - Status: ${result.status.toUpperCase()}`
      );

      job.status.status = "stopped";
      job.status.lastRun = new Date().toISOString();
      job.status.lastError = undefined;

      // Calculate next run time
      this.updateNextRunTime(job);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        `❌ Health check failed after ${executionTime}ms:`,
        errorMessage
      );

      job.status.status = "error";
      job.status.errorCount++;
      job.status.lastError = errorMessage;
      job.status.lastRun = new Date().toISOString();

      // Calculate next run time even after error
      this.updateNextRunTime(job);
    }
  }

  /**
   * Start a cron job
   */
  public startJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Cron job with ID '${jobId}' not found`);
    }

    if (job.status.status === "running") {
      return false; // Already running
    }

    try {
      job.task.start();
      job.status.enabled = true;
      job.status.status = "stopped"; // Will change to 'running' when executing
      this.updateNextRunTime(job);

      console.log(`▶️  Started cron job: ${job.name}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      job.status.lastError = errorMessage;
      console.error(`Failed to start cron job ${job.name}:`, errorMessage);
      return false;
    }
  }

  /**
   * Stop a cron job
   */
  public stopJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Cron job with ID '${jobId}' not found`);
    }

    try {
      job.task.stop();
      job.status.enabled = false;
      job.status.status = "stopped";
      job.status.nextRun = undefined;

      console.log(`⏹️  Stopped cron job: ${job.name}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      job.status.lastError = errorMessage;
      console.error(`Failed to stop cron job ${job.name}:`, errorMessage);
      return false;
    }
  }

  /**
   * Remove a cron job
   */
  public removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    try {
      job.task.stop();
      job.task.destroy();
      this.jobs.delete(jobId);

      console.log(`🗑️  Removed cron job: ${job.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove cron job ${job.name}:`, error);
      return false;
    }
  }

  /**
   * Get status of a specific job
   */
  public getJobStatus(jobId: string): CronJobStatus | null {
    const job = this.jobs.get(jobId);
    return job ? { ...job.status } : null;
  }

  /**
   * Get status of all jobs
   */
  public getAllJobStatuses(): CronJobStatus[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job.status }));
  }

  /**
   * Update job configuration
   */
  public updateJobConfig(
    jobId: string,
    newConfig: Partial<CronJobConfig>
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Cron job with ID '${jobId}' not found`);
    }

    const wasRunning = job.status.enabled;

    try {
      // Stop the job if it's running
      if (wasRunning) {
        this.stopJob(jobId);
      }

      // Update configuration
      job.config = { ...job.config, ...newConfig };
      job.status.schedule = job.config.schedule;
      job.status.enabled = job.config.enabled;

      // Recreate the task if schedule changed
      if (newConfig.schedule) {
        if (!cron.validate(newConfig.schedule)) {
          throw new Error(`Invalid cron schedule: ${newConfig.schedule}`);
        }

        job.task.destroy();
        job.task = cron.schedule(
          job.config.schedule,
          async () => {
            await this.executeHealthCheck(jobId);
          },
          {
            timezone: job.config.timezone || "UTC",
          }
        );
      }

      // Restart the job if it was running and is still enabled
      if (wasRunning && job.config.enabled) {
        this.startJob(jobId);
      }

      console.log(`🔄 Updated cron job configuration: ${job.name}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      job.status.lastError = errorMessage;
      console.error(`Failed to update cron job ${job.name}:`, errorMessage);
      return false;
    }
  }

  /**
   * Check if any jobs are running
   */
  public hasRunningJobs(): boolean {
    return Array.from(this.jobs.values()).some(
      (job) => job.status.status === "running"
    );
  }

  /**
   * Get total number of jobs
   */
  public getJobCount(): number {
    return this.jobs.size;
  }

  /**
   * Update next run time for a job
   */
  private updateNextRunTime(job: CronJob): void {
    try {
      // This is a simplified calculation - in a real implementation,
      // you might want to use a more sophisticated cron parser
      const now = new Date();
      const nextRun = new Date(now.getTime() + 5 * 60 * 1000); // Approximate next run (5 minutes from now for "*/5 * * * *")
      job.status.nextRun = nextRun.toISOString();
    } catch (error) {
      // If we can't calculate next run time, that's okay
      job.status.nextRun = undefined;
    }
  }

  /**
   * Shutdown all cron jobs gracefully
   */
  public shutdown(): void {
    console.log("🛑 Shutting down cron job manager...");

    for (const [, job] of this.jobs) {
      try {
        job.task.stop();
        job.task.destroy();
        console.log(`✅ Stopped cron job: ${job.name}`);
      } catch (error) {
        console.error(`❌ Error stopping cron job ${job.name}:`, error);
      }
    }

    this.jobs.clear();
    console.log("✅ Cron job manager shutdown complete");
  }

  /**
   * Get detailed information about all jobs
   */
  public getJobsInfo(): Array<{
    id: string;
    name: string;
    config: CronJobConfig;
    status: CronJobStatus;
  }> {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      name: job.name,
      config: { ...job.config },
      status: { ...job.status },
    }));
  }

  /**
   * Restart a failed job
   */
  public restartJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Cron job with ID '${jobId}' not found`);
    }

    try {
      // Stop the job first
      this.stopJob(jobId);

      // Reset error state
      job.status.lastError = undefined;
      job.status.errorCount = 0;

      // Start the job again
      return this.startJob(jobId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      job.status.lastError = errorMessage;
      console.error(`Failed to restart cron job ${job.name}:`, errorMessage);
      return false;
    }
  }

  /**
   * Check if any jobs are in error state and attempt recovery
   */
  public performHealthCheck(): {
    totalJobs: number;
    healthyJobs: number;
    errorJobs: number;
    recoveredJobs: number;
  } {
    const totalJobs = this.jobs.size;
    let healthyJobs = 0;
    let errorJobs = 0;
    let recoveredJobs = 0;

    for (const [jobId, job] of this.jobs) {
      if (job.status.status === "error") {
        errorJobs++;

        // Attempt to recover jobs that have been in error state
        if (job.status.errorCount < 5) {
          // Don't keep trying indefinitely
          console.log(`🔄 Attempting to recover job: ${job.name}`);
          if (this.restartJob(jobId)) {
            recoveredJobs++;
            console.log(`✅ Successfully recovered job: ${job.name}`);
          }
        }
      } else if (job.status.status === "stopped" && job.status.enabled) {
        healthyJobs++;
      }
    }

    return {
      totalJobs,
      healthyJobs,
      errorJobs,
      recoveredJobs,
    };
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    details: {
      totalJobs: number;
      runningJobs: number;
      errorJobs: number;
      disabledJobs: number;
    };
  } {
    const jobs = Array.from(this.jobs.values());
    const totalJobs = jobs.length;
    const runningJobs = jobs.filter(
      (job) => job.status.status === "running"
    ).length;
    const errorJobs = jobs.filter(
      (job) => job.status.status === "error"
    ).length;
    const disabledJobs = jobs.filter((job) => !job.status.enabled).length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (errorJobs > 0) {
      status = errorJobs >= totalJobs / 2 ? "unhealthy" : "degraded";
    }

    return {
      status,
      details: {
        totalJobs,
        runningJobs,
        errorJobs,
        disabledJobs,
      },
    };
  }

  /**
   * Enable automatic error recovery
   */
  public enableAutoRecovery(intervalMinutes: number = 30): void {
    // Set up periodic health checks and recovery attempts
    const recoveryInterval = setInterval(() => {
      try {
        const healthCheck = this.performHealthCheck();
        if (healthCheck.errorJobs > 0) {
          console.log(
            `🏥 Auto-recovery: Found ${healthCheck.errorJobs} jobs in error state`
          );
          if (healthCheck.recoveredJobs > 0) {
            console.log(
              `✅ Auto-recovery: Successfully recovered ${healthCheck.recoveredJobs} jobs`
            );
          }
        }
      } catch (error) {
        console.error("❌ Error during auto-recovery:", error);
      }
    }, intervalMinutes * 60 * 1000);

    // Store the interval ID for cleanup
    (this as any).recoveryInterval = recoveryInterval;
  }

  /**
   * Disable automatic error recovery
   */
  public disableAutoRecovery(): void {
    if ((this as any).recoveryInterval) {
      clearInterval((this as any).recoveryInterval);
      delete (this as any).recoveryInterval;
    }
  }
}
