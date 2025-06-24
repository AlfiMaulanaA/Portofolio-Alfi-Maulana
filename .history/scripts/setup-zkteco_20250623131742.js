const { spawn } = require("child_process");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function setupZKTeco() {
  console.log("🔧 Setting up ZKTeco connection...");

  // Get configuration from environment variables
  const zktecoIp = process.env.ZKTECO_DEVICE_IP || "192.168.1.201";
  const zktecoPort = process.env.ZKTECO_DEVICE_PORT || "4370";
  const zktecoPassword = process.env.ZKTECO_DEVICE_PASSWORD || "0";
  const zktecoTimeout = process.env.ZKTECO_TIMEOUT || "5";

  console.log(`📡 Testing ZKTeco device at ${zktecoIp}:${zktecoPort}`);

  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, "zkteco", "test_connection.py");
    const pythonProcess = spawn("python", [
      scriptPath,
      zktecoIp,
      zktecoPort,
      zktecoPassword,
      zktecoTimeout,
    ]);

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
          if (result.success) {
            console.log("✅ ZKTeco connection test passed!");
            console.log(
              `📋 Device info:`,
              JSON.stringify(result.device_info, null, 2)
            );
          } else {
            console.log("⚠️  ZKTeco connection test failed:", result.error);
            console.log(
              "📝 Note: Application will continue without ZKTeco integration"
            );
          }
        } catch (error) {
          console.log("⚠️  ZKTeco response parsing failed:", error.message);
        }
      } else {
        console.log("⚠️  ZKTeco connection test failed with code:", code);
        if (stderr) {
          console.log("📝 Error details:", stderr);
        }
        console.log(
          "📝 Note: Application will continue without ZKTeco integration"
        );
      }

      console.log("🚀 ZKTeco setup completed");
      resolve();
    });

    pythonProcess.on("error", (error) => {
      console.log("⚠️  ZKTeco setup error:", error.message);
      console.log("📝 Note: Make sure Python and pyzk library are installed");
      console.log("📝 Run: pip install pyzk==0.9.0");
      console.log("🚀 ZKTeco setup completed (with warnings)");
      resolve();
    });
  });
}

// Run setup if called directly
if (require.main === module) {
  setupZKTeco().then(() => {
    process.exit(0);
  });
}

module.exports = { setupZKTeco };
