import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { ZKTecoService } from "@/services/zkteco.service";

// POST /api/zkteco/enroll-fingerprint - Enroll fingerprint to ZKTeco
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fingerIndex = 1, mode = "register" } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: userId",
        },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();
    const user = db.getUserById(Number.parseInt(userId));

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.zkteco_uid) {
      return NextResponse.json(
        { success: false, error: "User not registered in ZKTeco system" },
        { status: 400 }
      );
    }

    const zktecoService = ZKTecoService.getInstance();
    const result = await zktecoService.enrollFingerprint(
      user.zkteco_uid,
      fingerIndex,
      mode
    );

    if (result.success && mode === "save") {
      // Update database to mark fingerprint as registered
      db.updateUserRegistration(user.id, "fingerprint", true);
      console.log(
        `✅ Fingerprint registration completed for user: ${user.name}`
      );
    }

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Fingerprint enrollment successful"
        : "Fingerprint enrollment failed",
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error("Error enrolling fingerprint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to enroll fingerprint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
