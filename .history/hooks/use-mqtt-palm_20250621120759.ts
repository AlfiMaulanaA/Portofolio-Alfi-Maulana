"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import mqtt, { type MqttClient } from "mqtt";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface MqttConfig {
  brokerAddress: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
}

interface PalmStatusMessage {
  status: "ok" | "failed";
  message: string;
}

interface PalmRegistrationState {
  isConnected: boolean;
  isConnecting: boolean;
  isRegistering: boolean;
  currentStep:
    | "idle"
    | "connecting"
    | "entering_mode"
    | "waiting_for_palm"
    | "processing"
    | "success"
    | "error";
  message: string;
  error: string | null;
  connectionAttempts: number;
}

export function useMqttPalm() {
  const [state, setState] = useState<PalmRegistrationState>({
    isConnected: false,
    isConnecting: false,
    isRegistering: false,
    currentStep: "idle",
    message: "",
    error: null,
    connectionAttempts: 0,
  });

  const clientRef = useRef<MqttClient | null>(null);
  const registrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get MQTT configuration from environment
  const getMqttConfig = useCallback((): MqttConfig => {
    const env = process.env.NEXT_PUBLIC_ENV || "dev";

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
      currentStep: "connecting",
      message: `Connecting to palm device at ${config.brokerAddress}:${config.port}...`,
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
        reconnectPeriod: 0, // Disable auto-reconnect, we'll handle it manually
        keepalive: 60,
        clientId: `palm_client_${Date.now()}`,
      });

      client.on("connect", () => {
        // Subscribe to palm status topic
        client.subscribe("palm/status", { qos: 1 }, (err) => {
          if (err) {
            console.error("❌ Failed to subscribe to palm/status:", err);
            setState((prev) => ({
              ...prev,
              currentStep: "error",
              error: "Failed to subscribe to palm device status",
              isConnected: false,
              isConnecting: false,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              currentStep: "idle",
              message: "Connected to palm device successfully",
              error: null,
              connectionAttempts: 0,
            }));

            // Show success notification
            MySwal.fire({
              title: "🎉 Palm Device Connected!",
              text: `Successfully connected to ${config.brokerAddress}:${config.port}`,
              icon: "success",
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
              customClass: {
                container: "swal2-container-high-z",
              },
            });
          }
        });
      });

      client.on("error", (error) => {
        console.error("❌ MQTT Connection error:", error);
        setState((prev) => ({
          ...prev,
          currentStep: "error",
          error: `Connection failed: ${error.message}`,
          isConnected: false,
          isConnecting: false,
        }));

        // Show error notification
        MySwal.fire({
          title: "🚫 Connection Failed",
          text: `Failed to connect to palm device: ${error.message}`,
          icon: "error",
          confirmButtonText: "Retry",
          customClass: {
            container: "swal2-container-high-z",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Retry connection after 2 seconds
            setTimeout(() => {
              connect();
            }, 2000);
          }
        });
      });

      client.on("close", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          currentStep: "idle",
          message: "Disconnected from palm device",
        }));

        // Auto-reconnect if not manually disconnected
        if (clientRef.current && !clientRef.current.disconnecting) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      });

      client.on("offline", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          message: "Palm device offline",
        }));
      });

      client.on("reconnect", () => {
        setState((prev) => ({
          ...prev,
          isConnecting: true,
          message: "Reconnecting to palm device...",
        }));
      });

      client.on("message", (topic, message) => {
        if (topic === "palm/status") {
          handlePalmStatusMessage(message.toString());
        }
      });

      clientRef.current = client;
      return true;
    } catch (error) {
      console.error("❌ MQTT Setup error:", error);
      setState((prev) => ({
        ...prev,
        currentStep: "error",
        error: `Setup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        isConnected: false,
        isConnecting: false,
      }));
      return false;
    }
  }, [getMqttConfig, state.isConnecting]);

  // Handle incoming palm status messages
  const handlePalmStatusMessage = useCallback((messageStr: string) => {
    try {
      const message: PalmStatusMessage = JSON.parse(messageStr);

      if (message.status === "ok") {
        if (message.message === "successfully set to regist mode") {
          MySwal.fire({
            title: "📋 Registration Mode Active",
            text: "Please place your palm on the scanner (IR and RGB)",
            icon: "info",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
              container: "swal2-container-high-z",
            },
          });

          setState((prev) => ({
            ...prev,
            currentStep: "waiting_for_palm",
            message: "Place your palm on the scanner (IR and RGB)",
            error: null,
          }));
        } else if (message.message === "user successfully registered") {
          MySwal.fire({
            title: "🎉 Registration Successful!",
            text: "Palm biometric data has been saved successfully",
            icon: "success",
            confirmButtonText: "Great!",
            customClass: {
              container: "swal2-container-high-z",
            },
          });

          setState((prev) => ({
            ...prev,
            currentStep: "success",
            message: "Palm registration completed successfully!",
            isRegistering: false,
            error: null,
          }));

          // Clear registration timeout
          if (registrationTimeoutRef.current) {
            clearTimeout(registrationTimeoutRef.current);
            registrationTimeoutRef.current = null;
          }
        }
      } else if (message.status === "failed") {
        console.error("❌ Registration failed:", message.message);
        let errorTitle = "Registration Failed";
        let errorText = message.message;

        if (message.message === "user already registered") {
          errorTitle = "👤 User Already Registered";
          errorText = "This user ID is already registered in the palm system";
        } else if (message.message === "'user_id' missing in regist command") {
          errorTitle = "⚠️ Invalid Command";
          errorText = "User ID is missing from the registration command";
        }

        MySwal.fire({
          title: errorTitle,
          text: errorText,
          icon: "error",
          confirmButtonText: "Try Again",
          customClass: {
            container: "swal2-container-high-z",
          },
        });

        setState((prev) => ({
          ...prev,
          currentStep: "error",
          error: message.message,
          isRegistering: false,
        }));

        // Clear registration timeout
        if (registrationTimeoutRef.current) {
          clearTimeout(registrationTimeoutRef.current);
          registrationTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error("❌ Failed to parse palm status message:", error);
      setState((prev) => ({
        ...prev,
        currentStep: "error",
        error: "Invalid response from palm device",
        isRegistering: false,
      }));
    }
  }, []);

  // Start palm registration process
  const startRegistration = useCallback(
    async (userName: string) => {
      if (!clientRef.current?.connected) {
        MySwal.fire({
          title: "🔌 Connection Required",
          text: "Please connect to the palm device first",
          icon: "warning",
          confirmButtonText: "Connect Now",
          customClass: {
            container: "swal2-container-high-z",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            connect();
          }
        });
        return false;
      }

      setState((prev) => ({
        ...prev,
        isRegistering: true,
        currentStep: "entering_mode",
        message: "Preparing palm scanner for registration...",
        error: null,
      }));

      try {
        const command = {
          command: "regist",
          user_id: userName,
        };

        clientRef.current!.publish(
          "palm/control",
          JSON.stringify(command),
          { qos: 1 },
          (error) => {
            if (error) {
              console.error("❌ Failed to send registration command:", error);
              setState((prev) => ({
                ...prev,
                currentStep: "error",
                error: "Failed to send command to palm device",
                isRegistering: false,
              }));

              MySwal.fire({
                title: "🚫 Command Failed",
                text: "Failed to send registration command to palm device",
                icon: "error",
                customClass: {
                  container: "swal2-container-high-z",
                },
              });
            } else {
              MySwal.fire({
                title: "📡 Command Sent",
                text: "Entering registration mode...",
                icon: "info",
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                  container: "swal2-container-high-z",
                },
                didOpen: () => {
                  Swal.showLoading();
                },
              });

              // Set timeout for registration process (60 seconds)
              registrationTimeoutRef.current = setTimeout(() => {
                setState((prev) => ({
                  ...prev,
                  currentStep: "error",
                  error: "Registration timeout - please try again",
                  isRegistering: false,
                }));

                MySwal.fire({
                  title: "⏰ Registration Timeout",
                  text: "Registration process timed out. Please try again.",
                  icon: "warning",
                  confirmButtonText: "OK",
                  customClass: {
                    container: "swal2-container-high-z",
                  },
                });
              }, 60000); // 60 seconds timeout
            }
          }
        );

        return true;
      } catch (error) {
        console.error("❌ Registration command error:", error);
        setState((prev) => ({
          ...prev,
          currentStep: "error",
          error: `Registration failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          isRegistering: false,
        }));
        return false;
      }
    },
    [connect]
  );

  // Cancel registration process
  const cancelRegistration = useCallback(() => {
    if (registrationTimeoutRef.current) {
      clearTimeout(registrationTimeoutRef.current);
      registrationTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRegistering: false,
      currentStep: "idle",
      message: "Registration cancelled",
      error: null,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (registrationTimeoutRef.current) {
      clearTimeout(registrationTimeoutRef.current);
      registrationTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRegistering: false,
      currentStep: "idle",
      message: "",
      error: null,
    }));
  }, []);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (registrationTimeoutRef.current) {
      clearTimeout(registrationTimeoutRef.current);
      registrationTimeoutRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      isRegistering: false,
      currentStep: "idle",
      message: "",
      error: null,
      connectionAttempts: 0,
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    console.log("🚀 Initializing MQTT Palm connection...");
    connect();

    return () => {
      console.log("🧹 Cleaning up MQTT Palm connection...");
      disconnect();
    };
  }, []); // Only run on mount

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
    startRegistration,
    cancelRegistration,
    reset,
  };
}
