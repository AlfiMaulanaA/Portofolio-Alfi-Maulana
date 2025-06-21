interface PersonnelCreateRequest {
  name: string;
  department: string;
  entity: string;
  authorized: boolean;
}

interface PersonnelCreateResponse {
  id: number;
  success: boolean;
}

interface PhotoUploadRequest {
  image: string; // base64 encoded image
}

interface PhotoUploadResponse {
  success: boolean;
}

interface RefreshResponse {
  success: boolean;
}

export class FaceApiService {
  private static instance: FaceApiService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = "https://face.iotech.my.id";
  }

  public static getInstance(): FaceApiService {
    if (!FaceApiService.instance) {
      FaceApiService.instance = new FaceApiService();
    }
    return FaceApiService.instance;
  }

  public async createPersonnel(
    data: PersonnelCreateRequest
  ): Promise<PersonnelCreateResponse> {
    try {
      console.log("🔄 Creating personnel:", data);

      const response = await fetch(`${this.apiUrl}/personnel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Personnel created:", result);

      return result;
    } catch (error) {
      console.error("❌ Personnel creation error:", error);
      throw new Error(
        `Personnel creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async uploadPhoto(
    personnelId: number,
    imageBase64: string
  ): Promise<PhotoUploadResponse> {
    try {
      console.log("🔄 Uploading photo for personnel:", personnelId);

      const response = await fetch(
        `${this.apiUrl}/personnel/${personnelId}/photo-b64`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageBase64,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Photo uploaded:", result);

      return result;
    } catch (error) {
      console.error("❌ Photo upload error:", error);
      throw new Error(
        `Photo upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async refreshDatabase(): Promise<RefreshResponse> {
    try {
      console.log("🔄 Refreshing face database...");

      const response = await fetch(`${this.apiUrl}/refresh`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Database refreshed:", result);

      return result;
    } catch (error) {
      console.error("❌ Database refresh error:", error);
      throw new Error(
        `Database refresh failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
