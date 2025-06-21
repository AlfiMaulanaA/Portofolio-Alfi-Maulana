"use client";

import { useEffect, useState } from "react";

export function SystemInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Initialize auto-cleanup service
        await fetch("/api/system/init", { method: "POST" });

        // Test ZKTeco connection
        await fetch("/api/system/zkteco-test");

        setInitialized(true);
        console.log("✅ System initialized successfully");
      } catch (error) {
        console.error("❌ System initialization failed:", error);
        setInitialized(true); // Continue anyway
      }
    };

    initializeSystem();
  }, []);

  return null; // This component doesn't render anything
}
