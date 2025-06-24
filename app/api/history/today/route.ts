import { NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// Force dynamic rendering - prevent static generation
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/history/today - Get today's statistics
export async function GET() {
  try {
    const db = DatabaseService.getInstance();

    // Get today's date in YYYY-MM-DD format (ensure timezone consistency)
    const now = new Date();
    const today = now.toISOString().split("T")[0];

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

    const responseData = {
      palmScans: todayPalmScans.count,
      successfulPalmScans: todaySuccessfulPalmScans.count,
      faceScans: todayFaceScans.count,
      successfulFaceScans: todaySuccessfulFaceScans.count,
      totalScans: todayPalmScans.count + todayFaceScans.count,
      totalSuccessful:
        todaySuccessfulPalmScans.count + todaySuccessfulFaceScans.count,
      timestamp: now.toISOString(),
      date: today,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "❌ [/api/history/today] Error fetching today's stats:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch today's statistics",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
