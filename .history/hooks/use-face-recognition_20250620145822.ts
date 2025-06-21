"use client";

import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaceRecognitionService } from "@/services/face-recognition.service";
import { useMqttFaceRecognition } from "@/hooks/use-mqtt-face-recognition";
import { NotificationToast } from "@/components/notification-toast";
import { createRoot } from "react-dom/client";

interface FaceRecognitionResult {
  authorized: boolean;
  distance: number;
  name: string;
  person_id: number | null;
  success: boolean;
  timestamp: Date;
}

interface FaceRecognitionState {
  isActive: boolean;
  isProcessing: boolean;
  currentResult: FaceRecognitionResult | null;
  verificationLog: FaceRecognitionResult[];
  error: string | null;
  streamUrl: string;
  streamStatus: "loading" | "ready" | "error" | "unavailable" | "stopped";
  isStreamConnected: boolean;
  isStreamStarted: boolean;
  countdown: number;
  isCountingDown: boolean;
}

export function useFaceRecognition() {
  const { state: mqttState, handleFaceRecognitionResult } =
    useMqttFaceRecognition();

  const [state, setState] = useState<FaceRecognitionState>({
    isActive: false,
    isProcessing: false,
    currentResult: null,
    verificationLog: [],
    error: null,
    streamUrl: "/api/mjpeg",
    streamStatus: "stopped",
    isStreamConnected: false,
    isStreamStarted: false,
    countdown: 0,
    isCountingDown: false,
  });

  const faceService = useRef(FaceRecognitionService.getInstance());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Show toast notification
  const showToastNotification = useCallback((result: FaceRecognitionResult) => {
    const toastContainer = document.createElement("div");
    document.body.appendChild(toastContainer);
    const root = createRoot(toastContainer);

    root.render(
      React.createElement(NotificationToast, {
        type: "face",
        result: {
          name: result.name,
          success: result.success,
          authorized: result.authorized,
          distance: result.distance,
        },
        onClose: () => {
          root.unmount();
          document.body.removeChild(toastContainer);
        },
      })
    );
  }, []);

  // Start MJPEG stream
  const startStream = useCallback(async () => {
    console.log("🎬 Starting MJPEG stream...");

    streamControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      streamStatus: "loading",
      isStreamStarted: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/mjpeg", {
        method: "HEAD",
        signal: streamControllerRef.current.signal,
      });

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isStreamConnected: true,
          streamStatus: "ready",
        }));
        console.log("✅ MJPEG stream started successfully");
        return true;
      } else {
        throw new Error("Stream not available");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🛑 Stream start aborted");
        return false;
      }

      setState((prev) => ({
        ...prev,
        isStreamConnected: false,
        streamStatus: "error",
        error: "Failed to start MJPEG stream",
      }));
      console.error("❌ Failed to start MJPEG stream:", error);
      return false;
    }
  }, []);

  // Stop MJPEG stream
  const stopStream = useCallback(() => {
    console.log("🛑 Stopping MJPEG stream...");

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      streamStatus: "stopped",
      isStreamConnected: false,
      isStreamStarted: false,
      currentResult: null,
      error: null,
      isActive: false,
      isProcessing: false,
      isCountingDown: false,
      countdown: 0,
    }));

    if (imgRef.current) {
      imgRef.current.src = "/placeholder.svg?height=480&width=640";
      imgRef.current.onload = null;
      imgRef.current.onerror = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    console.log("✅ MJPEG stream stopped completely");
  }, []);

  // Start countdown for verification
  const startCountdown = useCallback(() => {
    if (state.isCountingDown || state.isProcessing) return;

    setState((prev) => ({
      ...prev,
      isCountingDown: true,
      countdown: 6,
      error: null,
    }));

    console.log("⏰ Starting 6-second countdown...");

    countdownIntervalRef.current = setInterval(() => {
      setState((prev) => {
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return {
            ...prev,
            countdown: 0,
            isCountingDown: false,
          };
        }

        return {
          ...prev,
          countdown: newCountdown,
        };
      });
    }, 1000);

    setTimeout(() => {
      performVerification();
    }, 6000);
  }, [state.isCountingDown, state.isProcessing]);

  // Perform face verification
  const performVerification = useCallback(async () => {
    if (state.isProcessing) return;

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));
    console.log("🔍 Starting face verification...");

    try {
      const imageBase64 = await faceService.current.captureFrameFromRTSP();

      const response = await fetch("https://face.iotech.my.id/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📊 Verification result:", result);

      let recognitionResult: FaceRecognitionResult;

      if (result.hasOwnProperty("authorized") && result.success === true) {
        recognitionResult = {
          authorized: result.authorized,
          distance: result.distance || 0,
          name: result.name || "Unknown",
          person_id: result.person_id,
          success: result.success,
          timestamp: new Date(),
        };
      } else if (
        result.error === "No face detected" &&
        result.success === false
      ) {
        recognitionResult = {
          authorized: false,
          distance: 1.0,
          name: "No Face Detected",
          person_id: null,
          success: false,
          timestamp: new Date(),
        };
      } else if (
        result.hasOwnProperty("distance") &&
        result.success === false &&
        result.person_id === null
      ) {
        recognitionResult = {
          authorized: false,
          distance: result.distance,
          name: "Unknown Person",
          person_id: null,
          success: false,
          timestamp: new Date(),
        };
      } else if (
        result.hasOwnProperty("authorized") &&
        result.success === false
      ) {
        recognitionResult = {
          authorized: false,
          distance: result.distance || 1.0,
          name: result.name || "Unknown",
          person_id: result.person_id,
          success: false,
          timestamp: new Date(),
        };
      } else {
        throw new Error("Invalid response format from verification API");
      }

      setState((prev) => ({
        ...prev,
        currentResult: recognitionResult,
        verificationLog: [
          recognitionResult,
          ...prev.verificationLog.slice(0, 9),
        ],
        isProcessing: false,
      }));

      // Send to MQTT face recognition handler for database logging
      await handleFaceRecognitionResult(recognitionResult);

      // Show toast notification
      showToastNotification(recognitionResult);

      // Clear result after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, currentResult: null }));
      }, 5000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
      }));

      console.error("❌ Face verification error:", error);
    }
  }, [state.isProcessing, handleFaceRecognitionResult, showToastNotification]);

  // Start face recognition system
  const startRecognition = useCallback(async () => {
    if (!state.isStreamStarted || !state.isStreamConnected) {
      console.log("⚠️ Cannot start recognition: stream not ready");
      return;
    }

    setState((prev) => ({
      ...prev,
      isActive: true,
      error: null,
    }));

    console.log("✅ Face recognition system started");
  }, [state.isStreamStarted, state.isStreamConnected]);

  // Stop face recognition system
  const stopRecognition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      isProcessing: false,
      currentResult: null,
      isCountingDown: false,
      countdown: 0,
    }));

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    console.log("🛑 Face recognition system stopped");
  }, []);

  // Manual verification trigger with countdown
  const triggerVerification = useCallback(() => {
    if (!state.isActive) {
      return;
    }

    if (state.isCountingDown || state.isProcessing) {
      return;
    }

    startCountdown();
  }, [
    state.isActive,
    state.isCountingDown,
    state.isProcessing,
    startCountdown,
  ]);

  // Reset system
  const resetSystem = useCallback(() => {
    stopRecognition();
    setState((prev) => ({
      ...prev,
      verificationLog: [],
      currentResult: null,
      error: null,
    }));
  }, [stopRecognition]);

  // Force stop everything
  const forceStop = useCallback(() => {
    console.log("🔴 Force stopping all face recognition processes...");

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }

    setState({
      isActive: false,
      isProcessing: false,
      currentResult: null,
      verificationLog: [],
      error: null,
      streamUrl: "/api/mjpeg",
      streamStatus: "stopped",
      isStreamConnected: false,
      isStreamStarted: false,
      countdown: 0,
      isCountingDown: false,
    });

    if (imgRef.current) {
      imgRef.current.src = "/placeholder.svg?height=480&width=640";
      imgRef.current.onload = null;
      imgRef.current.onerror = null;
    }

    console.log("✅ All face recognition processes force stopped");
  }, []);

  // Set image reference
  const setImgRef = useCallback((img: HTMLImageElement | null) => {
    imgRef.current = img;
  }, []);

  // Set stream status
  const setStreamStatus = useCallback(
    (status: "loading" | "ready" | "error" | "unavailable" | "stopped") => {
      setState((prev) => ({ ...prev, streamStatus: status }));
    },
    []
  );

  // Auto start recognition when stream is ready
  useEffect(() => {
    if (
      state.isStreamConnected &&
      state.streamStatus === "ready" &&
      !state.isActive
    ) {
      console.log("🚀 Auto-starting face recognition system...");
      startRecognition();
    }
  }, [
    state.isStreamConnected,
    state.streamStatus,
    state.isActive,
    startRecognition,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up face recognition hook...");
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state: {
      ...state,
      todayScans: mqttState.todayScans,
      successfulScans: mqttState.successfulScans,
      statsLoading: mqttState.statsLoading,
    },
    startStream,
    stopStream,
    startRecognition,
    stopRecognition,
    triggerVerification,
    resetSystem,
    forceStop,
    setImgRef,
    setStreamStatus,
    startCountdown,
  };
}
