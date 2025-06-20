"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Play, Loader2 } from "lucide-react";
import { FaceRecognitionOverlay } from "./face-recognition-overlay";
import { useMqttFaceRecognition } from "@/hooks/use-mqtt-face-recognition";

export function FaceRecognitionSection() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const { state } = useMqttFaceRecognition();

  const successRate =
    state.todayScans > 0
      ? Math.round((state.successfulScans / state.todayScans) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Face Recognition</h2>
      </div>

      {/* Stats - Very Compact */}
      <div className="grid gap-2 grid-cols-2">
        <Card className="p-2">
          <div className="text-center">
            <div className="text-lg font-bold">
              {state.statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                state.todayScans
              )}
            </div>
            <p className="text-xs text-muted-foreground">Scans</p>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-lg font-bold">
              {state.statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                `${successRate}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
        </Card>
      </div>

      {/* Big Activation Button */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">RTSP Camera</h3>
              <p className="text-xs text-muted-foreground">
                Real-time face recognition
              </p>
            </div>
            <Button
              onClick={() => setIsOverlayOpen(true)}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Face Recognition
            </Button>
            <div className="flex justify-center gap-2">
              <Badge variant="default" className="text-xs bg-blue-500">
                Ready
              </Badge>
              <Badge variant="outline" className="text-xs">
                640x480
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Minimal */}
      {state.recentResults.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-sm font-medium mb-2">Recent</h4>
            <div className="space-y-1">
              {state.recentResults.slice(0, 2).map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-1"
                >
                  <span className="font-medium">{result.name}</span>
                  <Badge
                    variant={
                      result.success && result.authorized
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {result.success && result.authorized ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FaceRecognitionOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
      />
    </div>
  );
}
