"use client";

import { useState, useEffect, useCallback } from "react";

interface PalmVeinUser {
  id: number;
  name: string;
  email?: string;
  department?: string;
  palm_registered: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PalmVeinUsersResponse {
  success: boolean;
  data: PalmVeinUser[];
  source: string;
  timestamp: string;
  error?: string;
}

export function usePalmVeinUsers() {
  const [users, setUsers] = useState<PalmVeinUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🌴 Fetching Palm Vein users...");

      const response = await fetch("/api/palm-vein/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache busting
        cache: "no-cache",
      });

      const result: PalmVeinUsersResponse = await response.json();

      if (result.success) {
        setUsers(result.data);
        setLastFetch(new Date());
      } else {
        throw new Error(result.error || "Failed to fetch Palm Vein users");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Error fetching Palm Vein users:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePalmRegistration = useCallback(
    async (userId: number, palmRegistered: boolean) => {
      try {
        const response = await fetch(
          `/api/palm-vein/users/${userId}/palm-registration`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ palm_registered: palmRegistered }),
          }
        );

        const result = await response.json();

        if (result.success) {
          // Update local state
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId
                ? { ...user, palm_registered: palmRegistered }
                : user
            )
          );
          console.log("✅ Palm Vein registration updated successfully");
          return { success: true };
        } else {
          throw new Error(
            result.error || "Failed to update Palm Vein registration"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          "❌ Error updating Palm Vein registration:",
          errorMessage
        );
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    lastFetch,
    fetchUsers,
    updatePalmRegistration,
  };
}
