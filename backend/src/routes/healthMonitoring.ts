import { Router } from "express";
import { HealthMonitoringController } from "../controllers/HealthMonitoringController";
import { HealthMonitoringService } from "../services/HealthMonitoringService";
import { CronJobManager } from "../services/CronJobManager";

// This will be set by the server when initializing the routes
let healthMonitoringController: HealthMonitoringController | null = null;

function initializeHealthMonitoringRoutes(
  healthMonitoringService: HealthMonitoringService,
  cronJobManager: CronJobManager
): void {
  healthMonitoringController = new HealthMonitoringController(
    healthMonitoringService,
    cronJobManager
  );
}

const router = Router();

// Middleware to check if health monitoring is initialized
const checkHealthMonitoringInitialized = (req: any, res: any, next: any) => {
  if (!healthMonitoringController) {
    return res.status(503).json({
      status: "error",
      message: "Health monitoring system is not initialized",
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkHealthMonitoringInitialized);

/**
 * @swagger
 * /api/health-monitoring/logs:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get recent health monitoring logs
 *     description: Retrieve recent health check logs with optional limit
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of logs to retrieve
 *     responses:
 *       200:
 *         description: Health monitoring logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HealthMonitoringLog'
 *                     count:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Invalid limit parameter
 *       503:
 *         description: Health monitoring system not initialized
 */

/**
 * @swagger
 * /api/health-monitoring/stats:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get health monitoring statistics
 *     description: Retrieve comprehensive statistics about health monitoring system
 *     responses:
 *       200:
 *         description: Health monitoring statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     logging:
 *                       type: object
 *                     cronJobs:
 *                       type: object
 *                     configuration:
 *                       type: object
 *       503:
 *         description: Health monitoring system not initialized
 */
router.get("/stats", (req, res, next) =>
  healthMonitoringController!.getStats(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/cron-jobs:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get all cron jobs status
 *     description: Retrieve status information for all cron jobs
 *     responses:
 *       200:
 *         description: Cron jobs status retrieved successfully
 *       503:
 *         description: Health monitoring system not initialized
 */
router.get("/cron-jobs", (req, res, next) =>
  healthMonitoringController!.getAllCronJobsStatus(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/cron-jobs/{jobId}:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get specific cron job status
 *     description: Retrieve status information for a specific cron job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The cron job ID
 *     responses:
 *       200:
 *         description: Cron job status retrieved successfully
 *       404:
 *         description: Cron job not found
 *       503:
 *         description: Health monitoring system not initialized
 */
router.get("/cron-jobs/:jobId", (req, res, next) =>
  healthMonitoringController!.getCronJobStatus(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/cron-jobs/{jobId}/start:
 *   post:
 *     tags:
 *       - Health Monitoring
 *     summary: Start a cron job
 *     description: Start a specific cron job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The cron job ID
 *     responses:
 *       200:
 *         description: Cron job started successfully
 *       400:
 *         description: Invalid job ID or job cannot be started
 *       404:
 *         description: Cron job not found
 *       503:
 *         description: Health monitoring system not initialized
 */
router.post("/cron-jobs/:jobId/start", (req, res, next) =>
  healthMonitoringController!.startCronJob(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/cron-jobs/{jobId}/stop:
 *   post:
 *     tags:
 *       - Health Monitoring
 *     summary: Stop a cron job
 *     description: Stop a specific cron job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The cron job ID
 *     responses:
 *       200:
 *         description: Cron job stopped successfully
 *       400:
 *         description: Invalid job ID or job cannot be stopped
 *       404:
 *         description: Cron job not found
 *       503:
 *         description: Health monitoring system not initialized
 */
router.post("/cron-jobs/:jobId/stop", (req, res, next) =>
  healthMonitoringController!.stopCronJob(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/trigger:
 *   post:
 *     tags:
 *       - Health Monitoring
 *     summary: Trigger manual health check
 *     description: Manually trigger a health check outside of the scheduled cron job
 *     responses:
 *       200:
 *         description: Manual health check completed successfully
 *       500:
 *         description: Health check failed
 *       503:
 *         description: Health monitoring system not initialized
 */
router.post("/trigger", (req, res, next) =>
  healthMonitoringController!.triggerHealthCheck(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/logs/clear:
 *   delete:
 *     tags:
 *       - Health Monitoring
 *     summary: Clear health monitoring logs
 *     description: Clear all health monitoring log files (use with caution)
 *     responses:
 *       200:
 *         description: Health monitoring logs cleared successfully
 *       500:
 *         description: Failed to clear logs
 *       503:
 *         description: Health monitoring system not initialized
 */

/**
 * @swagger
 * /api/health-monitoring/config:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get health monitoring configuration
 *     description: Retrieve current health monitoring configuration
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       503:
 *         description: Health monitoring system not initialized
 */
router.get("/config", (req, res, next) =>
  healthMonitoringController!.getConfig(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/config:
 *   put:
 *     tags:
 *       - Health Monitoring
 *     summary: Update health monitoring configuration
 *     description: Update health monitoring configuration settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cronJob:
 *                 type: object
 *               logging:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid configuration data
 *       503:
 *         description: Health monitoring system not initialized
 */
router.put("/config", (req, res, next) =>
  healthMonitoringController!.updateConfig(req, res, next)
);

/**
 * @swagger
 * /api/health-monitoring/jobs-info:
 *   get:
 *     tags:
 *       - Health Monitoring
 *     summary: Get detailed cron jobs information
 *     description: Retrieve detailed information about all cron jobs including configuration
 *     responses:
 *       200:
 *         description: Cron jobs information retrieved successfully
 *       503:
 *         description: Health monitoring system not initialized
 */
router.get("/jobs-info", (req, res, next) =>
  healthMonitoringController!.getJobsInfo(req, res, next)
);

export { initializeHealthMonitoringRoutes };
export default router;
