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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Fingerprint, CheckCircle } from "lucide-react";
import { PalmRegistrationModal } from "./palm-registration-modal";
import { FaceRegistrationModal } from "./face-registration-modal";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface User {
  id: number;
  name: string;
  email: string;
  zkteco_uid?: number | null;
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
  const [cardNumber, setCardNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use specialized modals for palm and face
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

  if (type === "face") {
    return (
      <FaceRegistrationModal
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
      default:
        return "Biometric Registration";
    }
  };

  const getInstructions = () => {
    switch (type) {
      case "card":
        return "Enter card number and register to ZKTeco device";
      case "fingerprint":
        return "Enroll fingerprint to ZKTeco device";
      default:
        return "Follow the instructions";
    }
  };

  const startCardRegistration = async () => {
    if (!cardNumber || !/^\d{8,10}$/.test(cardNumber)) {
      MySwal.fire({
        title: "Invalid Card Number",
        text: "Please enter a valid 8-10 digit card number",
        icon: "error",
      });
      return;
    }

    setIsLoading(true);
    setStatus("processing");

    try {
      const response = await fetch("/api/zkteco/register-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          cardNumber: cardNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("complete");
        MySwal.fire({
          title: "Success!",
          text: "Card registered successfully",
          icon: "success",
          timer: 2000,
        });
        setTimeout(() => {
          onComplete();
          handleClose();
        }, 2000);
      } else {
        setStatus("error");
        MySwal.fire({
          title: "Registration Failed",
          text: result.error || "Failed to register card",
          icon: "error",
        });
      }
    } catch (error) {
      setStatus("error");
      MySwal.fire({
        title: "Error",
        text: "Network error during card registration",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startFingerprintRegistration = async () => {
    setIsLoading(true);
    setStatus("scanning");
    setProgress(0);

    try {
      // Start fingerprint enrollment
      const response = await fetch("/api/zkteco/enroll-fingerprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          fingerIndex: 1,
          mode: "register",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Simulate progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + Math.random() * 10;
          });
        }, 500);

        // Show instruction to user
        MySwal.fire({
          title: "Fingerprint Enrollment",
          text: "Please place your finger on the ZKTeco device scanner and follow the device instructions",
          icon: "info",
          showConfirmButton: true,
          confirmButtonText: "Complete Enrollment",
          allowOutsideClick: false,
        }).then(async (enrollResult) => {
          if (enrollResult.isConfirmed) {
            // Complete the enrollment
            try {
              const saveResponse = await fetch(
                "/api/zkteco/enroll-fingerprint",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: user?.id,
                    fingerIndex: 1,
                    mode: "save",
                  }),
                }
              );

              const saveResult = await saveResponse.json();

              if (saveResult.success) {
                setProgress(100);
                setStatus("complete");
                MySwal.fire({
                  title: "Success!",
                  text: "Fingerprint enrolled successfully",
                  icon: "success",
                  timer: 2000,
                });
                setTimeout(() => {
                  onComplete();
                  handleClose();
                }, 2000);
              } else {
                setStatus("error");
                MySwal.fire({
                  title: "Enrollment Failed",
                  text: saveResult.error || "Failed to save fingerprint",
                  icon: "error",
                });
              }
            } catch (error) {
              setStatus("error");
              MySwal.fire({
                title: "Error",
                text: "Failed to complete fingerprint enrollment",
                icon: "error",
              });
            }
          }
        });
      } else {
        setStatus("error");
        MySwal.fire({
          title: "Enrollment Failed",
          text: result.error || "Failed to start fingerprint enrollment",
          icon: "error",
        });
      }
    } catch (error) {
      setStatus("error");
      MySwal.fire({
        title: "Error",
        text: "Network error during fingerprint enrollment",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProgress(0);
    setStatus("idle");
    setCardNumber("");
    setIsLoading(false);
    onClose();
  };

  if (!user || !type) return null;

  // Check if user has ZKTeco UID
  if (!user.zkteco_uid && (type === "card" || type === "fingerprint")) {
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
                Registration for:
              </p>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-center text-red-600">
              <p className="font-medium">ZKTeco Registration Required</p>
              <p className="text-sm">
                This user is not registered in the ZKTeco system. Please contact
                administrator.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            {user.zkteco_uid && (
              <p className="text-xs text-muted-foreground">
                ZKTeco UID: {user.zkteco_uid}
              </p>
            )}
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

                {type === "card" && (
                  <div className="w-full space-y-2">
                    <Label htmlFor="cardNumber">
                      Card Number (8-10 digits)
                    </Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Enter card number"
                      pattern="\d{8,10}"
                    />
                  </div>
                )}

                <Button
                  onClick={
                    type === "card"
                      ? startCardRegistration
                      : startFingerprintRegistration
                  }
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Processing..."
                    : `Start ${
                        type === "card" ? "Card" : "Fingerprint"
                      } Registration`}
                </Button>
              </>
            )}

            {(status === "scanning" || status === "processing") && (
              <>
                <div className="w-32 h-32 rounded-lg border-2 border-primary flex items-center justify-center animate-pulse">
                  {getIcon()}
                </div>
                {type === "fingerprint" && (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}
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

            {status === "error" && (
              <>
                <div className="w-32 h-32 rounded-lg border-2 border-red-500 flex items-center justify-center bg-red-50">
                  <div className="h-8 w-8 text-red-500">❌</div>
                </div>
                <Badge variant="destructive">Registration Failed</Badge>
                <Button
                  onClick={() => setStatus("idle")}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BiometricRegistrationModal;
