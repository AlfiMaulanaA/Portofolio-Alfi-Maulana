"use client";

import { useState, useEffect } from "react";

interface ZKTecoStatus {
  success: boolean;
  message: string;
  data?: {
    device_info?: {
      ip: string;
      port: number;
      firmware: string;
      serial: string;
      platform: string;
      name: string;
      users: number;
      attendances: number;
    };
  };
  error?: string;
}

export function useZKTecoStatus() {
  const [status, setStatus] = useState<ZKTecoStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system/zkteco-test");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to check ZKTeco status:", error);
      setStatus({
        success: false,
        message: "Failed to connect to ZKTeco API",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Check every 2 minutes
    const interval = setInterval(checkStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading, refetch: checkStatus };
}
