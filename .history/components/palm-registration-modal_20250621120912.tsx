"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Hand,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useMqttPalm } from "@/hooks/use-mqtt-palm";

const MySwal = require("sweetalert2").default;

interface User {
  id: number;
  name: string;
  email: string;
}

interface PalmRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user: User | null;
}

export function PalmRegistrationModal({
  isOpen,
  onClose,
  onComplete,
  user,
}: PalmRegistrationModalProps) {
  const { state, connect, startRegistration, cancelRegistration, reset } =
    useMqttPalm();
  const [progress, setProgress] = useState(0);

  // Handle progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.currentStep === "waiting_for_palm") {
      interval = setInterval(() => {
        setProgress((prev) => (prev + 2) % 100);
      }, 100);
    } else if (state.currentStep === "processing") {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95));
      }, 200);
    } else if (state.currentStep === "success") {
      setProgress(100);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.currentStep]);

  // Handle successful registration
  useEffect(() => {
    if (state.currentStep === "success" && user) {
      // Call API to save palm data
      savePalmData(user.id);
    }
  }, [state.currentStep, user]);

  const savePalmData = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/save-palm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationTimestamp: new Date().toISOString(),
          deviceId: "palm_scanner_001",
          palmData: "encrypted_palm_template_data",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTimeout(() => {
          onComplete();
          handleClose();
        }, 2000);
      } else {
        console.error("❌ Failed to save palm data:", result.error);
        // Use vanilla SweetAlert2 to avoid z-index issues
        MySwal.fire({
          title: "💾 Save Error",
          text: result.error || "Failed to save palm data to database",
          icon: "error",
          zIndex: 999999,
          backdrop: true,
        });
      }
    } catch (error) {
      console.error("❌ Error saving palm data:", error);
      MySwal.fire({
        title: "🚫 Database Error",
        text: "Failed to connect to database server",
        icon: "error",
        zIndex: 999999,
        backdrop: true,
      });
    }
  };

  const handleStartRegistration = async () => {
    if (user) {
      if (!state.isConnected) {
        MySwal.fire({
          title: "🔌 Connection Required",
          text: "Please connect to the palm device first",
          icon: "warning",
          confirmButtonText: "Connect Now",
          zIndex: 999999,
          backdrop: true,
        }).then((result: any) => {
          if (result.isConfirmed) {
            connect();
          }
        });
        return;
      }

      // Use user name as user_id for the palm system
      await startRegistration(user.name);
    }
  };

  const handleClose = () => {
    cancelRegistration();
    reset();
    setProgress(0);
    onClose();
  };

  const handleRetryConnection = () => {
    connect();
  };

  const getStatusIcon = () => {
    switch (state.currentStep) {
      case "connecting":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case "entering_mode":
        return <Settings className="h-8 w-8 animate-pulse text-orange-500" />;
      case "waiting_for_palm":
        return <Hand className="h-8 w-8 animate-bounce text-blue-500" />;
      case "processing":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Hand className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (state.isConnecting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      );
    }

    if (!state.isConnected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    }

    switch (state.currentStep) {
      case "entering_mode":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Settings className="h-3 w-3 animate-spin" />
            Preparing Scanner...
          </Badge>
        );
      case "waiting_for_palm":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 animate-pulse bg-blue-500"
          >
            <Hand className="h-3 w-3" />
            Scanning Palm...
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing...
          </Badge>
        );
      case "success":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-500"
          >
            <CheckCircle className="h-3 w-3" />
            Registration Complete!
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            Ready
          </Badge>
        );
    }
  };

  const getInstructions = () => {
    switch (state.currentStep) {
      case "connecting":
        return "Establishing connection to palm scanner...";
      case "entering_mode":
        return "Preparing scanner for registration mode...";
      case "waiting_for_palm":
        return "Place your palm flat on both IR and RGB scanners";
      case "processing":
        return "Processing biometric data...";
      case "success":
        return "Registration completed successfully!";
      case "error":
        return state.error || "An error occurred";
      default:
        return state.isConnected
          ? "Ready to start palm registration"
          : "Connect to palm device to begin registration";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Palm Registration - MQTT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Registering palm for:
            </p>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Connection Status */}
          <div className="flex justify-center">{getStatusBadge()}</div>

          {/* Scanner Visual */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              {getStatusIcon()}
            </div>

            {/* Instructions */}
            <p className="text-sm text-center text-muted-foreground">
              {getInstructions()}
            </p>

            {/* Connection Info */}
            {state.isConnected && (
              <div className="text-center">
                <p className="text-xs text-green-600">
                  📡 Connected to {process.env.NEXT_PUBLIC_MQTT_BROKER_ADDRESS}:
                  {process.env.NEXT_PUBLIC_MQTT_BROKER_PORT}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            {(state.currentStep === "waiting_for_palm" ||
              state.currentStep === "processing") && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              {/* Connection Status Actions */}
              {!state.isConnected && !state.isConnecting && (
                <Button onClick={handleRetryConnection} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Connect to Device
                </Button>
              )}

              {state.isConnecting && (
                <Button disabled className="flex-1">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </Button>
              )}

              {/* Registration Actions */}
              {state.currentStep === "idle" && state.isConnected && (
                <Button onClick={handleStartRegistration} className="flex-1">
                  <Hand className="h-4 w-4 mr-2" />
                  Start Palm Registration
                </Button>
              )}

              {(state.currentStep === "entering_mode" ||
                state.currentStep === "waiting_for_palm" ||
                state.currentStep === "processing") && (
                <Button
                  variant="outline"
                  onClick={cancelRegistration}
                  className="flex-1"
                >
                  Cancel Registration
                </Button>
              )}

              {(state.currentStep === "error" ||
                state.currentStep === "success") && (
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              )}
            </div>

            {/* Connection Attempts Info */}
            {state.connectionAttempts > 0 && !state.isConnected && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Connection attempts: {state.connectionAttempts}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
