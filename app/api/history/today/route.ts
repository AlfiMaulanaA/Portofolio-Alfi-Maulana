import { NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// GET /api/history/today - Get today's statistics
export async function GET() {
  try {
    const db = DatabaseService.getInstance();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get today's palm scans
    const todayPalmScans = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE recognition_type = 'palm' 
      AND DATE(timestamp) = ?
    `
      )
      .get(today) as { count: number };

    // Get today's successful palm scans (score >= 80)
    const todaySuccessfulPalmScans = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE recognition_type = 'palm' 
      AND result = 'success'
      AND confidence >= 80
      AND DATE(timestamp) = ?
    `
      )
      .get(today) as { count: number };

    // Get today's face scans
    const todayFaceScans = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE recognition_type = 'face' 
      AND DATE(timestamp) = ?
    `
      )
      .get(today) as { count: number };

    // Get today's successful face scans
    const todaySuccessfulFaceScans = db.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM history_logs 
      WHERE recognition_type = 'face' 
      AND result = 'success'
      AND DATE(timestamp) = ?
    `
      )
      .get(today) as { count: number };

    return NextResponse.json({
      success: true,
      data: {
        palmScans: todayPalmScans.count,
        successfulPalmScans: todaySuccessfulPalmScans.count,
        faceScans: todayFaceScans.count,
        successfulFaceScans: todaySuccessfulFaceScans.count,
        totalScans: todayPalmScans.count + todayFaceScans.count,
        totalSuccessful:
          todaySuccessfulPalmScans.count + todaySuccessfulFaceScans.count,
      },
    });
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch today's statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
