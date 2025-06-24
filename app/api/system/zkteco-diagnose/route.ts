import { NextResponse } from "next/server";
import { ZKTecoService } from "@/services/zkteco.service";

export async function GET() {
  try {
    console.log("🔍 Starting ZKTeco system diagnostics...");

    const zktecoService = ZKTecoService.getInstance();
    const diagnostics = await zktecoService.diagnoseSystem();

    console.log("📋 Diagnostics completed:", diagnostics);

    return NextResponse.json({
      success: true,
      data: diagnostics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Diagnostics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run diagnostics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
