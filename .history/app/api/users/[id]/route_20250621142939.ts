import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { FaceApiService } from "@/services/face-api.service";
import { ZKTecoService } from "@/services/zkteco.service";

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

// DELETE /api/users/[id] - Delete user
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

    // Prevent deletion of admin user
    if (existingUser.email === "admin@biometric.system") {
      return NextResponse.json(
        { success: false, error: "Cannot delete system administrator" },
        { status: 403 }
      );
    }

    const deletionResults = {
      faceApi: { success: false, error: null as string | null },
      zkteco: { success: false, error: null as string | null },
      local: { success: false, error: null as string | null },
    };

    // Delete from Face API if user has face_api_id
    if (existingUser.face_api_id) {
      try {
        const faceApiService = FaceApiService.getInstance();
        await faceApiService.deletePersonnel(existingUser.face_api_id);
        deletionResults.faceApi.success = true;
        console.log(
          `✅ User deleted from Face API: ${existingUser.face_api_id}`
        );
      } catch (faceApiError) {
        console.error("⚠️ Face API deletion failed:", faceApiError);
        deletionResults.faceApi.error =
          faceApiError instanceof Error
            ? faceApiError.message
            : "Unknown error";
      }
    } else {
      deletionResults.faceApi.success = true; // No Face API ID to delete
    }

    // Delete from ZKTeco device if user has zkteco_uid
    if (existingUser.zkteco_uid) {
      try {
        const zktecoService = ZKTecoService.getInstance();
        const zktecoResult = await zktecoService.deleteUser(
          existingUser.zkteco_uid
        );
        if (zktecoResult.success) {
          deletionResults.zkteco.success = true;
          console.log(
            `✅ User deleted from ZKTeco: ${existingUser.zkteco_uid}`
          );
        } else {
          deletionResults.zkteco.error = zktecoResult.error || "Unknown error";
        }
      } catch (zktecoError) {
        console.error("⚠️ ZKTeco deletion failed:", zktecoError);
        deletionResults.zkteco.error =
          zktecoError instanceof Error ? zktecoError.message : "Unknown error";
      }
    } else {
      deletionResults.zkteco.success = true; // No ZKTeco UID to delete
    }

    // Delete from local database
    const deleted = db.deleteUser(userId);
    if (deleted) {
      deletionResults.local.success = true;
    } else {
      deletionResults.local.error = "Failed to delete from local database";
    }

    if (deletionResults.local.success) {
      return NextResponse.json({
        success: true,
        message: "User deletion completed",
        results: deletionResults,
        details: {
          faceApi: deletionResults.faceApi.success
            ? "Deleted from Face API"
            : `Face API error: ${deletionResults.faceApi.error}`,
          zkteco: deletionResults.zkteco.success
            ? "Deleted from ZKTeco"
            : `ZKTeco error: ${deletionResults.zkteco.error}`,
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
