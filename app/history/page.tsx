"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Search,
  Download,
  Hand,
  Camera,
  Fingerprint,
  CreditCard,
  Loader2,
} from "lucide-react";
import { SystemStatusIndicator } from "@/components/system-status-indicator";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface HistoryEntry {
  id: number;
  user_id: number | null;
  user_name: string;
  recognition_type: "palm" | "face" | "fingerprint" | "card";
  result: "success" | "failed" | "unknown";
  confidence: number;
  location: string;
  device_id: string | null;
  timestamp: string;
}

interface HistoryStats {
  total: number;
  successRate: number;
  palmScans: number;
  faceScans: number;
}

export default function HistoryLog() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    total: 0,
    successRate: 0,
    palmScans: 0,
    faceScans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  // Fetch history from API
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/history");
      const result = await response.json();

      if (result.success) {
        setHistory(result.data);
        setStats(result.stats);
        setFilteredHistory(result.data);
      } else {
        MySwal.fire({
          title: "Error",
          text: result.error || "Failed to fetch history",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      MySwal.fire({
        title: "Error",
        text: "Failed to connect to server",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on search and filters
  useEffect(() => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (entry) => entry.recognition_type === typeFilter
      );
    }

    if (resultFilter !== "all") {
      filtered = filtered.filter((entry) => entry.result === resultFilter);
    }

    setFilteredHistory(filtered);
  }, [history, searchTerm, typeFilter, resultFilter]);

  // Load history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "palm":
        return <Hand className="h-4 w-4" />;
      case "face":
        return <Camera className="h-4 w-4" />;
      case "fingerprint":
        return <Fingerprint className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "unknown":
        return <Badge variant="secondary">Unknown</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const exportHistory = () => {
    const csvContent = [
      ["Timestamp", "User", "Type", "Result", "Confidence", "Location"],
      ...filteredHistory.map((entry) => [
        new Date(entry.timestamp).toISOString(),
        entry.user_name,
        entry.recognition_type,
        entry.result,
        entry.confidence.toString(),
        entry.location,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biometric-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h1 className="text-lg font-semibold">History Log</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading history...</span>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h1 className="text-lg font-semibold">
            History Log & System Management
          </h1>
        </div>
        <div className="ml-auto">
          <Button onClick={exportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* System Management Section - Full Width */}
        <SystemStatusIndicator />

        {/* History Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Attempts
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Recognition accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palm Scans</CardTitle>
              <Hand className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.palmScans}</div>
              <p className="text-xs text-muted-foreground">
                Total palm recognitions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Face Scans</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.faceScans}</div>
              <p className="text-xs text-muted-foreground">
                Total face recognitions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recognition History</CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="palm">Palm</SelectItem>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="fingerprint">Fingerprint</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Result</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {new Date(entry.timestamp).toLocaleDateString()}{" "}
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2 font-medium">{entry.user_name}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(entry.recognition_type)}
                          <span className="capitalize">
                            {entry.recognition_type}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">{getResultBadge(entry.result)}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.confidence}%
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {entry.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No entries found matching your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
