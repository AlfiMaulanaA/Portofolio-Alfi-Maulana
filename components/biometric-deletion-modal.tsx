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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useMqttZKTecoCommand } from "@/hooks/use-mqtt-zkteco-command";
import Swal from "sweetalert2";

interface User {
  id: number;
  name: string;
  email: string;
  zkteco_uid?: number | null;
  palm_registered?: boolean;
  card_registered?: boolean;
  fingerprint_registered?: boolean;
  face_registered?: boolean;
}

interface BiometricDeletionModalProps {
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

export function BiometricDeletionModal({
  isOpen,
  onClose,
  onComplete,
  user,
  type,
}: BiometricDeletionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<number>(1);
  const [deletionStep, setDeletionStep] = useState<
    "confirm" | "processing" | "complete"
  >("confirm");
  const { state, deleteFingerprint, deleteCard, deletePalm } =
    useMqttZKTecoCommand();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDeletionStep("confirm");
      setSelectedFinger(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Listen for successful deletion
  useEffect(() => {
    if (state.lastResponse && state.lastResponse.Status === "success") {
      if (
        (type === "fingerprint" && state.lastResponse.Mode === "delete_fp") ||
        (type === "card" && state.lastResponse.Mode === "delete_card")
      ) {
        setIsProcessing(false);
        setDeletionStep("complete");

        setTimeout(() => {
          onComplete();
          handleClose();
        }, 2500);
      }
    }
  }, [state.lastResponse, type, onComplete]);

  const getIcon = () => {
    switch (type) {
      case "card":
        return <CreditCard className="h-8 w-8 text-red-500" />;
      case "fingerprint":
        return <Fingerprint className="h-8 w-8 text-red-500" />;
      case "palm":
        return <Hand className="h-8 w-8 text-red-500" />;
      case "face":
        return <CheckCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Trash2 className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "card":
        return "Delete Card Registration";
      case "fingerprint":
        return "Delete Fingerprint Registration";
      case "palm":
        return "Delete Palm Registration";
      case "face":
        return "Delete Face Registration";
      default:
        return "Delete Biometric Registration";
    }
  };

  const getWarningMessage = () => {
    switch (type) {
      case "card":
        return "This will permanently remove the card registration from the ZKTeco device.";
      case "fingerprint":
        return "This will permanently remove the fingerprint template from the ZKTeco device.";
      case "palm":
        return "This will permanently remove the palm vein data from the palm recognition system.";
      case "face":
        return "This will permanently remove the face template from the face recognition system.";
      default:
        return "This will permanently remove the biometric data.";
    }
  };

  const isRegistered = () => {
    switch (type) {
      case "card":
        return user?.card_registered;
      case "fingerprint":
        return user?.fingerprint_registered;
      case "palm":
        return user?.palm_registered;
      case "face":
        return user?.face_registered;
      default:
        return false;
    }
  };

  const handleDeletion = async () => {
    if (!user) return;

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to delete <strong>${type}</strong> registration for:</p>
          <p class="font-medium">${user.name}</p>
          <p class="text-sm text-gray-600">${user.email}</p>
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-sm text-red-800">${getWarningMessage()}</p>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setDeletionStep("processing");

    try {
      let success = false;

      if (type === "fingerprint") {
        if (!user.zkteco_uid) {
          throw new Error("User is not registered in ZKTeco system");
        }
        success = await deleteFingerprint(user.zkteco_uid, selectedFinger);
      } else if (type === "card") {
        if (!user.zkteco_uid) {
          throw new Error("User is not registered in ZKTeco system");
        }
        success = await deleteCard(user.zkteco_uid);
      } else if (type === "palm") {
        success = await deletePalm(user.id.toString());
      } else if (type === "face") {
        // Face deletion via API
        const response = await fetch(
          `/api/users/${user.id}/register-biometric`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "face" }),
          }
        );

        const result = await response.json();
        success = result.success;

        if (success) {
          Swal.fire({
            title: "Face Deleted!",
            text: "Face registration has been deleted successfully.",
            icon: "success",
            timer: 3000,
          });
        } else {
          throw new Error(result.error || "Failed to delete face registration");
        }
      }

      if (success) {
        if (type === "palm" || type === "face") {
          // For palm and face, we handle success immediately
          setIsProcessing(false);
          setDeletionStep("complete");
          setTimeout(() => {
            onComplete();
            handleClose();
          }, 2500);
        }
        // For fingerprint and card, success is handled by the MQTT response listener
      } else {
        setIsProcessing(false);
        setDeletionStep("confirm");
        Swal.fire({
          title: "Deletion Failed",
          text: `Failed to delete ${type} registration.`,
          icon: "error",
        });
      }
    } catch (error) {
      setIsProcessing(false);
      setDeletionStep("confirm");
      console.error("Deletion error:", error);
      Swal.fire({
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "An error occurred during deletion.",
        icon: "error",
      });
    }
  };

  const handleClose = () => {
    setIsProcessing(false);
    setDeletionStep("confirm");
    setSelectedFinger(1);
    onClose();
  };

  if (!user || !type) return null;

  // Check if biometric is registered
  if (!isRegistered()) {
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
              <p className="text-sm text-muted-foreground mb-2">User:</p>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-center text-orange-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Not Registered</p>
              <p className="text-sm">
                This user doesn't have {type} registration to delete.
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
            <p className="text-sm text-muted-foreground mb-2">Deleting for:</p>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.zkteco_uid && (
              <p className="text-xs text-muted-foreground">
                ZKTeco UID: {user.zkteco_uid}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Visual Indicator */}
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-red-200 flex items-center justify-center bg-red-50">
              {deletionStep === "processing" ? (
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              ) : deletionStep === "complete" ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                getIcon()
              )}
            </div>

            {/* Finger Selection for Fingerprint */}
            {type === "fingerprint" && deletionStep === "confirm" && (
              <div className="w-full space-y-2">
                <Label htmlFor="finger-select">Select Finger to Delete</Label>
                <Select
                  value={selectedFinger.toString()}
                  onValueChange={(value) =>
                    setSelectedFinger(Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="finger-select">
                    <SelectValue placeholder="Choose finger to delete" />
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

            {/* Warning Message */}
            {deletionStep === "confirm" && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{getWarningMessage()}</p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {deletionStep === "processing" && (
              <p className="text-sm text-center text-muted-foreground">
                Deleting {type} registration... Please wait.
              </p>
            )}

            {deletionStep === "complete" && (
              <p className="text-sm text-center text-green-600 font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)} registration
                deleted successfully!
              </p>
            )}

            {/* Connection Status for ZKTeco operations */}
            {(type === "fingerprint" || type === "card") && (
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
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              {deletionStep === "confirm" && (
                <>
                  <Button
                    onClick={handleDeletion}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={
                      isProcessing ||
                      ((type === "fingerprint" || type === "card") &&
                        !state.isConnected)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete {type.charAt(0).toUpperCase() + type.slice(1)}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              )}

              {deletionStep === "processing" && (
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  Processing...
                </Button>
              )}

              {deletionStep === "complete" && (
                <div className="text-center">
                  <Badge variant="default" className="bg-green-500 mb-2">
                    Deletion Complete!
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

export default BiometricDeletionModal;
