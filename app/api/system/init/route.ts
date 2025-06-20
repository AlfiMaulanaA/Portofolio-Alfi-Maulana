import { NextResponse } from "next/server";
import AutoCleanupService from "@/lib/auto-cleanup";

// POST /api/system/init - Initialize system services
export async function POST() {
  try {
    console.log("🚀 Initializing system services...");

    // Start auto cleanup service
    const cleanupService = AutoCleanupService.getInstance();
    cleanupService.startAutoCleanup();

    return NextResponse.json({
      success: true,
      message: "System services initialized successfully",
      services: {
        autoCleanup: cleanupService.getStatus(),
      },
    });
  } catch (error) {
    console.error("❌ Error initializing system services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize system services",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/system/init - Get system status
export async function GET() {
  try {
    const cleanupService = AutoCleanupService.getInstance();

    return NextResponse.json({
      success: true,
      data: {
        autoCleanup: cleanupService.getStatus(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error getting system status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get system status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
