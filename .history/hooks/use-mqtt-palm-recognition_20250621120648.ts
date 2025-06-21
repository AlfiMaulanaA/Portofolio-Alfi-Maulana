"use client";

import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import mqtt, { type MqttClient } from "mqtt";
import { NotificationToast } from "@/components/notification-toast";
import { createRoot } from "react-dom/client";

interface MqttConfig {
  brokerAddress: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
}

interface PalmRecognitionResult {
  user: string;
  score: number;
  timestamp: string;
}

interface TodayStats {
  palmScans: number;
  successfulPalmScans: number;
  faceScans: number;
  successfulFaceScans: number;
  totalScans: number;
  totalSuccessful: number;
}

interface PalmRecognitionState {
  isConnected: boolean;
  isConnecting: boolean;
  currentResult: PalmRecognitionResult | null;
  recentResults: PalmRecognitionResult[];
  error: string | null;
  connectionAttempts: number;
  todayScans: number;
  successfulScans: number;
  todayStats: TodayStats | null;
  statsLoading: boolean;
}

export function useMqttPalmRecognition() {
  const [state, setState] = useState<PalmRecognitionState>({
    isConnected: false,
    isConnecting: false,
    currentResult: null,
    recentResults: [],
    error: null,
    connectionAttempts: 0,
    todayScans: 0,
    successfulScans: 0,
    todayStats: null,
    statsLoading: true,
  });

  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show toast notification
  const showToastNotification = useCallback((result: PalmRecognitionResult) => {
    const toastContainer = document.createElement("div");
    document.body.appendChild(toastContainer);
    const root = createRoot(toastContainer);

    root.render(
      React.createElement(NotificationToast, {
        type: "palm",
        result: {
          name: result.user,
          success: result.score >= 0.8,
          score: result.score,
        },
        onClose: () => {
          root.unmount();
          document.body.removeChild(toastContainer);
        },
      })
    );
  }, []);

  // Fetch today's statistics from database
  const fetchTodayStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, statsLoading: true }));

      const response = await fetch("/api/history/today");
      const result = await response.json();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          todayStats: result.data,
          todayScans: result.data.palmScans,
          successfulScans: result.data.successfulPalmScans,
          statsLoading: false,
        }));
      } else {
        console.error("❌ Failed to fetch today's stats:", result.error);
        setState((prev) => ({ ...prev, statsLoading: false }));
      }
    } catch (error) {
      console.error("❌ Error fetching today's stats:", error);
      setState((prev) => ({ ...prev, statsLoading: false }));
    }
  }, []);

  // Get MQTT configuration from environment
  const getMqttConfig = useCallback((): MqttConfig => {
    return {
      brokerAddress:
        process.env.NEXT_PUBLIC_MQTT_BROKER_ADDRESS || "192.168.0.138",
      port: Number.parseInt(process.env.NEXT_PUBLIC_MQTT_BROKER_PORT || "9000"),
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "test",
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "test",
      ssl: process.env.NEXT_PUBLIC_MQTT_BROKER_SSL === "true",
    };
  }, []);

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

      const client = mqtt.connect(brokerUrl, {
        username: config.username,
        password: config.password,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 0,
        keepalive: 60,
        clientId: `palm_recognition_${Date.now()}`,
      });

      client.on("connect", () => {
        client.subscribe("palm/compare/result", { qos: 1 }, (err) => {
          if (err) {
            console.error(
              "❌ Failed to subscribe to palm/compare/result:",
              err
            );
            setState((prev) => ({
              ...prev,
              error: "Failed to subscribe to palm recognition results",
              isConnected: false,
              isConnecting: false,
            }));
          } else {
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
        console.error("❌ MQTT Connection error:", error);
        setState((prev) => ({
          ...prev,
          error: `Connection failed: ${error.message}`,
          isConnected: false,
          isConnecting: false,
        }));
      });

      client.on("close", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        if (clientRef.current && !clientRef.current.disconnecting) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      });

      client.on("message", (topic, message) => {
        if (topic === "palm/compare/result") {
          handlePalmRecognitionResult(message.toString());
        }
      });

      clientRef.current = client;
      return true;
    } catch (error) {
      console.error("❌ MQTT Setup error:", error);
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

  // Handle incoming palm recognition results
  const handlePalmRecognitionResult = useCallback(
    async (messageStr: string) => {
      try {
        const result: PalmRecognitionResult = JSON.parse(messageStr);

        // Update state with new result
        setState((prev) => ({
          ...prev,
          currentResult: result,
          recentResults: [result, ...prev.recentResults.slice(0, 9)],
          todayScans: prev.todayScans + 1,
          successfulScans:
            result.score >= 0.8
              ? prev.successfulScans + 1
              : prev.successfulScans,
        }));

        // Show toast notification
        showToastNotification(result);

        // Create history log in database
        try {
          const confidence = Math.round(result.score * 100);
          const isSuccess = result.score >= 0.8;

          await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_name: result.user,
              recognition_type: "palm",
              result: isSuccess ? "success" : "failed",
              confidence: confidence,
              location: "Main Entrance",
              device_id: "palm_scanner_001",
            }),
          });
        } catch (error) {
          console.error("❌ Failed to create history log:", error);
        }

        // Clear current result after 5 seconds
        setTimeout(() => {
          setState((prev) => ({ ...prev, currentResult: null }));
        }, 5000);
      } catch (error) {
        console.error("❌ Failed to parse palm recognition result:", error);
      }
    },
    [showToastNotification]
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
      currentResult: null,
      error: null,
      connectionAttempts: 0,
    }));
  }, []);

  // Auto-connect and fetch stats on mount
  useEffect(() => {
    fetchTodayStats();
    connect();

    return () => {
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
    fetchTodayStats,
  };
}
