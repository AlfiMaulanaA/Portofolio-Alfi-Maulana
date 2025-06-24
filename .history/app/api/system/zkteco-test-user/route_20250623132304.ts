import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function GET() {
  try {
    console.log("🔍 Testing ZKTeco User object creation...");

    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "zkteco",
      "test_user_creation.py"
    );

    return new Promise((resolve) => {
      const pythonProcess = spawn("python", [scriptPath]);
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        const result = {
          success: code === 0,
          exitCode: code,
          stdout: stdout,
          stderr: stderr,
          timestamp: new Date().toISOString(),
        };

        console.log("🔍 ZKTeco User test result:", result);

        resolve(NextResponse.json(result));
      });

      pythonProcess.on("error", (error) => {
        resolve(
          NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          })
        );
      });
    });
  } catch (error) {
    console.error("❌ ZKTeco User test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
