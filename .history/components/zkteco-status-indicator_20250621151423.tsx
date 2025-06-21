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
import { Wifi, WifiOff, RefreshCw, Settings, Users, Clock } from "lucide-react";

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

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkZKTecoStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const deviceInfo = status?.data?.device_info;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ZKTeco Access Control
          </CardTitle>
          <CardDescription>Device connection and status</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {status?.success ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={checkZKTecoStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deviceInfo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Device IP</p>
                <p className="font-medium">
                  {deviceInfo.ip}:{deviceInfo.port}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Serial Number</p>
                <p className="font-medium">{deviceInfo.serial}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Firmware</p>
                <p className="font-medium">{deviceInfo.firmware}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platform</p>
                <p className="font-medium">{deviceInfo.platform}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium">{deviceInfo.users}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Records:</span>
                <span className="font-medium">{deviceInfo.attendances}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Testing connection...
              </div>
            ) : (
              <div>
                <p className="text-red-500 mb-2">
                  {status?.message || "No connection"}
                </p>
                {status?.error && (
                  <p className="text-xs text-muted-foreground">
                    {status.error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {lastChecked && (
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
