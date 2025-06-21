"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Clock } from "lucide-react";
import { usePalmImages } from "@/hooks/use-palm-images";

interface PalmImageViewerProps {
  title: string;
  type: "rgb" | "ir";
  className?: string;
}

export function PalmImageViewer({
  title,
  type,
  className = "",
}: PalmImageViewerProps) {
  const { imageUrls, isLoading, error, refreshImages, lastUpdated } =
    usePalmImages();
  const [imageError, setImageError] = useState(false);

  const imageUrl = type === "rgb" ? imageUrls.rgbUrl : imageUrls.irUrl;
  const badgeColor = type === "rgb" ? "bg-blue-500" : "bg-red-500 text-white";
  const badgeText = type === "rgb" ? "RGB" : "IR";

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={badgeColor}>
              {badgeText}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshImages}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video rounded-lg bg-black overflow-hidden">
          {error || imageError ? (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                <p className="text-sm">Failed to load image</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={refreshImages}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={`${type.toUpperCase()} Palm Scanner`}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
                key={imageUrl} // Force re-render when URL changes
              />
              <div className="absolute top-3 right-3">
                <Badge variant="destructive" className="animate-pulse">
                  ● LIVE
                </Badge>
              </div>
              {isLoading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
