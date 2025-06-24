const { spawn } = require("child_process");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function setupZKTeco() {
  // Get configuration from environment variables
  const zktecoIp = process.env.ZKTECO_DEVICE_IP || "192.168.1.201";
  const zktecoPort = process.env.ZKTECO_DEVICE_PORT || "4370";
  const zktecoPassword = process.env.ZKTECO_DEVICE_PASSWORD || "0";
  const zktecoTimeout = process.env.ZKTECO_TIMEOUT || "5";

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
          } else {
            console.log("⚠️  ZKTeco connection test failed:", result.error);
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
