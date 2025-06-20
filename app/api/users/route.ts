import { type NextRequest, NextResponse } from "next/server";
import DatabaseService from "@/lib/database";

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

    const newUser = db.createUser({
      name,
      email,
      department,
      status: status || "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: newUser,
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
