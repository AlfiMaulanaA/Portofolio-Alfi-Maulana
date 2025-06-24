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

      // Check if script exists
      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Python script not found: ${scriptPath}`);
        resolve({
          success: false,
          error: `Python script not found: ${scriptName}.py. Please ensure the script exists in ${this.pythonScriptPath}`,
        });
        return;
      }

      const pythonArgs = [
        scriptPath,
        this.deviceIp,
        this.devicePort.toString(),
        this.devicePassword,
        this.timeout.toString(),
        ...args,
      ];

      console.log(`🔄 Executing ZKTeco script: ${scriptName}`);
      console.log(`📋 Script path: ${scriptPath}`);
      console.log(`📋 Python args: python ${pythonArgs.join(" ")}`);

      const pythonProcess = spawn("python3", pythonArgs);
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`📤 [${scriptName}] STDOUT:`, output.trim());
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        console.error(`📤 [${scriptName}] STDERR:`, error.trim());
      });

      pythonProcess.on("close", (code) => {
        console.log(`📋 [${scriptName}] Process exited with code: ${code}`);
        console.log(`📋 [${scriptName}] Full STDOUT:`, stdout.trim());
        console.log(`📋 [${scriptName}] Full STDERR:`, stderr.trim());

        if (code === 0) {
          try {
            // Try to parse the last line as JSON (the result)
            const lines = stdout.trim().split("\n");
            const lastLine = lines[lines.length - 1];

            if (lastLine && lastLine.startsWith("{")) {
              const result = JSON.parse(lastLine);
              console.log(`✅ ZKTeco ${scriptName} success:`, result);
              resolve({ success: true, data: result });
            } else {
              console.log(
                `✅ ZKTeco ${scriptName} success (no JSON):`,
                stdout.trim()
              );
              resolve({ success: true, message: stdout.trim() });
            }
          } catch (error) {
            console.log(
              `✅ ZKTeco ${scriptName} success (parse error):`,
              stdout.trim()
            );
            resolve({ success: true, message: stdout.trim() });
          }
        } else {
          const errorMessage =
            stderr.trim() || `Process exited with code ${code}`;
          console.error(`❌ ZKTeco ${scriptName} error:`, errorMessage);

          // Try to parse error as JSON for more details
          try {
            const lines = stderr.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            if (lastLine && lastLine.startsWith("{")) {
              const errorResult = JSON.parse(lastLine);
              resolve({
                success: false,
                error: errorResult.error || errorMessage,
                data: errorResult,
              });
            } else {
              resolve({ success: false, error: errorMessage });
            }
          } catch (parseError) {
            resolve({ success: false, error: errorMessage });
          }
        }
      });

      pythonProcess.on("error", (error) => {
        console.error(`❌ ZKTeco ${scriptName} spawn error:`, error);
        resolve({
          success: false,
          error: `Failed to execute Python script: ${error.message}. Please ensure Python is installed and accessible.`,
        });
      });

      // Add timeout for the process
      setTimeout(() => {
        if (!pythonProcess.killed) {
          console.error(
            `⏰ ZKTeco ${scriptName} timeout after ${this.timeout * 2} seconds`
          );
          pythonProcess.kill();
          resolve({
            success: false,
            error: `Script execution timeout after ${this.timeout * 2} seconds`,
          });
        }
      }, this.timeout * 2000); // Double the device timeout for script execution
    });
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
      console.log(
        `📋 Device: ${this.deviceIp}:${this.devicePort}, Password: ${this.devicePassword}, Timeout: ${this.timeout}s`
      );

      const result = await this.executePythonScript("test_connection");

      // Update connection status
      this.connectionStatus.connected = result.success;
      this.connectionStatus.lastChecked = new Date();

      if (result.success) {
        console.log("✅ ZKTeco connection test successful");
      } else {
        console.log("❌ ZKTeco connection test failed:", result.error);
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

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot create user");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
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

      console.log(`📋 Creating user with args: [${args.join(", ")}]`);

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

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot delete user");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
        };
      }

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
    fingerIndex = 1,
    mode = "register"
  ): Promise<ZKTecoResponse> {
    try {
      console.log(
        "🔄 Enrolling fingerprint to ZKTeco:",
        uid,
        fingerIndex,
        mode
      );

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot enroll fingerprint");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
        };
      }

      const args = [uid.toString(), fingerIndex.toString(), mode];

      const result = await this.executePythonScript("enroll_finger", args);

      if (result.success) {
        console.log(
          `✅ ZKTeco fingerprint enrollment successful: UID ${uid}, Finger ${fingerIndex}`
        );
      } else {
        console.error(
          `❌ ZKTeco fingerprint enrollment failed: ${result.error}`
        );
      }

      return result;
    } catch (error) {
      console.error("❌ ZKTeco fingerprint enrollment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async registerCard(
    uid: number,
    cardNumber: string
  ): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Registering card to ZKTeco:", uid, cardNumber);

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot register card");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
        };
      }

      const args = [uid.toString(), cardNumber];

      const result = await this.executePythonScript("register_card", args);

      if (result.success) {
        console.log(
          `✅ ZKTeco card registration successful: UID ${uid}, Card ${cardNumber}`
        );
      } else {
        console.error(`❌ ZKTeco card registration failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error("❌ ZKTeco card registration failed:", error);
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

  public async addUser(userData: {
    uid: number;
    username: string;
    password?: string;
  }): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Adding user to ZKTeco:", userData);

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot add user");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
        };
      }

      const args = [
        userData.uid.toString(),
        userData.username,
        userData.password || "",
      ];

      console.log(`📋 Adding user with args: [${args.join(", ")}]`);

      const result = await this.executePythonScript("add_user", args);

      if (result.success) {
        console.log(
          `✅ ZKTeco user added successfully: ${userData.username} (UID: ${userData.uid})`
        );
      } else {
        console.error(`❌ ZKTeco user addition failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error("❌ ZKTeco user addition failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async getLastUid(): Promise<ZKTecoResponse> {
    try {
      console.log("🔄 Getting last UID from ZKTeco...");

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.error("❌ ZKTeco connection failed, cannot get last UID");
        return {
          success: false,
          error: `Cannot connect to ZKTeco device: ${connectionTest.error}`,
        };
      }

      const result = await this.executePythonScript("get_last_uid");

      if (result.success) {
        console.log(
          `✅ ZKTeco last UID retrieved: ${result.data?.last_uid}, next: ${result.data?.next_uid}`
        );
      } else {
        console.error(`❌ ZKTeco get last UID failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error("❌ ZKTeco get last UID failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Diagnostic method to check system requirements
  public async diagnoseSystem(): Promise<ZKTecoResponse> {
    try {
      console.log("🔍 Running ZKTeco system diagnostics...");

      const diagnostics = {
        pythonAvailable: false,
        scriptsExist: false,
        deviceReachable: false,
        dependenciesInstalled: false,
        errors: [] as string[],
        details: {} as any,
      };

      // Check if Python is available
      try {
        const pythonCheck = spawn("python3", ["--version"]);
        await new Promise((resolve) => {
          pythonCheck.on("close", (code) => {
            diagnostics.pythonAvailable = code === 0;
            if (code !== 0) {
              diagnostics.errors.push("Python is not available or not in PATH");
            }
            resolve(code);
          });
        });
      } catch (error) {
        diagnostics.errors.push("Failed to check Python availability");
      }

      // Check if scripts exist
      const requiredScripts = [
        "test_connection.py",
        "create_user.py",
        "delete_user.py",
      ];
      const missingScripts = [];

      for (const script of requiredScripts) {
        const scriptPath = path.join(this.pythonScriptPath, script);
        if (!fs.existsSync(scriptPath)) {
          missingScripts.push(script);
        }
      }

      diagnostics.scriptsExist = missingScripts.length === 0;
      if (missingScripts.length > 0) {
        diagnostics.errors.push(
          `Missing scripts: ${missingScripts.join(", ")}`
        );
      }

      // Test device connection
      const connectionResult = await this.testConnection(true);
      diagnostics.deviceReachable = connectionResult.success;
      if (!connectionResult.success) {
        diagnostics.errors.push(
          `Device connection failed: ${connectionResult.error}`
        );
      }

      diagnostics.details = {
        deviceIp: this.deviceIp,
        devicePort: this.devicePort,
        timeout: this.timeout,
        scriptsPath: this.pythonScriptPath,
        missingScripts,
        connectionResult,
      };

      const overallSuccess =
        diagnostics.pythonAvailable &&
        diagnostics.scriptsExist &&
        diagnostics.deviceReachable;

      return {
        success: overallSuccess,
        data: diagnostics,
        message: overallSuccess
          ? "All diagnostics passed"
          : "Some diagnostics failed",
      };
    } catch (error) {
      console.error("❌ System diagnostics failed:", error);
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
