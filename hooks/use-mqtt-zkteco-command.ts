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

interface ZKTecoCommandState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  currentMode: string | null;
  currentStatus: string | null;
  lastResponse: any;
}

interface CommandResponse {
  Mode: string;
  Status: string;
  Data: any;
}

export function useMqttZKTecoCommand() {
  const [state, setState] = useState<ZKTecoCommandState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    currentMode: null,
    currentStatus: null,
    lastResponse: null,
  });

  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commandCallbackRef = useRef<
    ((response: CommandResponse) => void) | null
  >(null);

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
        clientId: `zkteco_command_${Date.now()}`,
      });

      client.on("connect", () => {
        // Subscribe to status topics
        const topics = ["acs_front_status", "acs_rear_status"];

        topics.forEach((topic) => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`📡 Subscribed to ${topic} topic`);
            }
          });
        });

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      });

      client.on("error", (error) => {
        console.error("❌ ZKTeco Command MQTT Connection error:", error);
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

        // Auto-reconnect
        if (clientRef.current && !clientRef.current.disconnecting) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      });

      client.on("message", (topic, message) => {
        handleStatusMessage(topic, message.toString());
      });

      clientRef.current = client;
      return true;
    } catch (error) {
      console.error("❌ ZKTeco Command MQTT Setup error:", error);
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

  // Handle incoming status messages
  const handleStatusMessage = useCallback(
    (topic: string, messageStr: string) => {
      try {
        const response: CommandResponse = JSON.parse(messageStr);

        setState((prev) => ({
          ...prev,
          currentMode: response.Mode,
          currentStatus: response.Status,
          lastResponse: response,
        }));

        // Call the callback if set
        if (commandCallbackRef.current) {
          commandCallbackRef.current(response);
        }

        // Handle specific status updates
        handleStatusUpdate(response, topic);
      } catch (error) {
        console.error("❌ Failed to parse ZKTeco status message:", error);
      }
    },
    []
  );

  // Handle status updates with user notifications
  const handleStatusUpdate = useCallback(
    (response: CommandResponse, topic: string) => {
      const device = topic.includes("front") ? "Front" : "Rear";

      switch (response.Status) {
        case "progress change mode to register fp":
          Swal.fire({
            title: "Fingerprint Registration",
            text: `${device} device is preparing for fingerprint enrollment. Please wait...`,
            icon: "info",
            timer: 3000,
            showConfirmButton: false,
          });
          break;

        case "enrolling":
          Swal.fire({
            title: "Ready for Fingerprint",
            text: `${device} device is ready. Please place your finger on the scanner.`,
            icon: "info",
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          break;

        case "progress change mode to register card":
          Swal.fire({
            title: "Card Registration",
            text: `${device} device is preparing for card registration. Please wait...`,
            icon: "info",
            timer: 3000,
            showConfirmButton: false,
          });
          break;

        case "success":
          if (response.Mode === "register_fp" && response.Data) {
            Swal.fire({
              title: "Fingerprint Registered!",
              html: `
              <div class="text-left">
                <p><strong>Device:</strong> ${device}</p>
                <p><strong>User ID:</strong> ${response.Data.uid}</p>
                <p><strong>Finger ID:</strong> ${response.Data.fid}</p>
                <p><strong>Template Size:</strong> ${response.Data.size} bytes</p>
              </div>
            `,
              icon: "success",
              timer: 5000,
            });
          } else if (response.Mode === "register_card" && response.Data) {
            Swal.fire({
              title: "Card Registered!",
              html: `
              <div class="text-left">
                <p><strong>Device:</strong> ${device}</p>
                <p><strong>User ID:</strong> ${response.Data.uid}</p>
                <p><strong>Card Number:</strong> ${response.Data.card}</p>
              </div>
            `,
              icon: "success",
              timer: 5000,
            });
          }
          break;

        case "failed card not register in selected user":
          Swal.fire({
            title: "Card Registration Failed",
            text: `Failed to register card on ${device} device. Please try again.`,
            icon: "error",
          });
          break;

        case "failed card not register in selected user":
          Swal.fire({
            title: "Card Deletion Failed",
            text: `Failed to delete card on ${device} device. Card may not be registered.`,
            icon: "error",
          });
          break;
      }
    },
    []
  );

  // Send command to ZKTeco device
  const sendCommand = useCallback(
    (command: string, callback?: (response: CommandResponse) => void) => {
      if (!clientRef.current?.connected) {
        console.warn("⚠️ MQTT not connected, cannot send command");
        Swal.fire({
          title: "Connection Error",
          text: "MQTT connection not available. Please check connection.",
          icon: "error",
        });
        return false;
      }

      // Set callback for this command
      commandCallbackRef.current = callback || null;

      try {
        // Send to both front and rear devices
        clientRef.current.publish("acs_front_command", command, { qos: 1 });
        clientRef.current.publish("acs_rear_command", command, { qos: 1 });

        return true;
      } catch (error) {
        console.error("❌ Failed to send ZKTeco command:", error);
        Swal.fire({
          title: "Command Error",
          text: "Failed to send command to device.",
          icon: "error",
        });
        return false;
      }
    },
    []
  );

  // Register fingerprint
  const registerFingerprint = useCallback(
    (uid: number, fingerId = 1) => {
      const command = `mode;register_fp;${uid};${fingerId}`;

      return sendCommand(command, (response) => {
        if (response.Status === "success" && response.Mode === "register_fp") {
          // Update database to mark fingerprint as registered
          fetch("/api/users/update-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: uid,
              type: "fingerprint",
              registered: true,
            }),
          }).catch(console.error);
        }
      });
    },
    [sendCommand]
  );

  // Delete fingerprint
  const deleteFingerprint = useCallback(
    (uid: number, fingerId = 1) => {
      const command = `mode;delete_fp;${uid};${fingerId}`;

      return sendCommand(command, (response) => {
        if (response.Status === "success" && response.Mode === "delete_fp") {
          // Update database to mark fingerprint as not registered
          fetch("/api/users/update-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: uid,
              type: "fingerprint",
              registered: false,
            }),
          }).catch(console.error);
        }
      });
    },
    [sendCommand]
  );

  // Register card
  const registerCard = useCallback(
    (uid: number) => {
      const command = `mode;register_card;${uid}`;

      return sendCommand(command, (response) => {
        if (
          response.Status === "success" &&
          response.Mode === "register_card"
        ) {
          // Update database to mark card as registered
          fetch("/api/users/update-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: uid,
              type: "card",
              registered: true,
              cardNumber: response.Data?.card,
            }),
          }).catch(console.error);
        }
      });
    },
    [sendCommand]
  );

  // Delete card
  const deleteCard = useCallback(
    (uid: number) => {
      const command = `mode;delete_card;${uid}`;

      return sendCommand(command, (response) => {
        if (response.Status === "success" && response.Mode === "delete_card") {
          // Update database to mark card as not registered
          fetch("/api/users/update-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: uid,
              type: "card",
              registered: false,
            }),
          }).catch(console.error);
        }
      });
    },
    [sendCommand]
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
      currentMode: null,
      currentStatus: null,
      lastResponse: null,
    }));

    commandCallbackRef.current = null;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    sendCommand,
    registerFingerprint,
    deleteFingerprint,
    registerCard,
    deleteCard,
  };
}
