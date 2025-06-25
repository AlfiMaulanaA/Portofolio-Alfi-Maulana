import { type NextRequest, NextResponse } from "next/server";
import mqtt, { type MqttClient } from "mqtt";

// Global MQTT client untuk persistent connection
let mqttClient: MqttClient | null = null;
let isConnecting = false;
let connectionStatus = {
  connected: false,
  error: null as string | null,
  lastConnected: null as Date | null,
};

// Status listeners untuk real-time updates
const statusListeners = new Set<(data: any) => void>();

// Connect to WebSocket MQTT broker
async function connectMqtt(): Promise<MqttClient> {
  if (mqttClient?.connected) {
    return mqttClient;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        if (mqttClient?.connected) {
          resolve(mqttClient);
        } else if (!isConnecting) {
          reject(new Error("Connection failed"));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  isConnecting = true;

  try {
    const brokerHost = process.env.MQTT_ZKTECO_BROKER_HOST || "192.168.1.86";
    const brokerPort = Number.parseInt(
      process.env.MQTT_ZKTECO_BROKER_PORT || "9001"
    );
    const username = process.env.MQTT_ZKTECO_USERNAME || "";
    const password = process.env.MQTT_ZKTECO_PASSWORD || "";

    // Use WebSocket protocol for server-side connection
    const brokerUrl = `ws://${brokerHost}:${brokerPort}/mqtt`;

    const client = mqtt.connect(brokerUrl, {
      username: username || undefined,
      password: password || undefined,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
      keepalive: 60,
      clientId: `zkteco_server_${Date.now()}`,
      protocol: "ws", // Use WebSocket protocol
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
        isConnecting = false;
      }, 15000);

      client.on("connect", () => {
        clearTimeout(timeout);

        // Subscribe to status topics
        const topics = ["acs_front_status", "acs_rear_status"];
        topics.forEach((topic) => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`📡 Subscribed to ${topic}`);
            }
          });
        });

        connectionStatus = {
          connected: true,
          error: null,
          lastConnected: new Date(),
        };

        mqttClient = client;
        isConnecting = false;
        resolve(client);
      });

      client.on("error", (error) => {
        clearTimeout(timeout);
        console.error("❌ WebSocket MQTT Connection error:", error);
        connectionStatus = {
          connected: false,
          error: error.message,
          lastConnected: null,
        };
        isConnecting = false;
        reject(error);
      });

      client.on("close", () => {
        connectionStatus.connected = false;
        mqttClient = null;
      });

      client.on("message", (topic, message) => {
        try {
          const data = JSON.parse(message.toString());

          // Broadcast to all listeners
          const statusUpdate = {
            topic,
            data,
            timestamp: new Date().toISOString(),
          };

          statusListeners.forEach((listener) => {
            try {
              listener(statusUpdate);
            } catch (error) {
              console.error("Error in status listener:", error);
            }
          });
        } catch (error) {
          console.error("Failed to parse MQTT message:", error);
        }
      });
    });
  } catch (error) {
    isConnecting = false;
    throw error;
  }
}

// POST - Send command
export async function POST(request: NextRequest) {
  try {
    const { command, timeout = 30000 } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    const client = await connectMqtt();

    // Send command to both devices
    const commandPromises = [
      new Promise<void>((resolve, reject) => {
        client.publish("acs_front_command", command, { qos: 1 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
      new Promise<void>((resolve, reject) => {
        client.publish("acs_rear_command", command, { qos: 1 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
    ];

    await Promise.all(commandPromises);

    return NextResponse.json({
      success: true,
      message: "Command sent successfully",
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error sending ZKTeco command:", error);
    return NextResponse.json(
      {
        error: "Failed to send command",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Server-Sent Events for real-time status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "status") {
    // Return current connection status
    return NextResponse.json({
      ...connectionStatus,
      clientConnected: mqttClient?.connected || false,
    });
  }

  // Server-Sent Events for real-time updates
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection status
      const initialData = {
        type: "connection",
        data: connectionStatus,
        timestamp: new Date().toISOString(),
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      );

      // Add listener for status updates
      const listener = (statusUpdate: any) => {
        try {
          const sseData = {
            type: "status",
            ...statusUpdate,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`)
          );
        } catch (error) {
          console.error("Error sending SSE data:", error);
        }
      };

      statusListeners.add(listener);

      // Cleanup on close
      const cleanup = () => {
        statusListeners.delete(listener);
      };

      // Handle client disconnect
      request.signal.addEventListener("abort", cleanup);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: {"type":"ping","timestamp":"${new Date().toISOString()}"}\n\n`
            )
          );
        } catch (error) {
          clearInterval(keepAlive);
          cleanup();
        }
      }, 30000);

      // Cleanup interval on close
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(keepAlive);
        cleanup();
        originalClose();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Initialize connection on module load
connectMqtt().catch((error) => {
  console.error("Failed to initialize MQTT connection:", error);
});
