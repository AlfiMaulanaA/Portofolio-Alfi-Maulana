"use client";
import { useState, useEffect, useCallback } from "react";

interface PalmImageUrls {
  rgbUrl: string;
  irUrl: string;
  lastUpdated: number;
}

export function usePalmImages() {
  const [imageUrls, setImageUrls] = useState<PalmImageUrls>({
    rgbUrl: "",
    irUrl: "",
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateImageUrls = useCallback(() => {
    const timestamp = Date.now();
    const serverIp =
      process.env.NEXT_PUBLIC_PALM_IMAGE_SERVER_IP || "192.168.1.235";
    const serverPort = process.env.NEXT_PUBLIC_PALM_IMAGE_SERVER_PORT || "8080";
    const rgbPath = process.env.NEXT_PUBLIC_PALM_RGB_IMAGE_PATH || "/1.rgb.png";
    const irPath = process.env.NEXT_PUBLIC_PALM_IR_IMAGE_PATH || "/1.ir.png";

    const baseUrl = `http://${serverIp}:${serverPort}`;

    return {
      rgbUrl: `${baseUrl}${rgbPath}?${timestamp}`,
      irUrl: `${baseUrl}${irPath}?${timestamp}`,
      lastUpdated: timestamp,
    };
  }, []);

  const refreshImages = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const newUrls = generateImageUrls();
      setImageUrls(newUrls);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to generate image URLs");
      setIsLoading(false);
    }
  }, [generateImageUrls]);

  useEffect(() => {
    // Initial load
    refreshImages();

    // Set up interval for auto-refresh
    const refreshInterval = Number.parseInt(
      process.env.NEXT_PUBLIC_PALM_IMAGE_REFRESH_INTERVAL || "50000"
    );

    const interval = setInterval(refreshImages, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshImages]);

  return {
    imageUrls,
    isLoading,
    error,
    refreshImages,
    lastUpdated: imageUrls.lastUpdated,
  };
}
