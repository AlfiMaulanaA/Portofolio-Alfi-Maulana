"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hand,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { usePalmVeinUsers } from "@/hooks/use-palm-vein-users";
import { PalmRegistrationModal } from "@/components/palm-registration-modal";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface PalmVeinUser {
  id: number;
  name: string;
  email?: string;
  department?: string;
  palm_registered: boolean;
  created_at?: string;
  updated_at?: string;
}

export function PalmVeinUsersTable() {
  const { users, loading, error, lastFetch, fetchUsers } = usePalmVeinUsers();
  const [selectedUser, setSelectedUser] = useState<PalmVeinUser | null>(null);
  const [isPalmModalOpen, setIsPalmModalOpen] = useState(false);

  const handleRefresh = async () => {
    MySwal.fire({
      title: "Refreshing...",
      text: "Fetching latest Palm Vein users data",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await fetchUsers();
    MySwal.close();
  };

  const handleRegisterPalm = (user: PalmVeinUser) => {
    if (user.palm_registered) {
      MySwal.fire({
        title: "Already Registered",
        text: "This user already has palm vein registered",
        icon: "info",
      });
      return;
    }

    setSelectedUser(user);
    setIsPalmModalOpen(true);
  };

  const handlePalmRegistrationComplete = () => {
    setIsPalmModalOpen(false);
    setSelectedUser(null);

    // Show success message
    MySwal.fire({
      title: "Palm Registration Complete!",
      text: "Palm vein has been registered successfully",
      icon: "success",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });

    // Refresh data after a short delay
    setTimeout(() => {
      fetchUsers();
    }, 1000);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Palm Vein API Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 mb-2">
                <strong>Connection Failed:</strong>
              </p>
              <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                {error}
              </p>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              <p>Please check:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Palm Vein API server is running</li>
                <li>
                  Network connectivity to {process.env.PALM_VEIN_API_BASE_URL}
                </li>
                <li>API endpoint is accessible</li>
              </ul>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-green-600" />
              Palm Vein Users
              <Badge variant="outline" className="ml-2">
                {users.length} users
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Read Only
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastFetch && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {lastFetch.toLocaleTimeString()}
                </div>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">
                Loading Palm Vein users...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Connecting to Palm Vein API...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Hand className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No Palm Vein users found</p>
              <p className="text-xs text-muted-foreground mt-2">
                The Palm Vein API returned an empty list
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>Palm Vein System:</strong> Data is read-only from
                    external API. You can only register palm vein for users.
                  </p>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Palm Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-sm">{user.id}</td>
                        <td className="p-2 font-medium">{user.name}</td>
                        <td className="p-2 text-muted-foreground">
                          {user.email || "N/A"}
                        </td>
                        <td className="p-2">{user.department || "N/A"}</td>
                        <td className="p-2">
                          <Badge
                            variant={
                              user.palm_registered ? "default" : "outline"
                            }
                          >
                            {user.palm_registered ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Registered
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Registered
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant={
                              user.palm_registered ? "outline" : "default"
                            }
                            onClick={() => handleRegisterPalm(user)}
                            disabled={user.palm_registered}
                          >
                            {user.palm_registered ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Registered
                              </>
                            ) : (
                              <>
                                <Hand className="h-3 w-3 mr-1" />
                                Register Palm
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                <div>
                  Total: {users.length} users | Registered:{" "}
                  {users.filter((u) => u.palm_registered).length} | Not
                  Registered: {users.filter((u) => !u.palm_registered).length}
                </div>
                <div>Source: Palm Vein API</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Palm Registration Modal */}
      <PalmRegistrationModal
        isOpen={isPalmModalOpen}
        onClose={() => setIsPalmModalOpen(false)}
        onComplete={handlePalmRegistrationComplete}
        user={selectedUser}
      />
    </>
  );
}
