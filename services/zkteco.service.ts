import { spawn } from "child_process";
import path from "path";
import fs from "fs";

interface ZKTecoUser {
  uid: number;
  name: string;
  privilege: number; // 0=User, 14=Admin
  password?: string;
  group_id?: string;
  user_id: string;
}

interface ZKTecoFingerprint {
  uid: number;
  fid: number; // Finger ID (0-9)
  template: string;
}

interface ZKTecoResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export class ZKTecoService {
  private static instance: ZKTecoService;
  private deviceIp: string;
  private devicePort: number;
  private devicePassword: string;
  private timeout: number;
  private pythonScriptPath: string;

  private constructor() {
    // Use environment variables for ZKTeco configuration
    this.deviceIp = process.env.ZKTECO_DEVICE_IP || "192.168.1.201";
    this.devicePort = Number.parseInt(process.env.ZKTECO_DEVICE_PORT || "4370");
    this.devicePassword = process.env.ZKTECO_DEVICE_PASSWORD || "0";
    this.timeout = Number.parseInt(process.env.ZKTECO_TIMEOUT || "5");
    this.pythonScriptPath = path.join(process.cwd(), "scripts", "zkteco");

    // Create scripts directory if it doesn't exist
    if (!fs.existsSync(this.pythonScriptPath)) {
      fs.mkdirSync(this.pythonScriptPath, { recursive: true });
    }

    console.log(
      `🔧 ZKTeco Service initialized - Device: ${this.deviceIp}:${this.devicePort}`
    );
  }

  public static getInstance(): ZKTecoService {
    if (!ZKTecoService.instance) {
      ZKTecoService.instance = new ZKTecoService();
    }
    return ZKTecoService.instance;
  }

  private async executePythonScript(
    scriptName: string,
    args: string[] = []
  ): Promise<ZKTecoResponse> {
    return new Promise((resolve) => {
      const scriptPath = path.join(this.pythonScriptPath, `${scriptName}.py`);
      const pythonArgs = [
        scriptPath,
        this.deviceIp,
        this.devicePort.toString(),
        this.devicePassword,
        this.timeout.toString(),
        ...args,
      ];

      console.log(`🔄 Executing ZKTeco script: ${scriptName}`, {
        ip: this.deviceIp,
        port: this.devicePort,
      });

      const pythonProcess = spawn("python", pythonArgs);
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            console.log(`✅ ZKTeco ${scriptName} success:`, result);
            resolve({ success: true, data: result });
          } catch (error) {
            console.log(
              `✅ ZKTeco ${scriptName} success (no JSON):`,
              stdout.trim()
            );
            resolve({ success: true, message: stdout.trim() });
          }
        } else {
          console.error(`❌ ZKTeco ${scriptName} error:`, stderr);
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      pythonProcess.on("error", (error) => {
        console.error(`❌ ZKTeco ${scriptName} spawn error:`, error);
        resolve({ success: false, error: error.message });
      });
    });
  }

  public async testConnection(): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Testing ZKTeco connection...");
      return await this.executePythonScript("test_connection");
    } catch (error) {
      console.error("❌ ZKTeco connection test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async createUser(userData: {
    uid: number;
    name: string;
    userId: string;
    privilege?: number;
    password?: string;
  }): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Creating ZKTeco user:", userData);

      const args = [
        userData.uid.toString(),
        userData.name,
        userData.userId,
        (userData.privilege || 0).toString(),
      ];

      if (userData.password) {
        args.push(userData.password);
      }

      return await this.executePythonScript("create_user", args);
    } catch (error) {
      console.error("❌ ZKTeco user creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async deleteUser(uid: number): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Deleting ZKTeco user:", uid);
      return await this.executePythonScript("delete_user", [uid.toString()]);
    } catch (error) {
      console.error("❌ ZKTeco user deletion failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async setUserPassword(
    uid: number,
    password: string
  ): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Setting ZKTeco user password:", uid);
      return await this.executePythonScript("set_password", [
        uid.toString(),
        password,
      ]);
    } catch (error) {
      console.error("❌ ZKTeco password setting failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async enrollFingerprint(
    uid: number,
    fingerId = 0
  ): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Enrolling ZKTeco fingerprint:", uid, fingerId);
      return await this.executePythonScript("enroll_fingerprint", [
        uid.toString(),
        fingerId.toString(),
      ]);
    } catch (error) {
      console.error("❌ ZKTeco fingerprint enrollment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async setUserCard(
    uid: number,
    cardNumber: string
  ): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Setting ZKTeco user card:", uid, cardNumber);
      return await this.executePythonScript("set_card", [
        uid.toString(),
        cardNumber,
      ]);
    } catch (error) {
      console.error("❌ ZKTeco card setting failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async getAllUsers(): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Getting all ZKTeco users...");
      return await this.executePythonScript("get_users");
    } catch (error) {
      console.error("❌ ZKTeco get users failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async clearAllData(): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Clearing all ZKTeco data...");
      return await this.executePythonScript("clear_data");
    } catch (error) {
      console.error("❌ ZKTeco clear data failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Getter methods for configuration
  public getDeviceConfig() {
    return {
      ip: this.deviceIp,
      port: this.devicePort,
      timeout: this.timeout,
    };
  }
}
