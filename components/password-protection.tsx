"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";

interface PasswordProtectionProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function PasswordProtection({
  isOpen,
  onSuccess,
  onCancel,
  title = "Admin Access Required",
  description = "Enter admin password to access User Management",
}: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const ADMIN_PASSWORD = "admin123";
  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 30; // seconds

  // Handle lockout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLocked && lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, lockTimeRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError(
        `Too many failed attempts. Try again in ${lockTimeRemaining} seconds.`
      );
      return;
    }

    if (password === ADMIN_PASSWORD) {
      // Success - Show loading state before calling onSuccess
      setError("");
      setAttempts(0);

      // Show brief success message
      setPassword("");

      // Call success callback after brief delay
      setTimeout(() => {
        onSuccess();
      }, 100);
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimeRemaining(LOCK_DURATION);
        setError(
          `Too many failed attempts. Access locked for ${LOCK_DURATION} seconds.`
        );
      } else {
        setError(
          `Incorrect password. ${
            MAX_ATTEMPTS - newAttempts
          } attempts remaining.`
        );
      }

      setPassword("");
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    setAttempts(0);
    setIsLocked(false);
    setLockTimeRemaining(0);
    onCancel();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError("");
      // Don't reset attempts and lock state when reopening
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  disabled={isLocked}
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!password.trim() || isLocked}
              >
                {isLocked
                  ? `Locked (${lockTimeRemaining}s)`
                  : password === ADMIN_PASSWORD && password.length > 0
                  ? "✓ Access"
                  : "Access"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Attempts: {attempts}/{MAX_ATTEMPTS}
            </p>
            {attempts > 0 && !isLocked && (
              <p className="text-xs text-orange-600 mt-1">
                Warning: Account will be temporarily locked after {MAX_ATTEMPTS}{" "}
                failed attempts
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
