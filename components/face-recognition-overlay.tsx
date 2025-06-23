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
      console.log("🎬 Auto-starting MJPEG stream...");
      startStream();
    }
  }, [isOpen, state.isStreamStarted, startStream]);

  // Force stop everything when overlay closes
  useEffect(() => {
    if (!isOpen) {
      console.log("🔄 Overlay closed - force stopping all processes...");
      forceStop();
    }
  }, [isOpen, forceStop]);

  const handleClose = () => {
    console.log("🔄 Closing overlay...");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden max-h-[900px]:max-w-md max-h-[900px]:h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline">
                Face Recognition System - RTSP Stream
              </span>
              <span className="sm:hidden">Face Recognition</span>
              {state.isActive && (
                <Badge variant="default" className="ml-2 text-xs">
                  System Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={state.isStreamConnected ? "default" : "destructive"}
                className="flex items-center gap-1 text-xs"
              >
                {state.isStreamConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span className="hidden sm:inline">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {state.streamStatus === "stopped"
                        ? "Stopped"
                        : "Disconnected"}
                    </span>
                  </>
                )}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleClose}></Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full overflow-auto">
          {/* Control Panel */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={resetSystem} size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reset System</span>
              <span className="sm:hidden">Reset</span>
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
                  <span className="hidden sm:inline">Verify Face Now</span>
                  <span className="sm:hidden">Verify</span>
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

          {/* Mobile Layout (900x1300 and below) */}
          <div className="block max-h-[900px]:block lg:hidden">
            {/* Stats Cards - 2x2 Grid for Mobile */}
            <div className="grid gap-3 grid-cols-2 mb-4">
              <Card className="p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        state.isActive ? "bg-green-500" : "bg-yellow-400"
                      }`}
                    ></div>
                    <span className="text-xs font-medium">System Status</span>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      state.isActive ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {state.isActive ? "Active" : "Starting..."}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {state.isActive
                      ? "Ready for verification"
                      : "Initializing..."}
                  </p>
                </div>
              </Card>

              <Card className="p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Verifications</span>
                  </div>
                  <div className="text-lg font-bold">
                    {state.verificationLog.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current session
                  </p>
                </div>
              </Card>

              <Card className="p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Camera className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Success Rate</span>
                  </div>
                  <div className="text-lg font-bold">
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
                </div>
              </Card>

              <Card className="p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Authorized</span>
                  </div>
                  <div className="text-lg font-bold">
                    {state.verificationLog.filter((r) => r.authorized).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successful verifications
                  </p>
                </div>
              </Card>
            </div>

            {/* Camera Feed - Full Width */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
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
              <CardContent className="pt-0">
                <div className="relative aspect-video rounded-lg bg-black overflow-hidden">
                  {state.streamStatus === "stopped" ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">Stream Stopped</p>
                        <p className="text-xs opacity-75">
                          Open overlay to start
                        </p>
                      </div>
                    </div>
                  ) : state.streamStatus === "loading" ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm font-medium">
                          Starting Stream...
                        </p>
                        <p className="text-xs opacity-75">Please wait</p>
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
                      <div className="bg-blue-500 text-white p-6 rounded-full">
                        <div className="text-4xl font-bold text-center">
                          {state.countdown}
                        </div>
                        <p className="text-center mt-1 text-sm">Get Ready!</p>
                      </div>
                    </div>
                  )}

                  {/* Recognition Result Overlay */}
                  {state.currentResult && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {state.currentResult.name}
                          </p>
                          <p className="text-xs opacity-75">
                            {state.currentResult.name === "No Face Detected"
                              ? "Position face clearly"
                              : state.currentResult.name === "Unknown Person"
                              ? "Face not recognized"
                              : `Confidence: ${(
                                  (1 - state.currentResult.distance) *
                                  100
                                ).toFixed(1)}%`}
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
                          {state.currentResult.authorized ? "OK" : "DENIED"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Live Indicator */}
                  {state.isActive && state.isStreamConnected && (
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="destructive"
                        className="animate-pulse text-xs"
                      >
                        ● LIVE RTSP
                      </Badge>
                    </div>
                  )}

                  {/* Processing Indicator */}
                  {state.isProcessing && (
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="animate-pulse text-xs"
                      >
                        🔍 ANALYZING
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Verification Log</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.verificationLog.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      No verifications yet. Click "Verify Face Now" to start.
                    </p>
                  ) : (
                    state.verificationLog.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              result.authorized ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium text-sm">{result.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
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
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Layout (above 900px height) */}
          <div className="hidden max-h-[900px]:hidden lg:block">
            {/* Stats Cards - 4 Cards in Row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-4">
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
                  <p className="text-xs text-muted-foreground">
                    Current session
                  </p>
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

            {/* Main Content - 2 Columns */}
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
                                result.authorized
                                  ? "bg-green-500"
                                  : "bg-red-500"
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
                                : `${((1 - result.distance) * 100).toFixed(
                                    1
                                  )}%`}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
