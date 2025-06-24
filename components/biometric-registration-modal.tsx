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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Fingerprint,
  CheckCircle,
  Loader2,
  Hand,
} from "lucide-react";
import { PalmRegistrationModal } from "./palm-registration-modal";
import { FaceRegistrationModal } from "./face-registration-modal";
import { useMqttZKTecoCommand } from "@/hooks/use-mqtt-zkteco-command";
import Swal from "sweetalert2";

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

// Finger mapping for better UX
const FINGER_OPTIONS = [
  { value: 1, label: "Right Thumb", hand: "right", finger: "thumb" },
  { value: 2, label: "Right Index", hand: "right", finger: "index" },
  { value: 3, label: "Right Middle", hand: "right", finger: "middle" },
  { value: 4, label: "Right Ring", hand: "right", finger: "ring" },
  { value: 5, label: "Right Pinky", hand: "right", finger: "pinky" },
  { value: 6, label: "Left Thumb", hand: "left", finger: "thumb" },
  { value: 7, label: "Left Index", hand: "left", finger: "index" },
  { value: 8, label: "Left Middle", hand: "left", finger: "middle" },
  { value: 9, label: "Left Ring", hand: "left", finger: "ring" },
  { value: 10, label: "Left Pinky", hand: "left", finger: "pinky" },
];

export function BiometricRegistrationModal({
  isOpen,
  onClose,
  onComplete,
  user,
  type,
}: BiometricRegistrationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<number>(1); // Default to right thumb
  const [registrationStep, setRegistrationStep] = useState<
    "select" | "processing" | "complete"
  >("select");
  const { state, registerFingerprint, registerCard } = useMqttZKTecoCommand();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRegistrationStep("select");
      setSelectedFinger(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Listen for successful registration
  useEffect(() => {
    if (state.lastResponse && state.lastResponse.Status === "success") {
      if (
        (type === "fingerprint" && state.lastResponse.Mode === "register_fp") ||
        (type === "card" && state.lastResponse.Mode === "register_card")
      ) {
        setIsProcessing(false);
        setRegistrationStep("complete");
        setTimeout(() => {
          onComplete();
          handleClose();
        }, 3000);
      }
    }
  }, [state.lastResponse, type, onComplete]);

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
    if (registrationStep === "select") {
      switch (type) {
        case "card":
          return "Click register and then tap your card on the ZKTeco device";
        case "fingerprint":
          return "Select which finger to register, then click start registration";
        default:
          return "Follow the instructions";
      }
    } else if (registrationStep === "processing") {
      switch (type) {
        case "card":
          return "Tap your card on the ZKTeco device now";
        case "fingerprint":
          const selectedFingerInfo = FINGER_OPTIONS.find(
            (f) => f.value === selectedFinger
          );
          return `Place your ${selectedFingerInfo?.label.toLowerCase()} on the ZKTeco device scanner`;
        default:
          return "Follow device instructions";
      }
    } else {
      return "Registration completed successfully!";
    }
  };

  const handleRegistration = async () => {
    if (!user?.zkteco_uid) {
      Swal.fire({
        title: "Error",
        text: "User is not registered in ZKTeco system",
        icon: "error",
      });
      return;
    }

    if (!state.isConnected) {
      Swal.fire({
        title: "Connection Error",
        text: "MQTT connection is not available. Please check connection.",
        icon: "error",
      });
      return;
    }

    setIsProcessing(true);
    setRegistrationStep("processing");

    try {
      let success = false;

      if (type === "fingerprint") {
        success = registerFingerprint(user.zkteco_uid, selectedFinger);

        // Show finger-specific instruction
        const selectedFingerInfo = FINGER_OPTIONS.find(
          (f) => f.value === selectedFinger
        );
        Swal.fire({
          title: "Fingerprint Registration Started",
          html: `
            <div class="text-center">
              <div class="mb-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
                  <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-10.377-6.61 1 1 0 11-1.998-.735zM4.662 4.959A1 1 0 014.75 6.37 6 6 0 006 17.97a1 1 0 11-1.993-.24A8 8 0 013.318 5.74a1 1 0 011.344-.781zM10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 10a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p><strong>Finger:</strong> ${selectedFingerInfo?.label}</p>
              <p class="text-sm text-gray-600 mt-2">Please place your <strong>${selectedFingerInfo?.label.toLowerCase()}</strong> on the ZKTeco device scanner and follow the device instructions.</p>
            </div>
          `,
          icon: "info",
          timer: 5000,
          showConfirmButton: false,
        });
      } else if (type === "card") {
        success = registerCard(user.zkteco_uid);

        Swal.fire({
          title: "Card Registration Started",
          text: "Please tap your card on the ZKTeco device now.",
          icon: "info",
          timer: 3000,
          showConfirmButton: false,
        });
      }

      if (success) {
        // Set timeout to reset processing state if no response
        setTimeout(() => {
          if (registrationStep === "processing") {
            setIsProcessing(false);
            setRegistrationStep("select");
            Swal.fire({
              title: "Registration Timeout",
              text: "No response from device. Please try again.",
              icon: "warning",
            });
          }
        }, 30000); // 30 seconds timeout
      } else {
        setIsProcessing(false);
        setRegistrationStep("select");
        Swal.fire({
          title: "Command Failed",
          text: "Failed to send registration command to device.",
          icon: "error",
        });
      }
    } catch (error) {
      setIsProcessing(false);
      setRegistrationStep("select");
      console.error("Registration error:", error);
      Swal.fire({
        title: "Error",
        text: "An error occurred during registration.",
        icon: "error",
      });
    }
  };

  const handleClose = () => {
    setIsProcessing(false);
    setRegistrationStep("select");
    setSelectedFinger(1);
    onClose();
  };

  const handleBack = () => {
    setIsProcessing(false);
    setRegistrationStep("select");
  };

  if (!user || !type) return null;

  // Check if user has ZKTeco UID
  if (!user.zkteco_uid) {
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
            <p className="text-xs text-muted-foreground">
              ZKTeco UID: {user.zkteco_uid}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Visual Indicator */}
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              {registrationStep === "processing" ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : registrationStep === "complete" ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                getIcon()
              )}
            </div>

            {/* Finger Selection for Fingerprint */}
            {type === "fingerprint" && registrationStep === "select" && (
              <div className="w-full space-y-2">
                <Label htmlFor="finger-select">Select Finger</Label>
                <Select
                  value={selectedFinger.toString()}
                  onValueChange={(value) =>
                    setSelectedFinger(Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="finger-select">
                    <SelectValue placeholder="Choose finger to register" />
                  </SelectTrigger>
                  <SelectContent>
                    {FINGER_OPTIONS.map((finger) => (
                      <SelectItem
                        key={finger.value}
                        value={finger.value.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <Hand
                            className={`h-4 w-4 ${
                              finger.hand === "left" ? "scale-x-[-1]" : ""
                            }`}
                          />
                          {finger.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected Finger Display during Processing */}
            {type === "fingerprint" && registrationStep === "processing" && (
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  {
                    FINGER_OPTIONS.find((f) => f.value === selectedFinger)
                      ?.label
                  }
                </Badge>
              </div>
            )}

            <p className="text-sm text-center text-muted-foreground">
              {getInstructions()}
            </p>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  state.isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                MQTT {state.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Current Status */}
            {state.currentStatus && registrationStep === "processing" && (
              <Badge variant="secondary" className="text-xs">
                {state.currentStatus}
              </Badge>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              {registrationStep === "select" && (
                <Button
                  onClick={handleRegistration}
                  className="w-full"
                  disabled={isProcessing || !state.isConnected}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    `Start ${
                      type === "card" ? "Card" : "Fingerprint"
                    } Registration`
                  )}
                </Button>
              )}

              {registrationStep === "processing" && (
                <>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      Follow the instructions on the ZKTeco device to complete
                      registration.
                    </p>
                  </div>
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Registration
                  </Button>
                </>
              )}

              {registrationStep === "complete" && (
                <div className="text-center">
                  <Badge variant="default" className="bg-green-500 mb-2">
                    Registration Complete!
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Modal will close automatically...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BiometricRegistrationModal;
