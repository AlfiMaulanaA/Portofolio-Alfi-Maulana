import { NextResponse } from "next/server";

export async function GET() {
  try {
    const palmVeinApiUrl = process.env.PALM_VEIN_API_BASE_URL;

    if (!palmVeinApiUrl) {
      return NextResponse.json(
        { success: false, error: "Palm Vein API URL not configured" },
        { status: 500 }
      );
    }

    console.log("🌴 Fetching Palm Vein users from:", `${palmVeinApiUrl}/list`);

    const response = await fetch(`${palmVeinApiUrl}/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Biometric-System/1.0",
      },
      // Add timeout
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Palm Vein API Error Response:", errorText);
      throw new Error(
        `Palm Vein API responded with status: ${response.status} - ${errorText}`
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error(
        "❌ Palm Vein API returned non-JSON response:",
        responseText.substring(0, 200)
      );
      throw new Error(
        `Palm Vein API returned non-JSON response. Content-Type: ${contentType}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data || [],
      source: "palm_vein_api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching Palm Vein users:", error);

    // More detailed error information
    let errorMessage = "Failed to fetch Palm Vein users";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        source: "palm_vein_api",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
