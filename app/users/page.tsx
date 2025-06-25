"use client";
import { useEffect } from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  CreditCard,
  Fingerprint,
  Hand,
  Camera,
  Edit,
  Trash2,
  Loader2,
  Shield,
  MoreVertical,
} from "lucide-react";
import { BiometricRegistrationModal } from "@/components/biometric-registration-modal";
import { PalmVeinUsersTable } from "@/components/palm-vein-users-table";
import { PasswordProtection } from "@/components/password-protection";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { BiometricDeletionModal } from "@/components/biometric-deletion-modal";

const MySwal = withReactContent(Swal);

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  status: "active" | "inactive";
  card_registered: boolean;
  fingerprint_registered: boolean;
  palm_registered: boolean;
  face_registered: boolean;
  zkteco_uid?: number | null;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
}

interface UserStats {
  total: number;
  active: number;
  palmRegistered: number;
  faceRegistered: number;
}

interface CreateUserData {
  name: string;
  email: string;
  department: string;
  status: "active" | "inactive";
}

export default function UserManagement() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    palmRegistered: 0,
    faceRegistered: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [registrationType, setRegistrationType] = useState<
    "card" | "fingerprint" | "palm" | "face" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Loading states for different operations
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<number | null>(null);

  // Deletion modal states
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [deletionUser, setDeletionUser] = useState<User | null>(null);
  const [deletionType, setDeletionType] = useState<
    "card" | "fingerprint" | "palm" | "face" | null
  >(null);

  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    department: "",
    status: "active",
  });
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);
  // Handle password authentication
  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordDialog(false);

    // Show access granted notification
    MySwal.fire({
      title: "🎉 Access Granted!",
      text: "Welcome to User Management System",
      icon: "success",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        container: "swal2-container-high-z",
      },
    });
  };

  const handlePasswordCancel = () => {
    // Redirect back to dashboard
    window.location.href = "/";
  };

  // Fetch users from API (silent refresh without loading indicators)
  const fetchUsers = async (showLoading = true) => {
    if (!isAuthenticated) return;

    try {
      if (showLoading) {
        setLoading(true);

        // Show loading toast only for initial load
        MySwal.fire({
          title: "Loading Users...",
          text: "Fetching user data from server",
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          customClass: {
            container: "swal2-container-high-z",
          },
          didOpen: () => {
            Swal.showLoading();
          },
        });
      }

      const response = await fetch("/api/users");
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        setStats(result.stats);

        if (showLoading) {
          // Show success message with user count only for initial load
          MySwal.fire({
            title: "✅ Data Loaded Successfully!",
            text: `Found ${result.data.length} users in the system`,
            icon: "success",
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
              container: "swal2-container-high-z",
            },
          });
        }
      } else {
        if (showLoading) {
          MySwal.fire({
            title: "Error",
            text: result.error || "Failed to fetch users",
            icon: "error",
            customClass: {
              container: "swal2-container-high-z",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (showLoading) {
        MySwal.fire({
          title: "Connection Error",
          text: "Failed to connect to server. Please check your connection.",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Create new user
  const createUser = async (userData: CreateUserData) => {
    if (isCreatingUser) return; // Prevent double submission

    try {
      setIsCreatingUser(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        MySwal.fire({
          title: "Success!",
          text: "User created successfully",
          icon: "success",
          timer: 2000,
          customClass: {
            container: "swal2-container-high-z",
          },
        });

        // Silent refresh without loading indicators
        await fetchUsers(false);

        setIsAddUserOpen(false);
        setFormData({ name: "", email: "", department: "", status: "active" });
      } else {
        MySwal.fire({
          title: "Error",
          text: result.error || "Failed to create user",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      MySwal.fire({
        title: "Error",
        text: "Failed to connect to server",
        icon: "error",
        customClass: {
          container: "swal2-container-high-z",
        },
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Update user
  const updateUser = async (
    userId: number,
    userData: Partial<CreateUserData>
  ) => {
    if (isUpdatingUser) return; // Prevent double submission

    try {
      setIsUpdatingUser(true);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        MySwal.fire({
          title: "Success!",
          text: "User updated successfully",
          icon: "success",
          timer: 2000,
          customClass: {
            container: "swal2-container-high-z",
          },
        });

        // Silent refresh without loading indicators
        await fetchUsers(false);

        setIsEditUserOpen(false);
        setEditingUser(null);
      } else {
        MySwal.fire({
          title: "Error",
          text: result.error || "Failed to update user",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      MySwal.fire({
        title: "Error",
        text: "Failed to connect to server",
        icon: "error",
        customClass: {
          container: "swal2-container-high-z",
        },
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Delete user with MQTT command for ZKTeco
  const deleteUser = async (userId: number, userName: string) => {
    if (isDeletingUser === userId) return; // Prevent double submission

    const user = users.find((u) => u.id === userId);

    const result = await MySwal.fire({
      title: "Are you sure?",
      html: `
        <div class="text-left space-y-3">
          <p>You are about to delete user: <strong>${userName}</strong></p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-800 font-medium">⚠️ This will permanently delete:</p>
            <ul class="text-sm text-red-700 mt-2 space-y-1">
              <li>• User from local database</li>
              ${user?.face_registered ? "<li>• Face recognition data</li>" : ""}
              ${user?.palm_registered ? "<li>• Palm vein data</li>" : ""}
              ${
                user?.zkteco_uid
                  ? "<li>• ZKTeco device user (UID: " +
                    user.zkteco_uid +
                    ")</li>"
                  : ""
              }
              ${user?.card_registered ? "<li>• Card registration</li>" : ""}
              ${
                user?.fingerprint_registered
                  ? "<li>• Fingerprint templates</li>"
                  : ""
              }
            </ul>
          </div>
          <p class="text-sm text-gray-600">This action cannot be undone!</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete everything!",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal2-container-high-z",
      },
    });

    if (result.isConfirmed) {
      try {
        setIsDeletingUser(userId);

        // Show progress dialog
        MySwal.fire({
          title: "Deleting User...",
          html: `
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p>Removing user from all systems...</p>
              <div class="text-sm text-gray-600 mt-2">
                This may take a few moments
              </div>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
          customClass: {
            container: "swal2-container-high-z",
          },
        });

        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        const apiResult = await response.json();

        if (apiResult.success) {
          MySwal.fire({
            title: "✅ User Deleted Successfully!",
            html: `
              <div class="text-left space-y-2">
                <p><strong>${userName}</strong> has been completely removed from:</p>
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul class="text-sm text-green-700 space-y-1">
                    <li>✅ Local database</li>
                    ${
                      apiResult.details?.faceApi?.includes("Deleted")
                        ? "<li>✅ Face recognition system</li>"
                        : ""
                    }
                    ${
                      apiResult.details?.palm?.includes("Deleted")
                        ? "<li>✅ Palm vein system</li>"
                        : ""
                    }
                    ${
                      apiResult.details?.zkteco?.includes("Deleted")
                        ? "<li>✅ ZKTeco access control</li>"
                        : ""
                    }
                    ${
                      apiResult.details?.zktecoCard?.includes("Deleted")
                        ? "<li>✅ Card registrations</li>"
                        : ""
                    }
                    ${
                      apiResult.details?.zktecoFingerprint?.includes("Deleted")
                        ? "<li>✅ Fingerprint templates</li>"
                        : ""
                    }
                  </ul>
                </div>
              </div>
            `,
            icon: "success",
            timer: 4000,
            customClass: {
              container: "swal2-container-high-z",
            },
          });

          // Silent refresh without loading indicators
          await fetchUsers(false);
        } else {
          MySwal.fire({
            title: "Partial Deletion",
            html: `
              <div class="text-left space-y-2">
                <p>User deletion completed with some issues:</p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p class="text-sm text-yellow-800">${
                    apiResult.error || "Some systems may not have been updated"
                  }</p>
                </div>
              </div>
            `,
            icon: "warning",
            customClass: {
              container: "swal2-container-high-z",
            },
          });

          // Still refresh to show updated data
          await fetchUsers(false);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        MySwal.fire({
          title: "Deletion Failed",
          text: "Failed to connect to server. Please try again.",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
      } finally {
        setIsDeletingUser(null);
      }
    }
  };

  // Handle biometric registration
  const handleRegistration = (
    userId: number,
    type: "card" | "fingerprint" | "palm" | "face"
  ) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setRegistrationType(type);
      setIsModalOpen(true);
    }
  };

  // Handle registration complete
  const handleRegistrationComplete = async () => {
    // Silent refresh to update user data immediately
    await fetchUsers(false);

    setIsModalOpen(false);
    setSelectedUser(null);
    setRegistrationType(null);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
    });
    setIsEditUserOpen(true);
  };

  // Handle biometric deletion
  const handleBiometricDeletion = (
    userId: number,
    type: "card" | "fingerprint" | "palm" | "face"
  ) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setDeletionUser(user);
      setDeletionType(type);
      setIsDeletionModalOpen(true);
    }
  };

  // Handle deletion complete
  const handleDeletionComplete = async () => {
    // Silent refresh to update user data immediately
    await fetchUsers(false);

    setIsDeletionModalOpen(false);
    setDeletionUser(null);
    setDeletionType(null);
  };

  // Get biometric registration count
  const getBiometricCount = (user: User) => {
    let count = 0;
    if (user.card_registered) count++;
    if (user.fingerprint_registered) count++;
    if (user.palm_registered) count++;
    if (user.face_registered) count++;
    return count;
  };

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold">Protected Area</h1>
            </div>
          </header>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">
                Admin Access Required
              </h2>
              <p className="text-muted-foreground">
                Please authenticate to access User Management
              </p>
            </div>
          </div>
        </SidebarInset>

        <PasswordProtection
          isOpen={showPasswordDialog}
          onSuccess={handlePasswordSuccess}
          onCancel={handlePasswordCancel}
        />
      </>
    );
  }

  if (loading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h1 className="text-lg font-semibold">User Management</h1>
            <Badge variant="outline" className="ml-2">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Loading User Data</h2>
            <p className="text-muted-foreground">
              Fetching users from database...
            </p>
            <div className="mt-4">
              <div className="animate-pulse flex space-x-1 justify-center">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
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
          <Users className="h-5 w-5" />
          <h1 className="text-lg font-semibold">User Management</h1>
          <Badge variant="outline" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        </div>
        <div className="ml-auto">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button disabled={isCreatingUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    disabled={isCreatingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    disabled={isCreatingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Enter department"
                    disabled={isCreatingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={isCreatingUser}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => createUser(formData)}
                    className="flex-1"
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1"
                    disabled={isCreatingUser}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Palm Registered
              </CardTitle>
              <Hand className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.palmRegistered}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Face Registered
              </CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.faceRegistered}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="local-users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local-users">Local Users</TabsTrigger>
            <TabsTrigger value="palm-vein-users">Palm Vein Users</TabsTrigger>
          </TabsList>

          <TabsContent value="local-users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage user accounts and biometric registrations
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">User Info</th>
                        <th className="text-left p-3 font-medium">
                          Department
                        </th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">
                          Biometrics
                        </th>
                        <th className="text-left p-3 font-medium">Last Seen</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                              {user.zkteco_uid && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                  ZKTeco UID: {user.zkteco_uid}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{user.department}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              <div className="flex gap-1 flex-wrap">
                                <Badge
                                  variant={
                                    user.card_registered ? "default" : "outline"
                                  }
                                  className={`text-xs ${
                                    user.card_registered ? "bg-green-500" : ""
                                  }`}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Card
                                </Badge>
                                <Badge
                                  variant={
                                    user.fingerprint_registered
                                      ? "default"
                                      : "outline"
                                  }
                                  className={`text-xs ${
                                    user.fingerprint_registered
                                      ? "bg-green-500"
                                      : ""
                                  }`}
                                >
                                  <Fingerprint className="h-3 w-3 mr-1" />
                                  Finger
                                </Badge>
                                <Badge
                                  variant={
                                    user.palm_registered ? "default" : "outline"
                                  }
                                  className={`text-xs ${
                                    user.palm_registered ? "bg-green-500" : ""
                                  }`}
                                >
                                  <Hand className="h-3 w-3 mr-1" />
                                  Palm
                                </Badge>
                                <Badge
                                  variant={
                                    user.face_registered ? "default" : "outline"
                                  }
                                  className={`text-xs ${
                                    user.face_registered ? "bg-green-500" : ""
                                  }`}
                                >
                                  <Camera className="h-3 w-3 mr-1" />
                                  Face
                                </Badge>
                              </div>

                              {/* Register Buttons */}
                              <div className="flex gap-1 flex-wrap">
                                {!user.card_registered && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleRegistration(user.id, "card")
                                    }
                                    className="text-xs h-6 px-2"
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Card
                                  </Button>
                                )}
                                {!user.fingerprint_registered && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleRegistration(user.id, "fingerprint")
                                    }
                                    className="text-xs h-6 px-2"
                                  >
                                    <Fingerprint className="h-3 w-3 mr-1" />
                                    Finger
                                  </Button>
                                )}
                                {!user.palm_registered && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleRegistration(user.id, "palm")
                                    }
                                    className="text-xs h-6 px-2"
                                  >
                                    <Hand className="h-3 w-3 mr-1" />
                                    Palm
                                  </Button>
                                )}
                                {!user.face_registered && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleRegistration(user.id, "face")
                                    }
                                    className="text-xs h-6 px-2"
                                  >
                                    <Camera className="h-3 w-3 mr-1" />
                                    Face
                                  </Button>
                                )}
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {getBiometricCount(user)}/4 registered
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {user.last_seen
                              ? new Date(user.last_seen).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                {/* Deletion Actions */}
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                  Delete Biometric
                                </div>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleBiometricDeletion(user.id, "card")
                                  }
                                  disabled={!user.card_registered}
                                  className="text-sm text-red-600"
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Delete Card
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleBiometricDeletion(
                                      user.id,
                                      "fingerprint"
                                    )
                                  }
                                  disabled={!user.fingerprint_registered}
                                  className="text-sm text-red-600"
                                >
                                  <Fingerprint className="h-4 w-4 mr-2" />
                                  Delete Fingerprint
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleBiometricDeletion(user.id, "palm")
                                  }
                                  disabled={!user.palm_registered}
                                  className="text-sm text-red-600"
                                >
                                  <Hand className="h-4 w-4 mr-2" />
                                  Delete Palm
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleBiometricDeletion(user.id, "face")
                                  }
                                  disabled={!user.face_registered}
                                  className="text-sm text-red-600"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Delete Face
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* User Management */}
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                  className="text-sm"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteUser(user.id, user.name)}
                                  disabled={
                                    user.email === "admin@biometric.system" ||
                                    isDeletingUser === user.id
                                  }
                                  className="text-sm text-red-600"
                                >
                                  {isDeletingUser === user.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="palm-vein-users" className="space-y-4">
            <PalmVeinUsersTable />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
                disabled={isUpdatingUser}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                disabled={isUpdatingUser}
              />
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="Enter department"
                disabled={isUpdatingUser}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isUpdatingUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  editingUser && updateUser(editingUser.id, formData)
                }
                className="flex-1"
                disabled={isUpdatingUser}
              >
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditUserOpen(false)}
                className="flex-1"
                disabled={isUpdatingUser}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BiometricRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleRegistrationComplete}
        user={selectedUser}
        type={registrationType}
      />
      <BiometricDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        onComplete={handleDeletionComplete}
        user={deletionUser}
        type={deletionType}
      />
    </SidebarInset>
  );
}
