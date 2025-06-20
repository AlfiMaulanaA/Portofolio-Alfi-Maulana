"use client";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Camera,
  User,
  RotateCcw,
  Scan,
  X,
  Wifi,
  WifiOff,
  Timer,
} from "lucide-react";
import { useFaceRecognition } from "@/hooks/use-face-recognition";

interface FaceRecognitionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FaceRecognitionOverlay({
  isOpen,
  onClose,
}: FaceRecognitionOverlayProps) {
  const {
    state,
    startStream,
    forceStop,
    triggerVerification,
    resetSystem,
    setImgRef,
    setStreamStatus,
  } = useFaceRecognition();

  // Auto start stream when overlay opens
  useEffect(() => {
    if (isOpen && !state.isStreamStarted) {
      startStream();
    }
  }, [isOpen, state.isStreamStarted, startStream]);

  // Force stop everything when overlay closes
  useEffect(() => {
    if (!isOpen) {
      forceStop();
    }
  }, [isOpen, forceStop]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Face Recognition System - RTSP Stream
              {state.isActive && (
                <Badge variant="default" className="ml-2">
                  System Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={state.isStreamConnected ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {state.isStreamConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    {state.streamStatus === "stopped"
                      ? "Stopped"
                      : "Disconnected"}
                  </>
                )}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full overflow-auto">
          {/* Control Panel */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={resetSystem} size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset System
            </Button>
            <Button
              onClick={triggerVerification}
              disabled={
                !state.isActive ||
                state.isProcessing ||
                state.isCountingDown ||
                !state.isStreamConnected
              }
              size="lg"
              className="ml-auto"
            >
              {state.isCountingDown ? (
                <>
                  <Timer className="h-4 w-4 mr-2" />
                  Countdown: {state.countdown}s
                </>
              ) : state.isProcessing ? (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Verify Face Now
                </>
              )}
            </Button>
          </div>

          {/* Status Info */}
          {!state.isActive && state.isStreamConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                🚀 System is starting automatically... Please wait for the
                system to be ready.
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <div
                  className={`h-2 w-2 rounded-full ${
                    state.isActive ? "bg-green-500" : "bg-yellow-400"
                  }`}
                ></div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-xl font-bold ${
                    state.isActive ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {state.isActive ? "Active" : "Starting..."}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.isCountingDown
                    ? `Countdown: ${state.countdown}s`
                    : state.isProcessing
                    ? "Processing..."
                    : state.isActive
                    ? "Ready for verification"
                    : "Initializing system..."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verifications
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {state.verificationLog.length}
                </div>
                <p className="text-xs text-muted-foreground">Current session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {state.verificationLog.length > 0
                    ? Math.round(
                        (state.verificationLog.filter((r) => r.authorized)
                          .length /
                          state.verificationLog.length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Authorization rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Authorized
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {state.verificationLog.filter((r) => r.authorized).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful verifications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-4 md:grid-cols-2 flex-1">
            {/* Camera Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Live RTSP Camera Feed
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        state.isStreamConnected ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {state.streamStatus === "stopped"
                        ? "Stopped"
                        : state.streamStatus === "loading"
                        ? "Loading..."
                        : state.isStreamConnected
                        ? "Connected"
                        : "Disconnected"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      MJPEG Stream
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg bg-black overflow-hidden">
                  {state.streamStatus === "stopped" ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Camera className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Stream Stopped</p>
                        <p className="text-sm opacity-75">
                          Open overlay to start stream
                        </p>
                      </div>
                    </div>
                  ) : state.streamStatus === "loading" ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg font-medium">
                          Starting Stream...
                        </p>
                        <p className="text-sm opacity-75">Please wait</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      ref={setImgRef}
                      src={
                        state.isStreamStarted
                          ? state.streamUrl
                          : "/placeholder.svg?height=480&width=640"
                      }
                      alt="RTSP MJPEG Stream"
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error("❌ MJPEG stream error");
                        setStreamStatus("error");
                      }}
                      onLoad={() => {
                        if (state.isStreamStarted) {
                          console.log("✅ MJPEG stream loaded successfully");
                          setStreamStatus("ready");
                        }
                      }}
                    />
                  )}

                  {/* Countdown Overlay */}
                  {state.isCountingDown && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-blue-500 text-white p-8 rounded-full">
                        <div className="text-6xl font-bold text-center">
                          {state.countdown}
                        </div>
                        <p className="text-center mt-2">Get Ready!</p>
                      </div>
                    </div>
                  )}

                  {/* Recognition Result Overlay */}
                  {state.currentResult && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {state.currentResult.name}
                          </p>
                          <p className="text-sm opacity-75">
                            {state.currentResult.name === "No Face Detected"
                              ? "Please position face clearly"
                              : state.currentResult.name === "Unknown Person"
                              ? "Face detected but not recognized"
                              : `Confidence: ${(
                                  (1 - state.currentResult.distance) *
                                  100
                                ).toFixed(1)}%`}
                          </p>
                          <p className="text-xs opacity-75">
                            ID: {state.currentResult.person_id || "N/A"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            state.currentResult.authorized
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {state.currentResult.authorized
                            ? "AUTHORIZED"
                            : "DENIED"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Live Indicator */}
                  {state.isActive && state.isStreamConnected && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="destructive" className="animate-pulse">
                        ● LIVE RTSP
                      </Badge>
                    </div>
                  )}

                  {/* Processing Indicator */}
                  {state.isProcessing && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="animate-pulse">
                        🔍 ANALYZING
                      </Badge>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {state.error && (
                    <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
                      <div className="bg-red-500 text-white p-4 rounded-lg max-w-sm text-center">
                        <p className="font-medium">Stream Error</p>
                        <p className="text-sm mb-2">{state.error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-white border-white hover:bg-white hover:text-red-500"
                          onClick={() => window.location.reload()}
                        >
                          Retry Connection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification Log */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.verificationLog.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No verifications yet. Click "Verify Face Now" to start.
                    </p>
                  ) : (
                    state.verificationLog.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              result.authorized ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              result.authorized ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {result.name === "No Face Detected"
                              ? "N/A"
                              : `${((1 - result.distance) * 100).toFixed(1)}%`}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {result.person_id || "N/A"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
