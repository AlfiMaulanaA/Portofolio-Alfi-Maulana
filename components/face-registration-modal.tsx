"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, RotateCcw, Upload, Loader2 } from "lucide-react";
import { FaceRecognitionService } from "@/services/face-recognition.service";
import { FaceApiService } from "@/services/face-api.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface User {
  id: number;
  name: string;
  email: string;
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
    "idle" | "streaming" | "captured" | "uploading" | "complete" | "error"
  >("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const faceRecognitionService = FaceRecognitionService.getInstance();
  const faceApiService = FaceApiService.getInstance();

  // Start camera stream
  const startStream = () => {
    setStatus("streaming");
    setStreamError(null);
    setCapturedImage(null);

    // Start streaming from MJPEG endpoint
    if (imgRef.current) {
      imgRef.current.src =
        faceRecognitionService.getStreamUrl() + "?t=" + Date.now();
    }

    // Refresh stream every 100ms to ensure it stays live
    streamIntervalRef.current = setInterval(() => {
      if (imgRef.current && status === "streaming") {
        imgRef.current.src =
          faceRecognitionService.getStreamUrl() + "?t=" + Date.now();
      }
    }, 100);
  };

  // Stop camera stream
  const stopStream = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  // Capture frame from stream
  const captureFrame = async () => {
    try {
      if (!imgRef.current) {
        throw new Error("Camera not ready");
      }

      // Capture frame from RTSP stream
      const imageBase64 = await faceRecognitionService.captureFrameFromRTSP();
      setCapturedImage(imageBase64);
      setStatus("captured");
      stopStream();

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
      console.error("Capture error:", error);
      setStreamError(
        error instanceof Error ? error.message : "Failed to capture frame"
      );
      setStatus("error");

      MySwal.fire({
        title: "❌ Capture Failed",
        text:
          error instanceof Error ? error.message : "Failed to capture frame",
        icon: "error",
        position: "top-end",
        toast: true,
        timer: 3000,
      });
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setStreamError(null);
    startStream();
  };

  // Upload photo to Face API
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

      // Upload photo to Face API (assuming user ID maps to personnel ID)
      await faceApiService.uploadPhoto(user.id, capturedImage);

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
      console.error("Upload error:", error);
      setStatus("error");

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
    stopStream();
    setStatus("idle");
    setCapturedImage(null);
    setStreamError(null);
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

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
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Camera Stream / Captured Image */}
            <div className="relative w-full max-w-md">
              <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {status === "idle" && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click Start Camera to begin
                      </p>
                    </div>
                  </div>
                )}

                {status === "streaming" && (
                  <>
                    <img
                      ref={imgRef}
                      alt="Camera stream"
                      className="w-full h-full object-cover"
                      onError={() =>
                        setStreamError("Failed to load camera stream")
                      }
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="animate-pulse">
                        🔴 LIVE
                      </Badge>
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
                      <p className="text-sm">Uploading...</p>
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
              </div>

              {streamError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-red-600 mb-2">Camera Error</p>
                    <p className="text-xs text-red-500">{streamError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full max-w-md">
              {status === "idle" && (
                <Button onClick={startStream} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              )}

              {status === "streaming" && (
                <>
                  <Button onClick={captureFrame} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </>
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
                  <Button onClick={startStream} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground max-w-md">
              {status === "idle" && (
                <p>Start the camera to begin face registration</p>
              )}
              {status === "streaming" && (
                <p>Position your face in the center and click Capture Photo</p>
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
