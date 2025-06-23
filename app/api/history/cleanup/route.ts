import { NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// POST /api/history/cleanup - Clean up old history logs (older than 2 days)
export async function POST() {
  try {
    const db = DatabaseService.getInstance();

    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoffDate = twoDaysAgo.toISOString();

    console.log(`🧹 Cleaning up history logs older than: ${cutoffDate}`);

    // Delete logs older than 2 days
    const result = db.db
      .prepare(
        `
      DELETE FROM history_logs 
      WHERE timestamp < ?
    `
      )
      .run(cutoffDate);

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${result.changes} old history logs`,
      deletedCount: result.changes,
      cutoffDate: cutoffDate,
    });
  } catch (error) {
    console.error("❌ Error cleaning up history logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup history logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/history/cleanup - Get cleanup info (how many logs would be deleted)
export async function GET() {
  try {
    const db = DatabaseService.getInstance();

    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoffDate = twoDaysAgo.toISOString();

    // Count logs older than 2 days
    const result = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE timestamp < ?
    `
      )
      .get(cutoffDate) as { count: number };

    // Get total logs count
    const total = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs
    `
      )
      .get() as { count: number };

    return NextResponse.json({
      success: true,
      data: {
        totalLogs: total.count,
        oldLogs: result.count,
        cutoffDate: cutoffDate,
        willBeDeleted: result.count,
      },
    });
  } catch (error) {
    console.error("❌ Error getting cleanup info:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cleanup info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
