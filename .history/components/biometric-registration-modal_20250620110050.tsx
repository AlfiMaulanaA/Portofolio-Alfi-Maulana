"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Fingerprint,
  Hand,
  Camera,
  CheckCircle,
} from "lucide-react";
import { PalmRegistrationModal } from "./palm-registration-modal";

// Update interface User untuk menggunakan number ID
interface User {
  id: number; // Pastikan ini number, bukan string
  name: string;
  email: string;
}

interface BiometricRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user: User | null;
  type: "card" | "fingerprint" | "palm" | "face" | null;
}

export function BiometricRegistrationModal({
  isOpen,
  onClose,
  onComplete,
  user,
  type,
}: BiometricRegistrationModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "scanning" | "processing" | "complete" | "error"
  >("idle");

  if (type === "palm") {
    return (
      <PalmRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onComplete={onComplete}
        user={user}
      />
    );
  }

  const getIcon = () => {
    switch (type) {
      case "card":
        return <CreditCard className="h-8 w-8" />;
      case "fingerprint":
        return <Fingerprint className="h-8 w-8" />;
      case "palm":
        return <Hand className="h-8 w-8" />;
      case "face":
        return <Camera className="h-8 w-8" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "card":
        return "Card Registration";
      case "fingerprint":
        return "Fingerprint Registration";
      case "palm":
        return "Palm Registration";
      case "face":
        return "Face Registration";
      default:
        return "Biometric Registration";
    }
  };

  const getInstructions = () => {
    switch (type) {
      case "card":
        return "Please tap your card on the reader";
      case "fingerprint":
        return "Place your finger on the scanner";
      case "palm":
        return "Place your palm flat on the scanner";
      case "face":
        return "Look directly at the camera";
      default:
        return "Follow the instructions";
    }
  };

  const startRegistration = () => {
    setStatus("scanning");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus("processing");
          setTimeout(() => {
            setStatus("complete");
            setTimeout(() => {
              onComplete();
              handleClose();
            }, 1500);
          }, 1000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const handleClose = () => {
    setProgress(0);
    setStatus("idle");
    onClose();
  };

  if (!user || !type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Registering for:
            </p>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {status === "idle" && (
              <>
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  {getIcon()}
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {getInstructions()}
                </p>
                <Button onClick={startRegistration} className="w-full">
                  Start Registration
                </Button>
              </>
            )}

            {(status === "scanning" || status === "processing") && (
              <>
                <div className="w-32 h-32 rounded-lg border-2 border-primary flex items-center justify-center animate-pulse">
                  {getIcon()}
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
                <Badge variant="secondary">
                  {status === "scanning" ? "Scanning..." : "Processing..."}
                </Badge>
              </>
            )}

            {status === "complete" && (
              <>
                <div className="w-32 h-32 rounded-lg border-2 border-green-500 flex items-center justify-center bg-green-50">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Badge variant="default" className="bg-green-500">
                  Registration Complete!
                </Badge>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
