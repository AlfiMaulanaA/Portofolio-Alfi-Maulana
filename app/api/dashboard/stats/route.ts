import { NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// ✅ Force dynamic rendering (Next.js 13/14 App Router)
export const dynamic = "force-dynamic";
export const revalidate = 0; // ⛔ Disable any ISR

export async function GET() {
  try {
    const db = DatabaseService.getInstance();

    const totalUsers = db.db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    const activeUsers = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'")
      .get() as { count: number };

    const today = new Date().toISOString().split("T")[0];

    const todayActivity = db.db
      .prepare(
        "SELECT COUNT(*) as count FROM history_logs WHERE DATE(timestamp) = ?"
      )
      .get(today) as { count: number };

    const todaySuccessful = db.db
      .prepare(
        "SELECT COUNT(*) as count FROM history_logs WHERE DATE(timestamp) = ? AND result = 'success'"
      )
      .get(today) as { count: number };

    const palmRegistered = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE palm_registered = 1")
      .get() as { count: number };

    const faceRegistered = db.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE face_registered = 1")
      .get() as { count: number };

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentActivity = db.db
      .prepare(
        "SELECT COUNT(*) as count FROM history_logs WHERE timestamp >= ?"
      )
      .get(last24Hours.toISOString()) as { count: number };

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
        successRate,
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
