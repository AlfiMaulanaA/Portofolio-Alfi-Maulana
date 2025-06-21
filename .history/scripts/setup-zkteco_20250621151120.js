const { spawn } = require("child_process");
const path = require("path");

console.log("🔧 Setting up ZKTeco connection...");

const deviceIp = process.env.ZKTECO_DEVICE_IP || "192.168.1.201";
const devicePort = process.env.ZKTECO_DEVICE_PORT || "4370";

console.log(`📡 Testing ZKTeco device at ${deviceIp}:${devicePort}`);

const scriptPath = path.join(__dirname, "zkteco", "test_connection.py");
const pythonProcess = spawn("python", [scriptPath, deviceIp, devicePort]);

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
    console.log("✅ ZKTeco connection test passed!");
    console.log("📋 Device info:", stdout.trim());
  } else {
    console.log("⚠️  ZKTeco connection test failed (device might be offline)");
    console.log("❌ Error:", stderr);
    console.log("ℹ️  Application will continue without ZKTeco integration");
  }
});

pythonProcess.on("error", (error) => {
  console.log("⚠️  Python not found or ZKTeco setup failed");
  console.log("❌ Error:", error.message);
  console.log("ℹ️  Please install Python and pyzk library:");
  console.log("   pip install pyzk==0.9.0");
});
