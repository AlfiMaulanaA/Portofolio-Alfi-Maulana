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

    // Delete from Face API if user has face_api_id
    let faceApiDeleted = false;
    if (existingUser.face_api_id) {
      try {
        const faceApiService = FaceApiService.getInstance();
        await faceApiService.deletePersonnel(existingUser.face_api_id);
        faceApiDeleted = true;
        console.log(
          `✅ User deleted from Face API: ${existingUser.face_api_id}`
        );
      } catch (faceApiError) {
        console.error("⚠️ Face API deletion failed:", faceApiError);
        // Continue with local deletion even if Face API fails
      }
    }

    // Delete from local database
    const deleted = db.deleteUser(userId);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
        faceApiDeleted: faceApiDeleted,
        details: faceApiDeleted
          ? "User deleted from both local database and Face API"
          : existingUser.face_api_id
          ? "User deleted from local database, but Face API deletion failed"
          : "User deleted from local database (was not registered in Face API)",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
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
