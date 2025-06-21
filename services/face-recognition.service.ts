interface FaceVerificationRequest {
  image: string; // base64 encoded image
}

interface FaceVerificationResponse {
  authorized: boolean;
  distance: number;
  name: string;
  person_id: number | null;
  success: boolean;
}

interface CaptureFrameResponse {
  success: boolean;
  image: string;
  size: number;
}

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private apiUrl: string;
  private streamUrl: string;

  private constructor() {
    // Use environment variable for Face API URL
    const baseUrl =
      process.env.NEXT_PUBLIC_FACE_VERIFY_API_URL ||
      process.env.FACE_API_BASE_URL ||
      "https://face.iotech.my.id";
    this.apiUrl = baseUrl.endsWith("/verify") ? baseUrl : `${baseUrl}/verify`;
    this.streamUrl = "/api/mjpeg";
  }

  public static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  public getStreamUrl(): string {
    return this.streamUrl;
  }

  public async captureFrameFromRTSP(): Promise<string> {
    try {
      const response = await fetch("/api/capture-frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CaptureFrameResponse = await response.json();

      if (!result.success) {
        throw new Error("Failed to capture frame from RTSP stream");
      }

      return result.image;
    } catch (error) {
      console.error("RTSP frame capture error:", error);
      throw new Error(
        `RTSP frame capture failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async verifyFace(
    imageBase64: string
  ): Promise<FaceVerificationResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📊 API Response:", result);

      return result;
    } catch (error) {
      console.error("Face verification error:", error);
      throw new Error(
        `Face verification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public captureFrameFromImg(imgElement: HTMLImageElement): string {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;

    // Set crossOrigin to avoid CORS issues
    imgElement.crossOrigin = "anonymous";
    context.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    // Convert to base64 (remove data:image/jpeg;base64, prefix)
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  }
}
