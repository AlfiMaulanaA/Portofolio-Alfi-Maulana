import { type NextRequest, NextResponse } from "next/server";
import { ZKTecoService } from "@/services/zkteco.service";

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Testing ZKTeco connection via API...");

    const zktecoService = ZKTecoService.getInstance();
    const result = await zktecoService.testConnection();

    if (result.success) {
      console.log("✅ ZKTeco connection test successful");
      return NextResponse.json({
        success: true,
        message: "ZKTeco connection successful",
        data: result.data,
      });
    } else {
      console.log("❌ ZKTeco connection test failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          message: "ZKTeco connection failed",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ ZKTeco test API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "ZKTeco test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
