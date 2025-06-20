import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const rtspUrl =
      "rtsp://admin:gspe-intercon@192.168.0.64:554/Streaming/Channels/101";

    return new Promise((resolve, reject) => {
      console.log("Capturing frame from RTSP stream...");

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
        "-",
      ]);

      let frameData = Buffer.alloc(0);

      ffmpeg.stdout.on("data", (chunk) => {
        frameData = Buffer.concat([frameData, chunk]);
      });

      ffmpeg.stderr.on("data", (data) => {
        console.log(`FFmpeg capture stderr: ${data}`);
      });

      ffmpeg.on("error", (error) => {
        console.error("FFmpeg capture error:", error);
        reject(
          NextResponse.json(
            { error: "Failed to capture frame", details: error.message },
            { status: 500 }
          )
        );
      });

      ffmpeg.on("close", (code) => {
        if (code === 0 && frameData.length > 0) {
          // Convert to base64
          const base64Frame = frameData.toString("base64");
          console.log(
            `Frame captured successfully, size: ${frameData.length} bytes`
          );

          resolve(
            NextResponse.json({
              success: true,
              image: base64Frame,
              size: frameData.length,
            })
          );
        } else {
          console.error(`FFmpeg capture failed with code ${code}`);
          reject(
            NextResponse.json(
              { error: "Failed to capture frame", code },
              { status: 500 }
            )
          );
        }
      });

      // Set timeout for capture
      setTimeout(() => {
        ffmpeg.kill("SIGTERM");
        reject(
          NextResponse.json({ error: "Frame capture timeout" }, { status: 408 })
        );
      }, 10000); // 10 second timeout
    });
  } catch (error) {
    console.error("Capture frame error:", error);
    return NextResponse.json(
      {
        error: "Failed to capture frame",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
