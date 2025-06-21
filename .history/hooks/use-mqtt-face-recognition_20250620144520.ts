"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface FaceRecognitionResult {
  authorized: boolean;
  distance: number;
  name: string;
  person_id: number | null;
  success: boolean;
  timestamp: Date;
}

interface TodayStats {
  faceScans: number;
  successfulFaceScans: number;
  totalScans: number;
  totalSuccessful: number;
}

interface FaceRecognitionState {
  currentResult: FaceRecognitionResult | null;
  recentResults: FaceRecognitionResult[];
  todayScans: number;
  successfulScans: number;
  todayStats: TodayStats | null;
  statsLoading: boolean;
}

export function useMqttFaceRecognition() {
  const [state, setState] = useState<FaceRecognitionState>({
    currentResult: null,
    recentResults: [],
    todayScans: 0,
    successfulScans: 0,
    todayStats: null,
    statsLoading: true,
  });

  // Show sweet alert notification for face recognition
  const showFaceNotification = useCallback((result: FaceRecognitionResult) => {
    const isSuccess = result.success && result.authorized;
    const confidence = Math.round((1 - result.distance) * 100);

    MySwal.fire({
      title: isSuccess
        ? "👤 Face Recognition Success!"
        : "❌ Face Recognition Failed",
      html: `
        <div class="text-center">
          <div class="text-lg font-semibold ${
            isSuccess ? "text-green-600" : "text-red-600"
          } mb-2">
            ${result.name}
          </div>
          <div class="text-sm text-gray-600">
            ${
              isSuccess
                ? "Access Granted"
                : result.name === "No Face Detected"
                ? "No Face Detected"
                : "Access Denied"
            }
          </div>
          <div class="text-sm text-gray-600">
            Confidence: ${confidence}%
          </div>
          <div class="text-xs text-gray-500 mt-2">
            ${new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `,
      icon: isSuccess ? "success" : "error",
      position: "top-end",
      timer: 4000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      background: isSuccess ? "#f0fdf4" : "#fef2f2",
      color: isSuccess ? "#166534" : "#dc2626",
    });
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
          todayScans: result.data.faceScans,
          successfulScans: result.data.successfulFaceScans,
          statsLoading: false,
        }));
        console.log("✅ Today's face stats loaded:", result.data);
      } else {
        console.error("❌ Failed to fetch today's face stats:", result.error);
        setState((prev) => ({ ...prev, statsLoading: false }));
      }
    } catch (error) {
      console.error("❌ Error fetching today's face stats:", error);
      setState((prev) => ({ ...prev, statsLoading: false }));
    }
  }, []);

  // Handle face recognition result and save to database
  const handleFaceRecognitionResult = useCallback(
    async (result: FaceRecognitionResult) => {
      try {
        console.log("📊 Face recognition result received:", result);

        // Show sweet alert notification
        showFaceNotification(result);

        // Update state with new result
        setState((prev) => ({
          ...prev,
          currentResult: result,
          recentResults: [result, ...prev.recentResults.slice(0, 9)], // Keep last 10 results
          todayScans: prev.todayScans + 1,
          successfulScans:
            result.success && result.authorized
              ? prev.successfulScans + 1
              : prev.successfulScans,
        }));

        // Create history log in database
        try {
          const confidence = Math.round((1 - result.distance) * 100);
          const isSuccess = result.success && result.authorized;

          await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: result.person_id,
              user_name: result.name,
              recognition_type: "face",
              result: isSuccess
                ? "success"
                : result.name === "No Face Detected"
                ? "unknown"
                : "failed",
              confidence: confidence,
              location: "Main Entrance",
              device_id: "face_camera_001",
            }),
          });

          console.log("✅ History log created for face recognition");
        } catch (error) {
          console.error(
            "❌ Failed to create face recognition history log:",
            error
          );
        }

        // Clear current result after 5 seconds
        setTimeout(() => {
          setState((prev) => ({ ...prev, currentResult: null }));
        }, 5000);
      } catch (error) {
        console.error("❌ Failed to handle face recognition result:", error);
      }
    },
    [showFaceNotification]
  );

  // Auto-fetch stats on mount
  useEffect(() => {
    console.log("🚀 Initializing Face Recognition stats...");
    fetchTodayStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchTodayStats, 30000);
    return () => clearInterval(interval);
  }, [fetchTodayStats]);

  return {
    state,
    fetchTodayStats,
    handleFaceRecognitionResult,
  };
}
