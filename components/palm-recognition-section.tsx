"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hand, Target, Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { useMqttPalmRecognition } from "@/hooks/use-mqtt-palm-recognition";
import { PalmImageViewer } from "./palm-image-viewer";

export function PalmRecognitionSection() {
  const { state, fetchTodayStats } = useMqttPalmRecognition();

  const getConnectionStatus = () => {
    if (state.isConnecting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      );
    }

    return (
      <Badge
        variant={state.isConnected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {state.isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
    );
  };

  const successRate =
    state.todayScans > 0
      ? Math.round((state.successfulScans / state.todayScans) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hand className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Palm Recognition System</h2>
          {getConnectionStatus()}
        </div>
        <Button variant="outline" size="sm" onClick={fetchTodayStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards - Larger */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {state.statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                state.todayScans
              )}
            </div>
            <p className="text-sm text-muted-foreground">Today's Scans</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">%</span>
            </div>
            <div className="text-2xl font-bold">
              {state.statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                `${successRate}%`
              )}
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div className="text-2xl font-bold">
              {state.statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                state.successfulScans
              )}
            </div>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <Hand className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">Active</div>
            <p className="text-sm text-muted-foreground">Status</p>
          </div>
        </Card>
      </div>

      {/* Palm Scanner Feeds - Auto-refreshing every 5 seconds */}
      <div className="grid gap-4 md:grid-cols-2">
        <PalmImageViewer title="RGB Camera" type="rgb" />
        <PalmImageViewer title="Infrared Camera" type="ir" />
      </div>

      {/* Recognition Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recognition Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.currentResult && (
              <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Latest Recognition</span>
                  <Badge
                    variant={
                      state.currentResult.score >= 0.8
                        ? "default"
                        : "destructive"
                    }
                  >
                    {state.currentResult.score >= 0.8 ? "SUCCESS" : "REJECTED"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {state.currentResult.user}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {(state.currentResult.score * 100).toFixed(1)}%
                    {state.currentResult.score < 0.8 && (
                      <span className="text-red-500 ml-2">
                        (Below threshold)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      state.currentResult.timestamp
                    ).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              {state.recentResults.length === 0 && !state.currentResult ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {state.isConnected
                    ? "Waiting for palm scans..."
                    : "Connect to palm device to see activity"}
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {state.recentResults.slice(0, 3).map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded border"
                    >
                      <div>
                        <p className="font-medium">{result.user}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          result.score >= 0.8 ? "default" : "destructive"
                        }
                      >
                        {(result.score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
