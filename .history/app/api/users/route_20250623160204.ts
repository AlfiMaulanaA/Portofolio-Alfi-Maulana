import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";
import { FaceApiService } from "@/services/face-api.service";
import { ZKTecoService } from "@/services/zkteco.service";

// GET /api/users - Get all users
export async function GET() {
  try {
    const db = DatabaseService.getInstance();
    const users = db.getAllUsers();
    const stats = db.getUserStats();

    return NextResponse.json({
      success: true,
      data: users,
      stats,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, department, status } = body;

    // Validation
    if (!name || !email || !department) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, email, department",
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const db = DatabaseService.getInstance();

    // Check if email already exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
        },
        { status: 409 }
      );
    }

    // Create user in local database first
    const newUser = db.createUser({
      name,
      email,
      department,
      status: status || "active",
    });

    let faceApiId: number | null = null;
    let zktecoUid: number | null = null;
    const integrationResults = {
      faceApi: { success: false, error: null as string | null },
      zkteco: { success: false, error: null as string | null },
    };

    // Register user to Face API
    try {
      const faceApiService = FaceApiService.getInstance();
      const personnelResult = await faceApiService.createPersonnel({
        name: name,
        department: department,
        entity: "Company", // Default entity
        authorized: true,
      });

      if (personnelResult.success && personnelResult.id) {
        faceApiId = personnelResult.id;
        db.updateUserFaceApiId(newUser.id, faceApiId);
        integrationResults.faceApi.success = true;
        console.log(
          `✅ User ${newUser.id} registered to Face API with ID: ${faceApiId}`
        );
      }
    } catch (faceApiError) {
      console.error("⚠️ Face API registration failed:", faceApiError);
      integrationResults.faceApi.error =
        faceApiError instanceof Error ? faceApiError.message : "Unknown error";
    }

    // Register user to ZKTeco device
    try {
      const zktecoService = ZKTecoService.getInstance();

      // Get next UID from ZKTeco device
      console.log(`🔄 Getting next UID from ZKTeco device...`);
      const lastUidResult = await zktecoService.getLastUid();

      let nextUid: number;
      if (
        lastUidResult.success &&
        lastUidResult.data &&
        typeof lastUidResult.data.next_uid === "number"
      ) {
        nextUid = lastUidResult.data.next_uid;
        console.log(`📋 Using next UID from ZKTeco device: ${nextUid}`);
      } else {
        // Fallback to database sequential UID
        nextUid = db.getNextSequentialZktecoUid();
        console.log(`📋 Fallback to database sequential UID: ${nextUid}`);
        console.log(
          `⚠️ ZKTeco UID fetch failed: ${
            lastUidResult.error || "Unknown error"
          }`
        );
      }

      // Ensure nextUid is a valid number
      if (!nextUid || isNaN(nextUid)) {
        nextUid = db.getNextSequentialZktecoUid();
        console.log(`📋 Using fallback sequential UID: ${nextUid}`);
      }

      console.log(`🔄 Adding user to ZKTeco with UID: ${nextUid}`);

      const zktecoResult = await zktecoService.addUser({
        uid: nextUid,
        username: name,
        password: "", // No password by default
      });

      if (zktecoResult.success) {
        // Update database with the UID used
        db.updateUserZktecoUid(newUser.id, nextUid);
        zktecoUid = nextUid;
        integrationResults.zkteco.success = true;

        console.log(
          `✅ User ${newUser.id} registered to ZKTeco with UID: ${nextUid}`
        );
      } else {
        integrationResults.zkteco.error = zktecoResult.error || "Unknown error";
        console.error(`❌ ZKTeco registration failed: ${zktecoResult.error}`);
      }
    } catch (zktecoError) {
      console.error("⚠️ ZKTeco registration failed:", zktecoError);
      integrationResults.zkteco.error =
        zktecoError instanceof Error ? zktecoError.message : "Unknown error";
    }

    // Get updated user data
    const updatedUser = db.getUserById(newUser.id);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: updatedUser,
        integrations: {
          faceApiId: faceApiId,
          zktecoUid: zktecoUid,
          results: integrationResults,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
