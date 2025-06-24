"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DiagnosticsData {
  pythonAvailable: boolean;
  scriptsExist: boolean;
  deviceReachable: boolean;
  dependenciesInstalled: boolean;
  errors: string[];
  details: {
    deviceIp: string;
    devicePort: number;
    timeout: number;
    scriptsPath: string;
    missingScripts: string[];
    connectionResult: any;
  };
}

export function ZKTecoDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setError(null);
    setDiagnostics(null);

    try {
      const response = await fetch("/api/system/zkteco-diagnose");
      const result = await response.json();

      if (result.success) {
        setDiagnostics(result.data.data);
      } else {
        setError(result.error || "Failed to run diagnostics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge
        variant={status ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          ZKTeco System Diagnostics
        </CardTitle>
        <CardDescription>
          Run comprehensive diagnostics to identify ZKTeco integration issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Diagnostics
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagnostics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {getStatusBadge(diagnostics.pythonAvailable, "Python Available")}
              {getStatusBadge(diagnostics.scriptsExist, "Scripts Exist")}
              {getStatusBadge(diagnostics.deviceReachable, "Device Reachable")}
              {getStatusBadge(
                diagnostics.dependenciesInstalled,
                "Dependencies OK"
              )}
            </div>

            {diagnostics.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Issues Found:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {diagnostics.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">System Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  Device IP: <code>{diagnostics.details.deviceIp}</code>
                </div>
                <div>
                  Device Port: <code>{diagnostics.details.devicePort}</code>
                </div>
                <div>
                  Timeout: <code>{diagnostics.details.timeout}s</code>
                </div>
                <div>
                  Scripts Path:{" "}
                  <code className="text-xs">
                    {diagnostics.details.scriptsPath}
                  </code>
                </div>
              </div>

              {diagnostics.details.missingScripts.length > 0 && (
                <div className="mt-2">
                  <div className="text-red-600 font-medium">
                    Missing Scripts:
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {diagnostics.details.missingScripts.map((script, index) => (
                      <li key={index}>{script}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnostics.details.connectionResult && (
                <div className="mt-2">
                  <div className="font-medium">Connection Test Result:</div>
                  <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(
                      diagnostics.details.connectionResult,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
