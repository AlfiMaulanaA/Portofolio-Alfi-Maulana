import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, type, registered, cardNumber } = body;

    if (!uid || !type || typeof registered !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: uid, type, registered",
        },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();

    // Find user by ZKTeco UID
    const users = db.getAllUsers();
    const user = users.find((u) => u.zkteco_uid === uid);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found with ZKTeco UID: " + uid },
        { status: 404 }
      );
    }

    // Update registration status
    db.updateUserRegistration(user.id, type, registered);

    // If it's a card registration, also store the card number
    if (type === "card" && registered && cardNumber) {
      // You might want to add a card_number field to your database
      console.log(`📋 Card registered for user ${user.name}: ${cardNumber}`);
    }

    return NextResponse.json({
      success: true,
      message: `${type} registration updated successfully`,
      data: {
        userId: user.id,
        userName: user.name,
        type,
        registered,
        cardNumber: cardNumber || null,
      },
    });
  } catch (error) {
    console.error("Error updating user registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
