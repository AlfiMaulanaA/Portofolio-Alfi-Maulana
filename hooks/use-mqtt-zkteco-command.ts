"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";

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

  const eventSourceRef = useRef<EventSource | null>(null);
  const commandCallbackRef = useRef<
    ((response: CommandResponse) => void) | null
  >(null);

  // Connect to Server-Sent Events for real-time updates
  const connect = useCallback(async () => {
    if (eventSourceRef.current) {
      return true;
    }

    if (state.isConnecting) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const statusResponse = await fetch(
        "/api/mqtt/zkteco-command?action=status"
      );
      const statusData = await statusResponse.json();

      // Start Server-Sent Events connection
      const eventSource = new EventSource("/api/mqtt/zkteco-command");

      eventSource.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (error) {
          console.error("❌ Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("❌ SSE Connection error:", error);
        setState((prev) => ({
          ...prev,
          error: "Connection failed",
          isConnected: false,
          isConnecting: false,
        }));

        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (!eventSourceRef.current) {
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
      return true;
    } catch (error) {
      console.error("❌ ZKTeco Command API Setup error:", error);
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
  }, [state.isConnecting]);

  // Handle incoming server messages
  const handleServerMessage = useCallback((message: any) => {
    if (message.type === "connection") {
      setState((prev) => ({
        ...prev,
        isConnected: message.data.connected,
        error: message.data.error,
      }));
    } else if (message.type === "status" && message.data) {
      const response: CommandResponse = message.data;

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
      handleStatusUpdate(response, message.topic);
    }
  }, []);

  // Handle status updates with user notifications
  const handleStatusUpdate = useCallback(
    (response: CommandResponse, topic: string) => {
      const device = topic?.includes("front") ? "Front" : "Rear";

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

        case "progress change mode to delete fp":
          Swal.fire({
            title: "Fingerprint Deletion",
            text: `${device} device is preparing to delete fingerprint. Please wait...`,
            icon: "info",
            timer: 3000,
            showConfirmButton: false,
          });
          break;

        case "progress change mode to delete user":
          Swal.fire({
            title: "User Deletion",
            text: `${device} device is preparing to delete user. Please wait...`,
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

        case "progress change mode to delete card":
          Swal.fire({
            title: "Card Deletion",
            text: `${device} device is preparing to delete card. Please wait...`,
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
          } else if (response.Mode === "delete_fp" && response.Data) {
            Swal.fire({
              title: "Fingerprint Deleted!",
              html: `
              <div class="text-left">
                <p><strong>Device:</strong> ${device}</p>
                <p><strong>User ID:</strong> ${response.Data.uid}</p>
                <p><strong>Finger ID:</strong> ${response.Data.fid}</p>
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
          } else if (response.Mode === "delete_card" && response.Data) {
            Swal.fire({
              title: "Card Deleted!",
              html: `
              <div class="text-left">
                <p><strong>Device:</strong> ${device}</p>
                <p><strong>User ID:</strong> ${response.Data.uid}</p>
              </div>
            `,
              icon: "success",
              timer: 5000,
            });
          } else if (response.Mode === "delete_user" && response.Data) {
            Swal.fire({
              title: "User Deleted from ZKTeco!",
              html: `
              <div class="text-left">
                <p><strong>Device:</strong> ${device}</p>
                <p><strong>User ID:</strong> ${response.Data.UID}</p>
                <p><strong>User Name:</strong> ${response.Data.user_name}</p>
              </div>
            `,
              icon: "success",
              timer: 5000,
            });
          }
          break;

        case "uid not found":
          if (response.Mode === "delete_user") {
            Swal.fire({
              title: "User Not Found",
              text: `User not found on ${device} device. May have been already deleted.`,
              icon: "warning",
              timer: 3000,
            });
          }
          break;

        case "failed card not register in selected user":
          if (response.Mode === "delete_card") {
            Swal.fire({
              title: "Card Deletion Failed",
              text: `No card found for this user on ${device} device.`,
              icon: "warning",
            });
          } else {
            Swal.fire({
              title: "Card Registration Failed",
              text: `Failed to register card on ${device} device. Please try again.`,
              icon: "error",
            });
          }
          break;
      }
    },
    []
  );

  // Send command to ZKTeco device via API
  const sendCommand = useCallback(
    async (command: string, callback?: (response: CommandResponse) => void) => {
      if (!state.isConnected) {
        console.warn("⚠️ Server not connected, cannot send command");
        Swal.fire({
          title: "Connection Error",
          text: "Server connection not available. Please check connection.",
          icon: "error",
        });
        return false;
      }

      // Set callback for this command
      commandCallbackRef.current = callback || null;

      try {
        const response = await fetch("/api/mqtt/zkteco-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to send command");
        }

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
    [state.isConnected]
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

  // Delete user from ZKTeco device
  const deleteZKTecoUser = useCallback(
    (uid: number) => {
      const command = `mode;delete_user;${uid}`;

      return sendCommand(command, (response) => {
        if (response.Status === "success" && response.Mode === "delete_user") {
          console.log(`✅ User deleted from ZKTeco device: UID ${uid}`);
          // Database will be updated by the main delete user API
        } else if (
          response.Status === "uid not found" &&
          response.Mode === "delete_user"
        ) {
          console.log(`⚠️ User UID ${uid} not found on ZKTeco device`);
          // This is not necessarily an error - user might have been deleted already
        }
      });
    },
    [sendCommand]
  );

  // Delete palm
  const deletePalm = useCallback(async (userId: string) => {
    try {
      const response = await fetch("/api/palm/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "delete",
          user_id: userId,
        }),
      });

      const result = await response.json();

      if (result.status === "ok") {
        Swal.fire({
          title: "Palm Deleted!",
          text: `Palm data has been deleted for user ${userId}`,
          icon: "success",
          timer: 3000,
        });

        // Update database to mark palm as not registered
        fetch("/api/users/update-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            type: "palm",
            registered: false,
          }),
        }).catch(console.error);

        return true;
      } else {
        throw new Error(result.message || "Failed to delete palm");
      }
    } catch (error) {
      console.error("❌ Failed to delete palm:", error);
      Swal.fire({
        title: "Palm Deletion Failed",
        text: error instanceof Error ? error.message : "Unknown error occurred",
        icon: "error",
      });
      return false;
    }
  }, []);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
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
    console.log("🚀 Initializing ZKTeco Command API connection...");
    connect();

    return () => {
      console.log("🧹 Cleaning up ZKTeco Command API connection...");
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
    deletePalm,
    deleteZKTecoUser,
  };
}
