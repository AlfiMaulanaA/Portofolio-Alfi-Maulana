"use client";

import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useMqttPalm } from "@/hooks/use-mqtt-palm";

export function MqttStatusIndicator() {
  const { state } = useMqttPalm();

  if (state.isConnecting) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge
      variant={state.isConnected ? "default" : "destructive"}
      className="flex items-center gap-1"
    >
      {state.isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Palm Device Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Palm Device Offline
        </>
      )}
    </Badge>
  );
}
