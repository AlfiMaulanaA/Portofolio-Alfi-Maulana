import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { ZKTecoService } from "@/services/zkteco.service";

// POST /api/zkteco/register-card - Register RFID card to ZKTeco
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cardNumber } = body;

    if (!userId || !cardNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, cardNumber",
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
    const result = await zktecoService.registerCard(
      user.zkteco_uid,
      cardNumber
    );

    if (result.success) {
      // Update database to mark card as registered
      db.updateUserRegistration(user.id, "card", true);
      console.log(`✅ Card registration completed for user: ${user.name}`);
    }

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Card registration successful"
        : "Card registration failed",
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error("Error registering card:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register card",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
