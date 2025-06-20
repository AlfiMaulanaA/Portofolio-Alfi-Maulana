"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

interface SystemStatus {
  autoCleanup: {
    isRunning: boolean;
    hasInterval: boolean;
  };
  timestamp: string;
}

interface CleanupInfo {
  totalLogs: number;
  oldLogs: number;
  cutoffDate: string;
  willBeDeleted: number;
}

export function SystemStatusIndicator() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [cleanupInfo, setCleanupInfo] = useState<CleanupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/system/init");
      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error("Error fetching system status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupInfo = async () => {
    try {
      setInfoLoading(true);
      const response = await fetch("/api/history/cleanup");
      const result = await response.json();

      if (result.success) {
        setCleanupInfo(result.data);
      }
    } catch (error) {
      console.error("Error fetching cleanup info:", error);
    } finally {
      setInfoLoading(false);
    }
  };

  const triggerManualCleanup = async () => {
    try {
      setCleanupLoading(true);

      const response = await fetch("/api/system/cleanup", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        Swal.fire({
          title: "🧹 Cleanup Complete!",
          html: `
            <div class="text-center">
              <p class="text-lg font-semibold text-green-600">${result.deletedCount} old logs deleted</p>
              <p class="text-sm text-gray-600 mt-2">Database has been optimized</p>
            </div>
          `,
          icon: "success",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Refresh cleanup info after successful cleanup
        fetchCleanupInfo();
      } else {
        Swal.fire({
          title: "❌ Cleanup Failed",
          text: result.error || "Failed to perform cleanup",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error triggering cleanup:", error);
      Swal.fire({
        title: "🚫 Connection Error",
        text: "Failed to connect to cleanup service",
        icon: "error",
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchCleanupInfo();

    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
      fetchCleanupInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Management & Auto Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading system status...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Management & Auto Cleanup
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor system services and manage database cleanup operations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Cleanup Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Auto Cleanup Service</span>
              </div>
              <Badge
                variant={
                  status?.autoCleanup.isRunning ? "default" : "destructive"
                }
              >
                {status?.autoCleanup.isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {status?.autoCleanup.isRunning
                ? "Automatically deletes history logs older than 2 days every 6 hours"
                : "Auto cleanup service is not running"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${
                  status?.autoCleanup.isRunning ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              <span>
                {status?.autoCleanup.isRunning
                  ? "Active since system start"
                  : "Service inactive"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Database Status</span>
            </div>
            {infoLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading database info...</span>
              </div>
            ) : cleanupInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total History Logs:</span>
                  <span className="font-medium">
                    {cleanupInfo.totalLogs.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Old Logs &gt;2 days:</span>
                  <span
                    className={`font-medium ${
                      cleanupInfo.oldLogs > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {cleanupInfo.oldLogs.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {cleanupInfo.oldLogs > 0 ? (
                    <>
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span>Ready for cleanup</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Database is clean</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Failed to load database info
              </p>
            )}
          </div>
        </div>

        {/* Cleanup Actions */}
        <div className="border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={fetchStatus}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>

            <Button
              variant="outline"
              onClick={fetchCleanupInfo}
              disabled={infoLoading}
              className="flex-1"
            >
              {infoLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Check Database
            </Button>

            <Button
              onClick={triggerManualCleanup}
              disabled={
                cleanupLoading || (cleanupInfo && cleanupInfo.oldLogs === 0)
              }
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {cleanupLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {cleanupInfo && cleanupInfo.oldLogs > 0
                ? `Cleanup ${cleanupInfo.oldLogs} Logs`
                : "Manual Cleanup"}
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>System Status:</span>
            <span>
              {status?.timestamp
                ? `Updated ${new Date(status.timestamp).toLocaleTimeString()}`
                : "Never updated"}
            </span>
          </div>
          {cleanupInfo && (
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>Cleanup Cutoff:</span>
              <span>
                {new Date(cleanupInfo.cutoffDate).toLocaleDateString()} (2 days
                ago)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
