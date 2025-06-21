import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

// Force dynamic rendering - prevent static generation during build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rtspUrl =
      "rtsp://admin:gspe-intercon@192.168.0.64:554/Streaming/Channels/101";

    console.log("🎥 Starting RTSP to MJPEG conversion...");
    console.log(`📡 RTSP Source: ${rtspUrl}`);

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

        let frameBuffer = Buffer.alloc(0);
        let frameCount = 0;

        ffmpeg.stdout.on("data", (chunk) => {
          frameBuffer = Buffer.concat([frameBuffer, chunk]);

          // Look for JPEG markers (FFD8 = start, FFD9 = end)
          let startIndex = 0;

          while (startIndex < frameBuffer.length - 1) {
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

            try {
              // Send frame as multipart response
              const boundary = `--frame\r\n`;
              const contentType = `Content-Type: image/jpeg\r\n`;
              const contentLength = `Content-Length: ${frameData.length}\r\n\r\n`;
              const endBoundary = `\r\n`;

              controller.enqueue(new TextEncoder().encode(boundary));
              controller.enqueue(new TextEncoder().encode(contentType));
              controller.enqueue(new TextEncoder().encode(contentLength));
              controller.enqueue(frameData);
              controller.enqueue(new TextEncoder().encode(endBoundary));

              if (frameCount % 30 === 0) {
                console.log(
                  `📸 Streamed ${frameCount} frames, latest frame size: ${frameData.length} bytes`
                );
              }
            } catch (error) {
              console.error("❌ Error sending frame:", error);
            }

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
            // Log periodic stats
            console.log(`📊 FFmpeg: ${message.trim()}`);
          } else if (message.includes("error") || message.includes("Error")) {
            console.error(`❌ FFmpeg Error: ${message}`);
          }
        });

        ffmpeg.on("error", (error) => {
          console.error("❌ FFmpeg process error:", error);
          controller.error(error);
        });

        ffmpeg.on("close", (code) => {
          console.log(`🔚 FFmpeg process closed with code ${code}`);
          if (code !== 0) {
            controller.error(
              new Error(`FFmpeg process exited with code ${code}`)
            );
          } else {
            controller.close();
          }
        });

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("🔌 Client disconnected, killing FFmpeg process");
          ffmpeg.kill("SIGTERM");
          setTimeout(() => {
            if (!ffmpeg.killed) {
              console.log("🔪 Force killing FFmpeg process");
              ffmpeg.kill("SIGKILL");
            }
          }, 5000);
          controller.close();
        });

        console.log("✅ MJPEG streaming started successfully");
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error("❌ MJPEG Stream setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to start MJPEG stream",
        details: error instanceof Error ? error.message : "Unknown error",
        rtsp_url:
          "rtsp://admin:gspe-intercon@192.168.0.64:554/Streaming/Channels/101",
      },
      { status: 500 }
    );
  }
}
