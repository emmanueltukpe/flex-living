import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { HealthMonitoringService } from '../services/HealthMonitoringService';
import { CronJobManager } from '../services/CronJobManager';

export class HealthMonitoringController extends BaseController {
  private healthMonitoringService: HealthMonitoringService;
  private cronJobManager: CronJobManager;

  constructor(healthMonitoringService: HealthMonitoringService, cronJobManager: CronJobManager) {
    super();
    this.healthMonitoringService = healthMonitoringService;
    this.cronJobManager = cronJobManager;
  }

  /**
   * Get recent health monitoring logs
   */
  public getLogs = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = this.parseNumber(req.query.limit as string) || 100;
    
    if (limit < 1 || limit > 1000) {
      this.sendError(res, 'Limit must be between 1 and 1000', 400);
      return;
    }

    const logs = await this.healthMonitoringService.getRecentLogs(limit);
    
    this.sendSuccess(res, {
      logs,
      count: logs.length,
      limit
    }, 'Health monitoring logs retrieved successfully');
  });

  /**
   * Get health monitoring statistics
   */
  public getStats = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const logStats = this.healthMonitoringService.getLogStatistics();
    const jobStatuses = this.cronJobManager.getAllJobStatuses();
    
    const stats = {
      logging: logStats,
      cronJobs: {
        total: this.cronJobManager.getJobCount(),
        running: jobStatuses.filter(job => job.status === 'running').length,
        stopped: jobStatuses.filter(job => job.status === 'stopped').length,
        errors: jobStatuses.filter(job => job.status === 'error').length,
        jobs: jobStatuses
      },
      configuration: this.healthMonitoringService.getConfig()
    };

    this.sendSuccess(res, stats, 'Health monitoring statistics retrieved successfully');
  });

  /**
   * Get cron job status
   */
  public getCronJobStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    
    if (!jobId) {
      this.sendError(res, 'Job ID is required', 400);
      return;
    }

    const jobStatus = this.cronJobManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      this.sendError(res, `Cron job with ID '${jobId}' not found`, 404);
      return;
    }

    this.sendSuccess(res, jobStatus, 'Cron job status retrieved successfully');
  });

  /**
   * Get all cron jobs status
   */
  public getAllCronJobsStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const jobStatuses = this.cronJobManager.getAllJobStatuses();
    
    this.sendSuccess(res, {
      jobs: jobStatuses,
      total: jobStatuses.length,
      summary: {
        running: jobStatuses.filter(job => job.status === 'running').length,
        stopped: jobStatuses.filter(job => job.status === 'stopped').length,
        errors: jobStatuses.filter(job => job.status === 'error').length
      }
    }, 'All cron jobs status retrieved successfully');
  });

  /**
   * Start a cron job
   */
  public startCronJob = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    
    if (!jobId) {
      this.sendError(res, 'Job ID is required', 400);
      return;
    }

    try {
      const success = this.cronJobManager.startJob(jobId);
      
      if (success) {
        const jobStatus = this.cronJobManager.getJobStatus(jobId);
        this.sendSuccess(res, jobStatus, `Cron job '${jobId}' started successfully`);
      } else {
        this.sendError(res, `Failed to start cron job '${jobId}'`, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(res, errorMessage, 400);
    }
  });

  /**
   * Stop a cron job
   */
  public stopCronJob = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    
    if (!jobId) {
      this.sendError(res, 'Job ID is required', 400);
      return;
    }

    try {
      const success = this.cronJobManager.stopJob(jobId);
      
      if (success) {
        const jobStatus = this.cronJobManager.getJobStatus(jobId);
        this.sendSuccess(res, jobStatus, `Cron job '${jobId}' stopped successfully`);
      } else {
        this.sendError(res, `Failed to stop cron job '${jobId}'`, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(res, errorMessage, 400);
    }
  });

  /**
   * Trigger a manual health check
   */
  public triggerHealthCheck = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.healthMonitoringService.performHealthCheckWithRetry();
      
      this.sendSuccess(res, result, 'Manual health check completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(res, `Health check failed: ${errorMessage}`, 500);
    }
  });

  /**
   * Clear health monitoring logs
   */
  public clearLogs = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await this.healthMonitoringService.clearLogs();
      
      this.sendSuccess(res, null, 'Health monitoring logs cleared successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(res, `Failed to clear logs: ${errorMessage}`, 500);
    }
  });

  /**
   * Update health monitoring configuration
   */
  public updateConfig = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { cronJob, logging } = req.body;
    
    if (!cronJob && !logging) {
      this.sendError(res, 'At least one configuration section (cronJob or logging) must be provided', 400);
      return;
    }

    try {
      const updateData: any = {};
      
      if (cronJob) {
        updateData.cronJob = cronJob;
      }
      
      if (logging) {
        updateData.logging = logging;
      }

      this.healthMonitoringService.updateConfig(updateData);
      
      const updatedConfig = this.healthMonitoringService.getConfig();
      this.sendSuccess(res, updatedConfig, 'Health monitoring configuration updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(res, `Failed to update configuration: ${errorMessage}`, 400);
    }
  });

  /**
   * Get current health monitoring configuration
   */
  public getConfig = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const config = this.healthMonitoringService.getConfig();
    
    this.sendSuccess(res, config, 'Health monitoring configuration retrieved successfully');
  });

  /**
   * Get detailed information about all cron jobs
   */
  public getJobsInfo = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const jobsInfo = this.cronJobManager.getJobsInfo();
    
    this.sendSuccess(res, {
      jobs: jobsInfo,
      total: jobsInfo.length
    }, 'Cron jobs information retrieved successfully');
  });

  /**
   * Helper method to parse number from query parameter
   */
  private parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
}
