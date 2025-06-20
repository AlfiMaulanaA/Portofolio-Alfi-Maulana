"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  palmRegistered: number;
  faceRegistered: number;
  todayActivity: number;
  todaySuccessful: number;
  successRate: number;
  lastUpdated: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
