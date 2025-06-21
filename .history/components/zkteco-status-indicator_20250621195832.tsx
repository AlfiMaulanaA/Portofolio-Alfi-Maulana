"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, Users, Clock, Server } from "lucide-react";

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

export function ZKTecoStatusIndicator() {
  const [status, setStatus] = useState<ZKTecoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkZKTecoStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system/zkteco-test");
      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
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
    checkZKTecoStatus();

    // Auto-refresh every 60 seconds (less frequent)
    const interval = setInterval(checkZKTecoStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const deviceInfo = status?.data?.device_info;

  return (
    <Card className="w-full border-muted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base font-medium">
              ZKTeco Device
            </CardTitle>
            <CardDescription className="text-xs">
              Access control integration status
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status?.success ? (
            <Badge variant="default" className="bg-green-500 text-xs">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkZKTecoStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {deviceInfo ? (
          <div className="space-y-3">
            {/* Device Info - Compact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Device IP</p>
                <p className="font-medium text-sm">
                  {deviceInfo.ip}:{deviceInfo.port}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Firmware</p>
                <p className="font-medium text-sm">{deviceInfo.firmware}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Serial</p>
                <p className="font-medium text-sm">{deviceInfo.serial}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Platform</p>
                <p className="font-medium text-sm">{deviceInfo.platform}</p>
              </div>
            </div>

            {/* Stats - Horizontal Layout */}
            <div className="flex gap-6 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Users:</span>
                <span className="font-semibold">{deviceInfo.users}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Records:</span>
                <span className="font-semibold">
                  {deviceInfo.attendances.toLocaleString()}
                </span>
              </div>
              {lastChecked && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                  <span>Updated: {lastChecked.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Testing connection to ZKTeco device...
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-orange-600 font-medium">
                  {status?.message || "Device not connected"}
                </p>
                {status?.error && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    Error: {status.error}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Check device connection and network settings
                </p>
              </div>
            )}
            s
          </div>
        )}
      </CardContent>
    </Card>
  );
}
