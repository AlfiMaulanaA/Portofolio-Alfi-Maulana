import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, user_id } = body;

    if (command !== "delete" || !user_id) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid request. Expected command: 'delete' and user_id",
        },
        { status: 400 }
      );
    }

    // Simulate successful deletion
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    return NextResponse.json({
      status: "ok",
      message: "user deleted",
      user_id: user_id,
    });
  } catch (error) {
    console.error("❌ Palm deletion error:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
