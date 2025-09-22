import fs from 'fs';
import path from 'path';
import { HealthMonitoringLog, HealthCheckResult } from '../types';

export interface LoggerConfig {
  filePath: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  format: 'json' | 'text';
}

export class HealthLogger {
  private config: LoggerConfig;
  private logDirectory: string;
  private currentLogFile: string;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.logDirectory = path.dirname(config.filePath);
    this.currentLogFile = config.filePath;
    this.ensureLogDirectory();
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw new Error(`Cannot create log directory: ${this.logDirectory}`);
    }
  }

  /**
   * Log a health check result
   */
  public async logHealthCheck(
    checkResult: HealthCheckResult,
    metadata: {
      cronJobId: string;
      executionTime: number;
      retryCount?: number;
      environment: string;
    }
  ): Promise<void> {
    const logEntry: HealthMonitoringLog = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      checkResult,
      applicationStatus: this.determineApplicationStatus(checkResult),
      metadata
    };

    try {
      await this.writeLogEntry(logEntry);
      await this.rotateLogsIfNeeded();
    } catch (error) {
      console.error('Failed to write health check log:', error);
      // Don't throw here to avoid disrupting the health check process
    }
  }

  /**
   * Write a log entry to the current log file
   */
  private async writeLogEntry(logEntry: HealthMonitoringLog): Promise<void> {
    const logLine = this.formatLogEntry(logEntry);
    
    return new Promise((resolve, reject) => {
      fs.appendFile(this.currentLogFile, logLine + '\n', 'utf8', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Format a log entry based on the configured format
   */
  private formatLogEntry(logEntry: HealthMonitoringLog): string {
    if (this.config.format === 'json') {
      return JSON.stringify(logEntry);
    } else {
      // Text format for human readability
      const status = logEntry.applicationStatus.toUpperCase();
      const timestamp = logEntry.timestamp;
      const responseTime = logEntry.checkResult.responseTime;
      const httpStatus = logEntry.checkResult.httpStatusCode;
      const endpoint = logEntry.checkResult.endpoint;
      const error = logEntry.checkResult.error ? ` ERROR: ${logEntry.checkResult.error}` : '';
      
      return `[${timestamp}] ${status} - ${endpoint} (${httpStatus}) ${responseTime}ms${error}`;
    }
  }

  /**
   * Determine overall application status based on health check result
   */
  private determineApplicationStatus(checkResult: HealthCheckResult): 'healthy' | 'unhealthy' | 'degraded' {
    if (checkResult.httpStatusCode >= 200 && checkResult.httpStatusCode < 300) {
      return checkResult.status === 'healthy' ? 'healthy' : 'degraded';
    }
    return 'unhealthy';
  }

  /**
   * Generate a unique log entry ID
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `health_${timestamp}_${random}`;
  }

  /**
   * Rotate logs if the current file exceeds the maximum size
   */
  private async rotateLogsIfNeeded(): Promise<void> {
    try {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      // File might not exist yet, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error checking log file size:', error);
      }
    }
  }

  /**
   * Rotate log files
   */
  private async rotateLogs(): Promise<void> {
    const baseFileName = path.basename(this.currentLogFile, path.extname(this.currentLogFile));
    const extension = path.extname(this.currentLogFile);
    const directory = path.dirname(this.currentLogFile);

    // Shift existing rotated files
    for (let i = this.config.maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(directory, `${baseFileName}.${i}${extension}`);
      const newFile = path.join(directory, `${baseFileName}.${i + 1}${extension}`);
      
      if (fs.existsSync(oldFile)) {
        if (i === this.config.maxFiles - 1) {
          // Delete the oldest file
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current log to .1
    const rotatedFile = path.join(directory, `${baseFileName}.1${extension}`);
    if (fs.existsSync(this.currentLogFile)) {
      fs.renameSync(this.currentLogFile, rotatedFile);
    }
  }

  /**
   * Read recent log entries
   */
  public async getRecentLogs(limit: number = 100): Promise<HealthMonitoringLog[]> {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        return [];
      }

      const content = fs.readFileSync(this.currentLogFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      if (this.config.format === 'json') {
        const logs: HealthMonitoringLog[] = [];
        const recentLines = lines.slice(-limit);
        
        for (const line of recentLines) {
          try {
            const log = JSON.parse(line) as HealthMonitoringLog;
            logs.push(log);
          } catch (parseError) {
            console.error('Failed to parse log line:', parseError);
          }
        }
        
        return logs.reverse(); // Most recent first
      } else {
        // For text format, we can't easily parse back to structured data
        // Return empty array or implement text parsing if needed
        return [];
      }
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }

  /**
   * Get log file statistics
   */
  public getLogStats(): {
    currentFileSize: number;
    currentFilePath: string;
    totalLogFiles: number;
  } {
    let currentFileSize = 0;
    let totalLogFiles = 0;

    try {
      if (fs.existsSync(this.currentLogFile)) {
        currentFileSize = fs.statSync(this.currentLogFile).size;
        totalLogFiles = 1;
      }

      // Count rotated files
      const baseFileName = path.basename(this.currentLogFile, path.extname(this.currentLogFile));
      const extension = path.extname(this.currentLogFile);
      const directory = path.dirname(this.currentLogFile);

      for (let i = 1; i <= this.config.maxFiles; i++) {
        const rotatedFile = path.join(directory, `${baseFileName}.${i}${extension}`);
        if (fs.existsSync(rotatedFile)) {
          totalLogFiles++;
        }
      }
    } catch (error) {
      console.error('Failed to get log stats:', error);
    }

    return {
      currentFileSize,
      currentFilePath: this.currentLogFile,
      totalLogFiles
    };
  }

  /**
   * Clear all log files (use with caution)
   */
  public async clearLogs(): Promise<void> {
    try {
      // Remove current log file
      if (fs.existsSync(this.currentLogFile)) {
        fs.unlinkSync(this.currentLogFile);
      }

      // Remove rotated files
      const baseFileName = path.basename(this.currentLogFile, path.extname(this.currentLogFile));
      const extension = path.extname(this.currentLogFile);
      const directory = path.dirname(this.currentLogFile);

      for (let i = 1; i <= this.config.maxFiles; i++) {
        const rotatedFile = path.join(directory, `${baseFileName}.${i}${extension}`);
        if (fs.existsSync(rotatedFile)) {
          fs.unlinkSync(rotatedFile);
        }
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }
}
