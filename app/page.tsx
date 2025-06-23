"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PalmRecognitionSection } from "@/components/palm-recognition-section";
import { FaceRecognitionSection } from "@/components/face-recognition-section";
import { SystemInitializer } from "@/components/system-initializer";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useMqttAttendance } from "@/hooks/use-mqtt-attendance";
import { useZKTecoStatus } from "@/hooks/use-zkteco-status";

export default function OverviewDashboard() {
  const { stats, loading, refetch } = useDashboardStats();
  const {
    status: zktecoStatus,
    loading: zktecoLoading,
    refetch: refetchZKTeco,
  } = useZKTecoStatus();

  // Initialize attendance MQTT (only for sweet alerts)
  useMqttAttendance();

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Biometric System</h1>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Quick Stats - 5 Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold">
                {loading ? "..." : stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold">
                {loading ? "..." : stats?.todayActivity || 0}
              </div>
              <p className="text-xs text-muted-foreground">Today's Scans</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">System Status</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {zktecoStatus?.success ? (
                  <Badge variant="default" className="text-xs bg-green-500">
                    <Wifi className="h-2 w-2 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <WifiOff className="h-2 w-2 mr-1" />
                    Offline
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={refetchZKTeco}
                  disabled={zktecoLoading}
                >
                  <RefreshCw
                    className={`h-2 w-2 ${zktecoLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">ZKTeco Device</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold">
                {loading ? "..." : stats?.zktecoSynced || 0}
              </div>
              <p className="text-xs text-muted-foreground">ZKTeco Sync</p>
            </div>
          </Card>
        </div>

        {/* Main Recognition Systems - PRIMARY FOCUS */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Face Recognition - Compact Left */}
          <div className="lg:col-span-1">
            <FaceRecognitionSection />
          </div>

          {/* Palm Recognition - Larger Right */}
          <div className="lg:col-span-2">
            <PalmRecognitionSection />
          </div>
        </div>
      </div>

      <SystemInitializer />
    </SidebarInset>
  );
}
