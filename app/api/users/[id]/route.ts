import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { FaceApiService } from "@/services/face-api.service";

// GET /api/users/[id] - Get user by ID
export async function GET(
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

    const db = DatabaseService.getInstance();
    const user = db.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
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
    const { name, email, department, status } = body;

    const db = DatabaseService.getInstance();

    // Check if user exists
    const existingUser = db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = db.getUserByEmail(email);
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    const updatedUser = db.updateUser(userId, {
      name,
      email,
      department,
      status,
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user and all biometric data
export async function DELETE(
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

    const db = DatabaseService.getInstance();

    // Check if user exists
    const existingUser = db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const deletionResults = {
      faceApi: { success: false, error: null as string | null },
      palm: { success: false, error: null as string | null },
      zktecoMqtt: { success: false, error: null as string | null },
      local: { success: false, error: null as string | null },
    };

    // Delete from Face API if user has face_api_id
    if (existingUser.face_api_id) {
      try {
        const faceApiService = FaceApiService.getInstance();
        await faceApiService.deletePersonnel(existingUser.face_api_id);
        deletionResults.faceApi.success = true;
      } catch (faceApiError) {
        console.error("⚠️ Face API deletion failed:", faceApiError);
        deletionResults.faceApi.error =
          faceApiError instanceof Error
            ? faceApiError.message
            : "Unknown error";
      }
    } else {
      deletionResults.faceApi.success = true;
    }

    // Delete palm data if registered
    if (existingUser.palm_registered) {
      try {
        const palmResponse = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/palm/delete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              command: "delete",
              user_id: userId.toString(),
            }),
          }
        );

        const palmResult = await palmResponse.json();
        if (palmResult.status === "ok") {
          deletionResults.palm.success = true;
        } else {
          deletionResults.palm.error =
            palmResult.message || "Failed to delete palm data";
          console.error(`❌ Palm deletion failed: ${palmResult.message}`);
        }
      } catch (palmError) {
        console.error("⚠️ Palm deletion failed:", palmError);
        deletionResults.palm.error =
          palmError instanceof Error ? palmError.message : "Unknown error";
      }
    } else {
      deletionResults.palm.success = true;
    }

    // Delete from ZKTeco device via MQTT if user has zkteco_uid
    if (existingUser.zkteco_uid) {
      try {
        // Send MQTT command to delete user from ZKTeco device
        const mqttResponse = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/mqtt/zkteco-command`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              command: `mode;delete_user;${existingUser.zkteco_uid}`,
            }),
          }
        );

        const mqttResult = await mqttResponse.json();
        if (mqttResult.success) {
          deletionResults.zktecoMqtt.success = true;
        } else {
          deletionResults.zktecoMqtt.error =
            mqttResult.error || "Failed to send MQTT delete command";
          console.error(`❌ MQTT delete command failed: ${mqttResult.error}`);
        }
      } catch (mqttError) {
        console.error("⚠️ ZKTeco MQTT deletion failed:", mqttError);
        deletionResults.zktecoMqtt.error =
          mqttError instanceof Error ? mqttError.message : "Unknown error";
      }
    } else {
      deletionResults.zktecoMqtt.success = true;
    }

    const deleted = db.deleteUser(userId);
    if (deleted) {
      deletionResults.local.success = true;
    } else {
      deletionResults.local.error = "Failed to delete from local database";
      console.error(`❌ Failed to delete user from local database: ${userId}`);
    }

    if (deletionResults.local.success) {
      return NextResponse.json({
        success: true,
        message: "User and all biometric data deletion completed",
        results: deletionResults,
        details: {
          faceApi: deletionResults.faceApi.success
            ? existingUser.face_api_id
              ? "Deleted from Face API"
              : "No Face API ID to delete"
            : `Face API error: ${deletionResults.faceApi.error}`,
          palm: deletionResults.palm.success
            ? existingUser.palm_registered
              ? "Deleted palm data"
              : "No palm data to delete"
            : `Palm error: ${deletionResults.palm.error}`,
          zktecoMqtt: deletionResults.zktecoMqtt.success
            ? existingUser.zkteco_uid
              ? "MQTT delete command sent to ZKTeco device"
              : "No ZKTeco UID to delete"
            : `ZKTeco MQTT error: ${deletionResults.zktecoMqtt.error}`,
          local: "Deleted from local database",
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to delete user from local database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
