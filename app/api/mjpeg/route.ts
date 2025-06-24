import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

// Prevent static generation for this streaming route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Build RTSP URL from environment variables
    const cameraIp = process.env.RTSP_CAMERA_IP || "192.168.0.64";
    const cameraPort = process.env.RTSP_CAMERA_PORT || "554";
    const cameraUsername = process.env.RTSP_CAMERA_USERNAME || "admin";
    const cameraPassword = process.env.RTSP_CAMERA_PASSWORD || "gspe-intercon";
    const cameraChannel = process.env.RTSP_CAMERA_CHANNEL || "101";

    const rtspUrl =
      process.env.RTSP_CAMERA_URL ||
      `rtsp://${cameraUsername}:${cameraPassword}@${cameraIp}:${cameraPort}/Streaming/Channels/${cameraChannel}`;

    // Set up response headers for MJPEG streaming
    const headers = new Headers({
      "Content-Type": "multipart/x-mixed-replace; boundary=frame",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      Connection: "keep-alive",
    });

    // Create a readable stream
    const stream = new ReadableStream({
      start(controller) {
        let isControllerClosed = false;
        let ffmpegProcess: any = null;

        const ffmpeg = spawn("ffmpeg", [
          "-rtsp_transport",
          "tcp",
          "-fflags",
          "nobuffer",
          "-flags",
          "low_delay",
          "-probesize",
          "32",
          "-analyzeduration",
          "0",
          "-an",
          "-i",
          rtspUrl,
          "-vf",
          "fps=15,scale=640:480",
          "-q:v",
          "5",
          "-f",
          "image2pipe",
          "-vcodec",
          "mjpeg",
          "-",
        ]);

        ffmpegProcess = ffmpeg;

        let frameBuffer = Buffer.alloc(0);
        let frameCount = 0;

        // Helper function to safely enqueue data
        const safeEnqueue = (data: any) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(data);
              return true;
            } catch (error) {
              isControllerClosed = true;
              return false;
            }
          }
          return false;
        };

        ffmpeg.stdout.on("data", (chunk) => {
          if (isControllerClosed) return;

          frameBuffer = Buffer.concat([frameBuffer, chunk]);

          // Look for JPEG markers (FFD8 = start, FFD9 = end)
          let startIndex = 0;

          while (startIndex < frameBuffer.length - 1 && !isControllerClosed) {
            // Find JPEG start marker (0xFFD8)
            const jpegStart = frameBuffer.indexOf(
              Buffer.from([0xff, 0xd8]),
              startIndex
            );
            if (jpegStart === -1) break;

            // Find JPEG end marker (0xFFD9)
            const jpegEnd = frameBuffer.indexOf(
              Buffer.from([0xff, 0xd9]),
              jpegStart + 2
            );
            if (jpegEnd === -1) break;

            // Extract complete JPEG frame
            const frameData = frameBuffer.slice(jpegStart, jpegEnd + 2);
            frameCount++;

            // Send frame as multipart response
            const boundary = `--frame\r\n`;
            const contentType = `Content-Type: image/jpeg\r\n`;
            const contentLength = `Content-Length: ${frameData.length}\r\n\r\n`;
            const endBoundary = `\r\n`;

            // Safely enqueue all frame parts
            if (!safeEnqueue(new TextEncoder().encode(boundary))) break;
            if (!safeEnqueue(new TextEncoder().encode(contentType))) break;
            if (!safeEnqueue(new TextEncoder().encode(contentLength))) break;
            if (!safeEnqueue(frameData)) break;
            if (!safeEnqueue(new TextEncoder().encode(endBoundary))) break;

            startIndex = jpegEnd + 2;
          }

          // Keep remaining data for next chunk
          if (startIndex > 0) {
            frameBuffer = frameBuffer.slice(startIndex);
          }
        });

        ffmpeg.stderr.on("data", (data) => {
          const message = data.toString();
          if (message.includes("frame=") || message.includes("fps=")) {
          } else if (message.includes("error") || message.includes("Error")) {
            console.error(`❌ FFmpeg Error: ${message}`);
          }
        });

        ffmpeg.on("error", (error) => {
          console.error("❌ FFmpeg process error:", error);
          if (!isControllerClosed) {
            controller.error(error);
            isControllerClosed = true;
          }
        });

        ffmpeg.on("close", (code) => {
          if (!isControllerClosed) {
            if (code !== 0) {
              controller.error(
                new Error(`FFmpeg process exited with code ${code}`)
              );
            } else {
              controller.close();
            }
            isControllerClosed = true;
          }
        });

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          isControllerClosed = true;

          if (ffmpegProcess && !ffmpegProcess.killed) {
            ffmpegProcess.kill("SIGTERM");
            setTimeout(() => {
              if (ffmpegProcess && !ffmpegProcess.killed) {
                ffmpegProcess.kill("SIGKILL");
              }
            }, 3000);
          }

          if (!isControllerClosed) {
            controller.close();
            isControllerClosed = true;
          }
        });
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error("❌ MJPEG Stream setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to start MJPEG stream",
        details: error instanceof Error ? error.message : "Unknown error",
        rtsp_config: {
          ip: process.env.RTSP_CAMERA_IP || "not-configured",
          port: process.env.RTSP_CAMERA_PORT || "not-configured",
          channel: process.env.RTSP_CAMERA_CHANNEL || "not-configured",
        },
      },
      { status: 500 }
    );
  }
}
