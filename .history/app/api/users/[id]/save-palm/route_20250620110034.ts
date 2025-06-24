import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

interface SavePalmRequest {
  palmData?: string;
  registrationTimestamp: string;
  deviceId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: SavePalmRequest = await request.json();

    console.log("Save palm request received for user ID:", id);
    console.log("Request body:", body);

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.registrationTimestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration timestamp is required",
        },
        { status: 400 }
      );
    }

    const userId = Number.parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID",
        },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();

    // Check if user exists
    const user = db.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Update palm registration status
    const updatedUser = db.updateUserRegistration(userId, "palm", true);

    // Create history log
    const historyLog = db.createHistoryLog({
      user_id: userId,
      user_name: user.name,
      recognition_type: "palm",
      result: "success",
      confidence: 95,
      location: "Registration Terminal",
      device_id: body.deviceId || "palm_scanner_001",
    });

    console.log("Palm data saved successfully for user:", id);
    console.log("Updated user:", updatedUser);
    console.log("History log created:", historyLog);

    return NextResponse.json({
      success: true,
      message: "Palm data saved successfully",
      data: {
        userId: id,
        palmData: body.palmData || "encrypted_palm_template",
        registrationTimestamp: body.registrationTimestamp,
        deviceId: body.deviceId || "palm_scanner_001",
        status: "active",
        createdAt: new Date().toISOString(),
        user: updatedUser,
        historyLog: historyLog,
      },
    });
  } catch (error) {
    console.error("Error saving palm data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
