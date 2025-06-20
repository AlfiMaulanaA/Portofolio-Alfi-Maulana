"use client";

import { useEffect, useState } from "react";

export function SystemInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeSystem = async () => {
      if (initialized) return;

      try {
        const response = await fetch("/api/system/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (result.success) {
          setInitialized(true);
        } else {
          console.error(
            "❌ Failed to initialize system services:",
            result.error
          );
        }
      } catch (error) {
        console.error("❌ Error initializing system services:", error);
      }
    };

    // Initialize system services when component mounts
    initializeSystem();
  }, [initialized]);

  return null; // This component doesn't render anything
}
