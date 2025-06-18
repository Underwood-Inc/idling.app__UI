/**
 * Materialized View Refresh System
 * Automatically refreshes user_submission_stats every hour for optimal performance
 */

import {
  refreshDailyStats,
  refreshTagStats,
  refreshTrendingPosts,
  refreshUserStats
} from '../actions/search.actions';
import { serverLogger } from '../utils/server-logger';

interface RefreshJob {
  name: string;
  intervalMs: number;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

class MaterializedViewRefresher {
  private jobs: Map<string, RefreshJob> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.setupJobs();
  }

  private setupJobs(): void {
    // Refresh user stats nightly (86400000ms = 24 hours)
    this.jobs.set('user_stats', {
      name: 'user_submission_stats',
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours (nightly)
      isRunning: false
    });

    // Refresh tag statistics nightly
    this.jobs.set('tag_stats', {
      name: 'tag_statistics',
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours (nightly)
      isRunning: false
    });

    // Refresh trending posts every 6 hours (more frequent for trending data)
    this.jobs.set('trending_posts', {
      name: 'trending_posts',
      intervalMs: 6 * 60 * 60 * 1000, // 6 hours
      isRunning: false
    });

    // Refresh daily stats nightly
    this.jobs.set('daily_stats', {
      name: 'daily_submission_stats',
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours (nightly)
      isRunning: false
    });

    serverLogger.info('Materialized view refresh jobs configured', {
      jobs: Array.from(this.jobs.keys()),
      intervals: Array.from(this.jobs.values()).map(
        (j) => `${j.name}: ${j.intervalMs / 1000 / 60 / 60}h`
      )
    });
  }

  async start(): Promise<void> {
    serverLogger.info('Starting materialized view refresh scheduler');

    for (const [jobId, job] of this.jobs) {
      // Run immediately on startup
      await this.runJob(jobId);

      // Schedule recurring runs
      const timer = setInterval(async () => {
        await this.runJob(jobId);
      }, job.intervalMs);

      this.timers.set(jobId, timer);

      // Calculate next run time
      job.nextRun = new Date(Date.now() + job.intervalMs);

      serverLogger.info(`Scheduled refresh job: ${job.name}`, {
        interval: `${job.intervalMs / 1000 / 60} minutes`,
        nextRun: job.nextRun.toISOString()
      });
    }
  }

  async stop(): Promise<void> {
    serverLogger.info('Stopping materialized view refresh scheduler');

    for (const [jobId, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(jobId);
    }

    // Wait for any running jobs to complete
    for (const job of this.jobs.values()) {
      while (job.isRunning) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    serverLogger.info('All refresh jobs stopped');
  }

  private async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      serverLogger.error('Unknown refresh job', null, { jobId });
      return;
    }

    if (job.isRunning) {
      serverLogger.debug(`Skipping ${job.name} refresh - already running`);
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();

    try {
      serverLogger.info(`Starting materialized view refresh: ${job.name}`);

      switch (jobId) {
        case 'user_stats':
          await refreshUserStats();
          break;
        case 'tag_stats':
          await refreshTagStats();
          break;
        case 'trending_posts':
          await refreshTrendingPosts();
          break;
        case 'daily_stats':
          await refreshDailyStats();
          break;
        default:
          throw new Error(`Unknown job type: ${jobId}`);
      }

      // Update next run time
      job.nextRun = new Date(Date.now() + job.intervalMs);

      serverLogger.info(`Completed materialized view refresh: ${job.name}`, {
        lastRun: job.lastRun.toISOString(),
        nextRun: job.nextRun.toISOString()
      });
    } catch (error) {
      serverLogger.error(
        `Failed to refresh materialized view: ${job.name}`,
        error,
        {
          jobId,
          lastRun: job.lastRun?.toISOString()
        }
      );
    } finally {
      job.isRunning = false;
    }
  }

  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [jobId, job] of this.jobs) {
      status[jobId] = {
        name: job.name,
        intervalMinutes: job.intervalMs / 1000 / 60,
        isRunning: job.isRunning,
        lastRun: job.lastRun?.toISOString() || 'never',
        nextRun: job.nextRun?.toISOString() || 'unknown'
      };
    }

    return status;
  }

  async forceRefresh(jobId?: string): Promise<void> {
    if (jobId) {
      await this.runJob(jobId);
    } else {
      // Refresh all jobs
      for (const jobId of this.jobs.keys()) {
        await this.runJob(jobId);
      }
    }
  }
}

// Singleton instance
export const materializedViewRefresher = new MaterializedViewRefresher();

// Auto-start in production and development
if (typeof window === 'undefined') {
  // Server-side only
  // Start the refresher when the module loads
  materializedViewRefresher.start().catch((error) => {
    serverLogger.error('Failed to start materialized view refresher', error);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    serverLogger.info('Received SIGTERM, stopping materialized view refresher');
    await materializedViewRefresher.stop();
  });

  process.on('SIGINT', async () => {
    serverLogger.info('Received SIGINT, stopping materialized view refresher');
    await materializedViewRefresher.stop();
  });
}
