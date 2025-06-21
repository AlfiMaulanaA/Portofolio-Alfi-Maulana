"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Clock, Wifi } from "lucide-react";
import { PalmRecognitionSection } from "@/components/palm-recognition-section";
import { FaceRecognitionSection } from "@/components/face-recognition-section";
import { SystemInitializer } from "@/components/system-initializer";
import { ZKTecoStatusIndicator } from "@/components/zkteco-status-indicator";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SystemInitializer />

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Biometric Recognition Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Live System</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Loading..."
                : `${stats?.faceApiSynced || 0} synced to Face API`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.todayActivity || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recognition attempts today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ZKTeco Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.zktecoSynced || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users synced to device
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ZKTeco Status */}
      <div className="grid gap-4 md:grid-cols-1">
        <ZKTecoStatusIndicator />
      </div>

      {/* Recognition Sections */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <PalmRecognitionSection />
        <FaceRecognitionSection />
      </div>
    </div>
  );
}
