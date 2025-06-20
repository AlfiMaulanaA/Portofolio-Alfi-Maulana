import { NextResponse } from "next/server";
import AutoCleanupService from "@/lib/auto-cleanup";

// POST /api/system/cleanup - Manual cleanup trigger
export async function POST() {
  try {
    console.log("🧹 Manual cleanup triggered...");

    const cleanupService = AutoCleanupService.getInstance();
    const result = await cleanupService.manualCleanup();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Manual cleanup completed: ${result.deletedCount} logs deleted`,
        deletedCount: result.deletedCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Manual cleanup failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in manual cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform manual cleanup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/system/cleanup - Get cleanup status
export async function GET() {
  try {
    const cleanupService = AutoCleanupService.getInstance();

    return NextResponse.json({
      success: true,
      data: {
        status: cleanupService.getStatus(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error getting cleanup status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cleanup status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
