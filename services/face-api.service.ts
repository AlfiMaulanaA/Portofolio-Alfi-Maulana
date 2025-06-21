interface FaceApiUser {
  id: number;
  name: string;
  created_at: string;
}

interface FaceApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export class FaceApiService {
  private static instance: FaceApiService;
  private baseUrl: string;

  private constructor() {
    // Use environment variable for Face API base URL
    this.baseUrl =
      process.env.FACE_API_BASE_URL ||
      process.env.NEXT_PUBLIC_FACE_VERIFY_API_URL?.replace("/verify", "") ||
      "https://face.iotech.my.id";
  }

  public static getInstance(): FaceApiService {
    if (!FaceApiService.instance) {
      FaceApiService.instance = new FaceApiService();
    }
    return FaceApiService.instance;
  }

  public async createUser(userData: {
    name: string;
    image: string;
  }): Promise<FaceApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Face API user creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async deleteUser(userId: number): Promise<FaceApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Face API user deletion failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async getAllUsers(): Promise<FaceApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Face API get users failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async updateUser(
    userId: number,
    userData: { name?: string; image?: string }
  ): Promise<FaceApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Face API user update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
