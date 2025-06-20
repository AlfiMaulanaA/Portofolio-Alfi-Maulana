import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

// GET /api/history - Get history logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const userId = searchParams.get("userId");

    const db = DatabaseService.getInstance();

    let historyLogs;
    if (userId) {
      historyLogs = db.getHistoryLogsByUserId(Number.parseInt(userId));
    } else if (limit) {
      historyLogs = db.getAllHistoryLogs(Number.parseInt(limit));
    } else {
      historyLogs = db.getAllHistoryLogs();
    }

    const stats = db.getHistoryStats();

    return NextResponse.json({
      success: true,
      data: historyLogs,
      stats,
    });
  } catch (error) {
    console.error("Error fetching history logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch history logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/history - Create history log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      user_name,
      recognition_type,
      result,
      confidence,
      location,
      device_id,
    } = body;

    // Validation
    if (!user_name || !recognition_type || !result) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: user_name, recognition_type, result",
        },
        { status: 400 }
      );
    }

    if (!["palm", "face", "fingerprint", "card"].includes(recognition_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid recognition type" },
        { status: 400 }
      );
    }

    if (!["success", "failed", "unknown"].includes(result)) {
      return NextResponse.json(
        { success: false, error: "Invalid result type" },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();

    // If user_id is provided, update their last_seen
    if (user_id && result === "success") {
      db.updateUserLastSeen(user_id);
    }

    const newLog = db.createHistoryLog({
      user_id,
      user_name,
      recognition_type,
      result,
      confidence,
      location,
      device_id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "History log created successfully",
        data: newLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating history log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create history log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
