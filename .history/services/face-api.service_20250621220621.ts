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

interface DeletePersonnelResponse {
  message: string;
}

interface PersonnelResponse {
  id: number;
  name: string;
  department: string;
  entity: string;
  authorized: boolean;
  created_at?: string;
  updated_at?: string;
}

export class FaceApiService {
  private static instance: FaceApiService;
  private apiUrl: string;

  private constructor() {
    // Use environment variable for Face API base URL
    this.apiUrl =
      process.env.FACE_API_BASE_URL ||
      process.env.NEXT_PUBLIC_FACE_VERIFY_API_URL?.replace("/verify", "") ||
      "https://face.iotech.my.id";
    console.log(`🔧 Face API Service initialized - Base URL: ${this.apiUrl}`);
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

  public async deletePersonnel(
    personnelId: number
  ): Promise<DeletePersonnelResponse> {
    try {
      console.log("🔄 Deleting personnel:", personnelId);

      const response = await fetch(`${this.apiUrl}/personnel/${personnelId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Personnel deleted:", result);

      return result;
    } catch (error) {
      console.error("❌ Personnel deletion error:", error);
      throw new Error(
        `Personnel deletion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async getPersonnel(personnelId: number): Promise<PersonnelResponse> {
    try {
      console.log("🔄 Getting personnel:", personnelId);

      const response = await fetch(`${this.apiUrl}/personnel/${personnelId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Personnel retrieved:", result);

      return result;
    } catch (error) {
      console.error("❌ Personnel retrieval error:", error);
      throw new Error(
        `Personnel retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async getAllPersonnel(): Promise<PersonnelResponse[]> {
    try {
      console.log("🔄 Getting all personnel...");

      const response = await fetch(`${this.apiUrl}/personnel`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ All personnel retrieved:", result);

      return result;
    } catch (error) {
      console.error("❌ All personnel retrieval error:", error);
      throw new Error(
        `All personnel retrieval failed: ${
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
