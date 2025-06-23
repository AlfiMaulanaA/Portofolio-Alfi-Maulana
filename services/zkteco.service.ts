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
  private connectionStatus: { connected: boolean; lastChecked: Date | null } = {
    connected: false,
    lastChecked: null,
  };

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

      console.log(`🔄 Executing ZKTeco script: ${scriptName}`);
      console.log(`📝 Python command: python ${pythonArgs.join(" ")}`);

      const pythonProcess = spawn("python", pythonArgs);
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        // Log real-time output for debugging
        console.log(`📤 Python stdout: ${output.trim()}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        // Log real-time errors for debugging
        console.error(`📥 Python stderr: ${error.trim()}`);
      });

      pythonProcess.on("close", (code) => {
        console.log(`🔚 Python process closed with code: ${code}`);
        console.log(`📝 Full stdout: ${stdout}`);
        if (stderr) {
          console.error(`📝 Full stderr: ${stderr}`);
        }

        if (code === 0) {
          try {
            // Try to parse the last line as JSON (the result)
            const lines = stdout.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            console.log(`🔍 Parsing last line: ${lastLine}`);

            const result = JSON.parse(lastLine);
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
          const errorMessage =
            stderr || stdout || `Process exited with code ${code}`;
          console.error(`❌ ZKTeco ${scriptName} error:`, errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });

      pythonProcess.on("error", (error) => {
        console.error(`❌ ZKTeco ${scriptName} spawn error:`, error);
        resolve({ success: false, error: error.message });
      });

      // Add timeout handling
      setTimeout(() => {
        if (!pythonProcess.killed) {
          console.log(`⏰ Python process timeout, killing process`);
          pythonProcess.kill("SIGTERM");
          resolve({ success: false, error: "Process timeout" });
        }
      }, 30000); // 30 second timeout
    });
  }

  public async testSimple(): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Testing Python imports and ZK library...");
      return await this.executePythonScript("test_simple");
    } catch (error) {
      console.error("❌ Simple test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async testConnection(forceTest = false): Promise<ZKTecoResponse> {
    try {
      // Check if we recently tested and it was successful
      if (
        !forceTest &&
        this.connectionStatus.connected &&
        this.connectionStatus.lastChecked &&
        Date.now() - this.connectionStatus.lastChecked.getTime() < 60000
      ) {
        // Less than 1 minute ago
        console.log("🔄 Using cached ZKTeco connection status (connected)");
        return {
          success: true,
          message: "Connection cached as successful",
          data: { cached: true },
        };
      }

      console.log("🔄 Testing ZKTeco connection...");
      const result = await this.executePythonScript("test_connection");

      // Update connection status
      this.connectionStatus.connected = result.success;
      this.connectionStatus.lastChecked = new Date();

      if (result.success) {
        console.log("✅ ZKTeco connection test successful");
      } else {
        console.log("❌ ZKTeco connection test failed");
      }

      return result;
    } catch (error) {
      console.error("❌ ZKTeco connection test failed:", error);
      this.connectionStatus.connected = false;
      this.connectionStatus.lastChecked = new Date();
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

      // Test imports first
      console.log("🔍 Testing Python imports before user creation...");
      const importTest = await this.testSimple();
      if (!importTest.success) {
        console.error("❌ Python import test failed:", importTest.error);
        return {
          success: false,
          error: `Python import failed: ${importTest.error}`,
        };
      }

      const args = [
        userData.uid.toString(),
        userData.name,
        userData.userId,
        (userData.privilege || 0).toString(),
      ];

      if (userData.password) {
        args.push(userData.password);
      }

      const result = await this.executePythonScript("create_user", args);

      if (result.success) {
        const userInfo = result.data?.user || {};
        const finalUid = userInfo.uid || userData.uid;
        const uidChanged = userInfo.uid_changed || false;

        console.log(
          `✅ ZKTeco user created successfully: ${userData.name} (UID: ${finalUid})`
        );

        if (uidChanged) {
          console.log(
            `⚠️ UID changed from ${userData.uid} to ${finalUid} due to conflict`
          );
        }

        // Return the actual UID that was used
        return {
          ...result,
          data: {
            ...result.data,
            actualUid: finalUid,
            uidChanged: uidChanged,
          },
        };
      } else {
        console.error(`❌ ZKTeco user creation failed: ${result.error}`);
      }

      return result;
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
      connected: this.connectionStatus.connected,
      lastChecked: this.connectionStatus.lastChecked,
    };
  }

  // Get connection status without testing
  public getConnectionStatus() {
    return this.connectionStatus;
  }
}
