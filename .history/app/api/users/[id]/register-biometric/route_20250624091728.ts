import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { ZKTecoService } from "@/services/zkteco.service";

// POST /api/users/[id]/register-biometric - Register biometric for user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = Number.parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !["card", "fingerprint", "password", "face"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid biometric type. Must be 'card', 'fingerprint', 'password', or 'face'",
        },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();

    // Check if user exists
    const existingUser = db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Handle face registration (no ZKTeco integration needed)
    if (type === "face") {
      // Update face registration in database
      const updatedUser = db.updateUserRegistration(userId, "face", true);

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          message: "Face registration completed successfully",
          data: updatedUser,
        });
      } else {
        console.error("❌ Failed to update face registration in database");
        return NextResponse.json(
          { success: false, error: "Failed to update face registration" },
          { status: 500 }
        );
      }
    }

    // For other biometric types, check ZKTeco UID
    if (!existingUser.zkteco_uid) {
      console.error("❌ ZKTeco UID missing for user:", existingUser.name);
      return NextResponse.json(
        {
          success: false,
          error:
            "User not registered in ZKTeco device. Please recreate the user.",
        },
        { status: 400 }
      );
    }

    const zktecoService = ZKTecoService.getInstance();
    let zktecoResult: any = { success: false };

    // Handle different biometric types
    switch (type) {
      case "card":
        if (!data?.cardNumber) {
          return NextResponse.json(
            { success: false, error: "Card number is required" },
            { status: 400 }
          );
        }

        zktecoResult = await zktecoService.setUserCard(
          existingUser.zkteco_uid,
          data.cardNumber
        );
        break;

      case "fingerprint":
        const fingerId = data?.fingerId || 0;

        zktecoResult = await zktecoService.enrollFingerprint(
          existingUser.zkteco_uid,
          fingerId
        );
        break;

      case "password":
        if (!data?.password) {
          return NextResponse.json(
            { success: false, error: "Password is required" },
            { status: 400 }
          );
        }

        zktecoResult = await zktecoService.setUserPassword(
          existingUser.zkteco_uid,
          data.password
        );
        break;
    }

    // Update local database if ZKTeco registration was successful
    if (zktecoResult.success) {
      const updatedUser = db.updateUserRegistration(
        userId,
        type as "card" | "fingerprint",
        true
      );

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          message: `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } registered successfully`,
          data: updatedUser,
          zktecoResult: zktecoResult,
        });
      } else {
        console.error(`❌ Failed to update ${type} registration in database`);
        return NextResponse.json(
          { success: false, error: `Failed to update ${type} registration` },
          { status: 500 }
        );
      }
    } else {
      console.error(
        `❌ ZKTeco ${type} registration failed:`,
        zktecoResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: `Failed to register ${type} in ZKTeco device`,
          details: zktecoResult.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error registering biometric:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register biometric",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
