import DatabaseService from "./database";

class AutoCleanupService {
  private static instance: AutoCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): AutoCleanupService {
    if (!AutoCleanupService.instance) {
      AutoCleanupService.instance = new AutoCleanupService();
    }
    return AutoCleanupService.instance;
  }

  // Start auto cleanup (runs every 6 hours)
  public startAutoCleanup() {
    if (this.isRunning) {
      return;
    }

    // Run cleanup immediately on start
    this.performCleanup();

    // Then run every 6 hours (6 * 60 * 60 * 1000 ms)
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 6 * 60 * 60 * 1000);

    this.isRunning = true;
  }

  // Stop auto cleanup
  public stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
  }

  // Perform the actual cleanup
  private async performCleanup() {
    try {
      const db = DatabaseService.getInstance();

      // Calculate date 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();

      // Delete logs older than 2 days
      const result = db.db
        .prepare(
          `
        DELETE FROM history_logs 
        WHERE timestamp < ?
      `
        )
        .run(cutoffDate);

      if (result.changes > 0) {
      } else {
        console.log("✅ Auto cleanup completed: No old logs to delete");
      }

      // Also cleanup any orphaned data or optimize database
      db.db.exec("VACUUM");
    } catch (error) {
      console.error("❌ Auto cleanup failed:", error);
    }
  }

  // Manual cleanup trigger
  public async manualCleanup(): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      const db = DatabaseService.getInstance();

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();

      const result = db.db
        .prepare(
          `
        DELETE FROM history_logs 
        WHERE timestamp < ?
      `
        )
        .run(cutoffDate);

      return {
        success: true,
        deletedCount: result.changes,
      };
    } catch (error) {
      console.error("❌ Manual cleanup failed:", error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.cleanupInterval !== null,
    };
  }
}

export default AutoCleanupService;
