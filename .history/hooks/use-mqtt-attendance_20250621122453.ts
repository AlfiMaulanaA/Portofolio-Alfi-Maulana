"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import mqtt, { type MqttClient } from "mqtt";
import Swal from "sweetalert2";

interface MqttConfig {
  brokerAddress: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
}

interface AttendanceData {
  UID: string;
  timestamp: string;
  type: number;
}

interface AttendancePayload {
  Mode: string;
  Status: string;
  Data: AttendanceData | string;
}

interface AttendanceState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionAttempts: number;
}

export function useMqttAttendance() {
  const [state, setState] = useState<AttendanceState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionAttempts: 0,
  });

  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get attendance type name
  const getAttendanceType = (
    type: number
  ): { name: string; icon: string; color: string } => {
    switch (type) {
      case 1:
        return { name: "Fingerprint", icon: "🔍", color: "#10b981" };
      case 2:
        return { name: "Palm Recognition", icon: "🖐️", color: "#8b5cf6" };
      case 3:
        return { name: "User Password", icon: "🔐", color: "#3b82f6" };
      case 4:
        return { name: "Card", icon: "💳", color: "#8b5cf6" };
      case 5:
        return { name: "Face Recognition", icon: "👤", color: "#ef4444" };
      default:
        return { name: "Unknown", icon: "❓", color: "#6b7280" };
    }
  };

  // Show toast notification for attendance
  const showAttendanceNotification = useCallback(
    (payload: AttendancePayload) => {
      if (payload.Status !== "check_in" || typeof payload.Data === "string") {
        return; // Only show notifications for successful check_in
      }

      const data = payload.Data as AttendanceData;
      const attendanceType = getAttendanceType(data.type);

      // Fix timestamp formatting - handle both with and without space after "timestamp"
      const timestamp =
        data.timestamp || data["timestamp "] || new Date().toLocaleString();

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      Toast.fire({
        icon: "success",
        title: `${attendanceType.icon} Attendance Check-In`,
        html: `
        <div class="text-left">
          <p class="font-semibold text-green-700">User ID: ${data.UID}</p>
          <p class="text-sm text-gray-600">Method: ${attendanceType.name}</p>
          <p class="text-sm text-gray-600">Time: ${timestamp}</p>
          <p class="text-xs text-gray-500">Mode: ${payload.Mode}</p>
        </div>
      `,
        background: "#f0fdf4",
        color: "#166534",
        customClass: {
          popup: "attendance-toast",
        },
      });
    },
    []
  );

  // Get MQTT configuration
  const getMqttConfig = useCallback((): MqttConfig => {
    return {
      brokerAddress: "192.168.1.86",
      port: Number.parseInt(process.env.NEXT_PUBLIC_MQTT_BROKER_PORT || "1883"),
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "",
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "",
      ssl: process.env.NEXT_PUBLIC_MQTT_BROKER_SSL === "true",
    };
  }, []);

  // Publish attendance message
  const publishAttendance = useCallback(
    (userId: string, type: number, userName?: string) => {
      if (!clientRef.current?.connected) {
        console.warn("⚠️ MQTT not connected, cannot publish attendance");
        return false;
      }

      const timestamp = new Date()
        .toLocaleString("sv-SE")
        .replace("T", " ")
        .substring(0, 19);

      const payload: AttendancePayload = {
        Mode: "scan",
        Status: "check_in",
        Data: {
          UID: userId,
          timestamp: timestamp,
          type: type,
        },
      };

      try {
        clientRef.current.publish(
          "acs_front_attendance",
          JSON.stringify(payload),
          { qos: 1 }
        );
        console.log(
          `✅ Published attendance for User ${userId} (Type: ${type})`
        );
        return true;
      } catch (error) {
        console.error("❌ Failed to publish attendance:", error);
        return false;
      }
    },
    []
  );

  // Connect to MQTT broker
  const connect = useCallback(async () => {
    if (clientRef.current?.connected) {
      return true;
    }

    if (state.isConnecting) {
      return false;
    }

    const config = getMqttConfig();

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    try {
      const protocol = config.ssl ? "wss" : "ws";
      const brokerUrl = `${protocol}://${config.brokerAddress}:${config.port}`;

      console.log(`🔌 Connecting to Attendance MQTT broker: ${brokerUrl}`);

      const client = mqtt.connect(brokerUrl, {
        username: config.username,
        password: config.password,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 0,
        keepalive: 60,
        clientId: `attendance_${Date.now()}`,
      });

      client.on("connect", () => {
        console.log("✅ MQTT Connected for attendance system");

        // Subscribe to attendance topic
        client.subscribe("acs_front_attendance", { qos: 1 }, (err) => {
          if (err) {
            console.error(
              "❌ Failed to subscribe to acs_front_attendance:",
              err
            );
            setState((prev) => ({
              ...prev,
              error: "Failed to subscribe to attendance topic",
              isConnected: false,
              isConnecting: false,
            }));
          } else {
            console.log("📡 Subscribed to acs_front_attendance topic");
            setState((prev) => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              error: null,
              connectionAttempts: 0,
            }));
          }
        });
      });

      client.on("error", (error) => {
        console.error("❌ Attendance MQTT Connection error:", error);
        setState((prev) => ({
          ...prev,
          error: `Connection failed: ${error.message}`,
          isConnected: false,
          isConnecting: false,
        }));
      });

      client.on("close", () => {
        console.log("🔌 Attendance MQTT Connection closed");
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // Auto-reconnect
        if (clientRef.current && !clientRef.current.disconnecting) {
          console.log("🔄 Attempting to reconnect attendance in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      });

      client.on("message", (topic, message) => {
        if (topic === "acs_front_attendance") {
          handleAttendanceMessage(message.toString());
        }
      });

      clientRef.current = client;
      return true;
    } catch (error) {
      console.error("❌ Attendance MQTT Setup error:", error);
      setState((prev) => ({
        ...prev,
        error: `Setup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        isConnected: false,
        isConnecting: false,
      }));
      return false;
    }
  }, [getMqttConfig, state.isConnecting]);

  // Handle incoming attendance messages
  const handleAttendanceMessage = useCallback(
    async (messageStr: string) => {
      try {
        const payload: AttendancePayload = JSON.parse(messageStr);
        console.log("📊 Attendance message received:", payload);

        // Show toast notification for check_in only
        if (payload.Status === "check_in" && typeof payload.Data !== "string") {
          showAttendanceNotification(payload);

          // Create history log in database
          try {
            const data = payload.Data as AttendanceData;
            const attendanceType = getAttendanceType(data.type);
            const timestamp =
              data.timestamp || data["timestamp "] || new Date().toISOString();

            await fetch("/api/history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: data.UID,
                user_name: `User ${data.UID}`,
                recognition_type: "attendance",
                result: "success",
                confidence: 100,
                location: "Front Door",
                device_id: "acs_front_001",
                additional_data: {
                  method: attendanceType.name,
                  mode: payload.Mode,
                  timestamp: timestamp,
                },
              }),
            });

            console.log("✅ Attendance history log created");
          } catch (error) {
            console.error("❌ Failed to create attendance history log:", error);
          }
        }
      } catch (error) {
        console.error("❌ Failed to parse attendance message:", error);
      }
    },
    [showAttendanceNotification]
  );

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      connectionAttempts: 0,
    }));

    console.log("🔌 Disconnected from Attendance MQTT broker");
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    console.log("🚀 Initializing Attendance MQTT connection...");
    connect();

    return () => {
      console.log("🧹 Cleaning up Attendance MQTT connection...");
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    publishAttendance,
  };
}
