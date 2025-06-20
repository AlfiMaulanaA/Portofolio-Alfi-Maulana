import { NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const db = DatabaseService.getInstance();

    // Get total users
    const totalUsers = db.db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    // Get active users
    const activeUsers = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'")
      .get() as {
      count: number;
    };

    // Get today's activity (all recognition attempts today)
    const today = new Date().toISOString().split("T")[0];
    const todayActivity = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE DATE(timestamp) = ?
    `
      )
      .get(today) as { count: number };

    // Get today's successful attempts
    const todaySuccessful = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE DATE(timestamp) = ? AND result = 'success'
    `
      )
      .get(today) as { count: number };

    // Get palm registered users
    const palmRegistered = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE palm_registered = 1")
      .get() as {
      count: number;
    };

    // Get face registered users
    const faceRegistered = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE face_registered = 1")
      .get() as {
      count: number;
    };

    // Get recent activity (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const recentActivity = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE timestamp >= ?
    `
      )
      .get(last24Hours.toISOString()) as { count: number };

    // Calculate success rate for today
    const successRate =
      todayActivity.count > 0
        ? Math.round((todaySuccessful.count / todayActivity.count) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        todayActivity: todayActivity.count,
        todaySuccessful: todaySuccessful.count,
        successRate: successRate,
        palmRegistered: palmRegistered.count,
        faceRegistered: faceRegistered.count,
        recentActivity: recentActivity.count,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
