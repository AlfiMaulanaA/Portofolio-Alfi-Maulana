"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CheckCircle,
  RotateCcw,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FaceApiService } from "@/services/face-api.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface User {
  id: number;
  name: string;
  email: string;
  face_api_id?: number;
}

interface FaceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user: User | null;
}

export function FaceRegistrationModal({
  isOpen,
  onClose,
  onComplete,
  user,
}: FaceRegistrationModalProps) {
  const [status, setStatus] = useState<
    | "idle"
    | "streaming"
    | "countdown"
    | "captured"
    | "uploading"
    | "complete"
    | "error"
  >("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [streamUrl, setStreamUrl] = useState<string>("");

  const faceApiService = FaceApiService.getInstance();

  // Start camera stream immediately when modal opens
  useEffect(() => {
    if (isOpen && user) {
      startCameraStream();
    }
    return () => {
      // Cleanup when modal closes
      setStatus("idle");
      setCapturedImage(null);
      setError(null);
      setCountdown(5);
    };
  }, [isOpen, user]);

  // Start camera stream
  const startCameraStream = () => {
    setStatus("streaming");
    setError(null);
    // Generate unique stream URL to avoid caching
    const url = `/api/mjpeg?t=${Date.now()}`;
    setStreamUrl(url);
  };

  // Start countdown and auto-capture
  const startCountdownCapture = () => {
    setStatus("countdown");
    setCountdown(5);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Auto capture after countdown
          setTimeout(() => {
            captureFrame();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Capture frame from RTSP
  const captureFrame = async () => {
    try {
      setStatus("capturing");

      const response = await fetch("/api/capture-frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to capture frame");
      }

      setCapturedImage(result.image);
      setStatus("captured");

      MySwal.fire({
        title: "📸 Photo Captured!",
        text: "Review your photo and upload when ready",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error) {
      console.error("❌ Capture error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to capture frame";
      setError(errorMessage);
      setStatus("error");

      MySwal.fire({
        title: "❌ Capture Failed",
        text: errorMessage,
        icon: "error",
        position: "top-end",
        toast: true,
        timer: 4000,
      });
    }
  };

  // Retake photo - restart countdown
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCameraStream();
  };

  // Upload photo and register biometric
  const uploadPhoto = async () => {
    if (!capturedImage || !user) return;

    try {
      setStatus("uploading");

      MySwal.fire({
        title: "📤 Uploading Photo...",
        text: "Registering face to recognition system",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // If user doesn't have face_api_id, create personnel first
      let faceApiId = user.face_api_id;

      if (!faceApiId) {
        const personnelResult = await faceApiService.createPersonnel({
          name: user.name,
          department: "Default",
          entity: "Company",
          authorized: true,
        });

        if (!personnelResult.success || !personnelResult.id) {
          throw new Error("Failed to create personnel in Face API");
        }

        faceApiId = personnelResult.id;
      }

      await faceApiService.uploadPhoto(faceApiId, capturedImage);

      const biometricResponse = await fetch(
        `/api/users/${user.id}/register-biometric`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "face",
          }),
        }
      );

      const biometricResult = await biometricResponse.json();
      if (!biometricResult.success) {
        throw new Error("Failed to register biometric in database");
      }

      // Refresh face database
      await faceApiService.refreshDatabase();

      setStatus("complete");

      MySwal.fire({
        title: "✅ Face Registered!",
        text: `${user.name}'s face has been registered successfully`,
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        position: "top-end",
        toast: true,
      });

      setTimeout(() => {
        onComplete();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Upload error:", error);
      setStatus("error");
      setError(
        error instanceof Error ? error.message : "Failed to upload photo"
      );

      MySwal.fire({
        title: "❌ Upload Failed",
        text: error instanceof Error ? error.message : "Failed to upload photo",
        icon: "error",
        confirmButtonText: "Try Again",
      });
    }
  };

  // Handle modal close
  const handleClose = () => {
    setStatus("idle");
    setCapturedImage(null);
    setError(null);
    setCountdown(5);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Registration - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Registering face for:
            </p>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.face_api_id && (
              <Badge variant="secondary" className="mt-1">
                Face API ID: {user.face_api_id}
              </Badge>
            )}
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Camera Preview / Captured Image */}
            <div className="relative w-full max-w-md">
              <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {status === "streaming" && (
                  <>
                    <img
                      src={streamUrl || "/placeholder.svg"}
                      alt="Camera stream"
                      className="w-full h-full object-cover"
                      onError={() => setError("Failed to load camera stream")}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="animate-pulse">
                        🔴 LIVE
                      </Badge>
                    </div>
                  </>
                )}

                {status === "countdown" && (
                  <>
                    <img
                      src={streamUrl || "/placeholder.svg"}
                      alt="Camera stream"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-blue-500 text-white p-8 rounded-full">
                        <div className="text-6xl font-bold text-center">
                          {countdown}
                        </div>
                        <p className="text-center mt-2">Get Ready!</p>
                      </div>
                    </div>
                  </>
                )}

                {status === "captured" && capturedImage && (
                  <>
                    <img
                      src={`data:image/jpeg;base64,${capturedImage}`}
                      alt="Captured frame"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-green-500">
                        📸 CAPTURED
                      </Badge>
                    </div>
                  </>
                )}

                {status === "uploading" && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Uploading to Face API...</p>
                    </div>
                  </div>
                )}

                {status === "complete" && (
                  <div className="flex items-center justify-center h-full bg-green-50">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-green-700">
                        Registration Complete!
                      </p>
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center justify-center h-full bg-red-50">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                      <p className="text-sm text-red-700">Error occurred</p>
                      {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full max-w-md">
              {status === "streaming" && (
                <Button onClick={startCountdownCapture} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo (5s countdown)
                </Button>
              )}

              {status === "countdown" && (
                <Button disabled className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capturing in {countdown}s...
                </Button>
              )}

              {status === "captured" && (
                <>
                  <Button onClick={uploadPhoto} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="outline" onClick={retakePhoto}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                </>
              )}

              {status === "error" && (
                <>
                  <Button onClick={startCameraStream} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </>
              )}

              {(status === "streaming" || status === "error") && (
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground max-w-md">
              {status === "streaming" && (
                <p>
                  Position your face in the center and click "Capture Photo" to
                  start 5-second countdown
                </p>
              )}
              {status === "countdown" && (
                <p>
                  Get ready! Photo will be taken automatically in {countdown}{" "}
                  seconds
                </p>
              )}
              {status === "captured" && (
                <p>Review your photo. Upload when ready or retake if needed</p>
              )}
              {status === "uploading" && (
                <p>Uploading photo to face recognition system...</p>
              )}
              {status === "complete" && (
                <p>Face registration completed successfully!</p>
              )}
              {status === "error" && (
                <p>An error occurred. Please try again or contact support</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
