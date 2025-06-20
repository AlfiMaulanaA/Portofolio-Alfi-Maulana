"use client";

import { useEffect } from "react";
import AutoCleanupService from "@/lib/auto-cleanup";

export function AutoCleanupInitializer() {
  useEffect(() => {
    // Start auto cleanup service when app loads
    const cleanupService = AutoCleanupService.getInstance();
    cleanupService.startAutoCleanup();

    // Cleanup on unmount
    return () => {
      cleanupService.stopAutoCleanup();
    };
  }, []);

  return null; // This component doesn't render anything
}
