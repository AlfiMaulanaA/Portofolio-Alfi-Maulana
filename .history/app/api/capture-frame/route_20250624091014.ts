import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    // Build RTSP URL from environment variables
    const rtspUrl =
      process.env.RTSP_CAMERA_URL ||
      `rtsp://${process.env.RTSP_CAMERA_USERNAME || "admin"}:${
        process.env.RTSP_CAMERA_PASSWORD || "gspe-intercon"
      }@${process.env.RTSP_CAMERA_IP || "192.168.0.64"}:${
        process.env.RTSP_CAMERA_PORT || "554"
      }/Streaming/Channels/${process.env.RTSP_CAMERA_CHANNEL || "101"}`;

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-rtsp_transport",
        "tcp",
        "-i",
        rtspUrl,
        "-vframes",
        "1",
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "-q:v",
        "2",
        "-y", // Overwrite output
        "-",
      ]);

      let frameData = Buffer.alloc(0);
      let errorOutput = "";

      ffmpeg.stdout.on("data", (chunk) => {
        frameData = Buffer.concat([frameData, chunk]);
      });

      ffmpeg.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on("error", (error) => {
        console.error("❌ FFmpeg spawn error:", error);
        resolve(
          NextResponse.json(
            {
              success: false,
              error: "Failed to start FFmpeg",
              details: error.message,
            },
            { status: 500 }
          )
        );
      });

      ffmpeg.on("close", (code) => {
        if (code === 0 && frameData.length > 0) {
          // Convert to base64
          const base64Frame = frameData.toString("base64");

          resolve(
            NextResponse.json({
              success: true,
              image: base64Frame,
              size: frameData.length,
              timestamp: new Date().toISOString(),
            })
          );
        } else {
          console.error(`❌ FFmpeg failed with code ${code}`);
          console.error(`📝 FFmpeg stderr: ${errorOutput}`);

          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Failed to capture frame",
                code,
                details: errorOutput,
                rtspUrl: rtspUrl.replace(/:[^:@]*@/, ":***@"), // Hide password in response
              },
              { status: 500 }
            )
          );
        }
      });

      // Increase timeout to 30 seconds for better reliability
      setTimeout(() => {
        ffmpeg.kill("SIGTERM");

        setTimeout(() => {
          if (!ffmpeg.killed) {
            console.log("🔪 Force killing FFmpeg process...");
            ffmpeg.kill("SIGKILL");
          }
        }, 2000);

        resolve(
          NextResponse.json(
            {
              success: false,
              error: "Frame capture timeout",
              timeout: 30000,
              details: errorOutput,
            },
            { status: 408 }
          )
        );
      }, 30000); // 30 second timeout
    });
  } catch (error) {
    console.error("❌ Capture frame error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to capture frame",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
