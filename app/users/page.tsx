"use client";

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
} from "lucide-react";
import { BiometricRegistrationModal } from "@/components/biometric-registration-modal";
import { PasswordProtection } from "@/components/password-protection";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useEffect } from "react"; // sudah ada? skip aja

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

  // Fetch users from API
  const fetchUsers = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Show loading toast
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

      const response = await fetch("/api/users");
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        setStats(result.stats);

        // Show success message with user count
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
      } else {
        MySwal.fire({
          title: "Error",
          text: result.error || "Failed to fetch users",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      MySwal.fire({
        title: "Connection Error",
        text: "Failed to connect to server. Please check your connection.",
        icon: "error",
        customClass: {
          container: "swal2-container-high-z",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new user
  const createUser = async (userData: CreateUserData) => {
    try {
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
        fetchUsers(); // Refresh the list
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
    }
  };

  // Update user
  const updateUser = async (
    userId: number,
    userData: Partial<CreateUserData>
  ) => {
    try {
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
        fetchUsers(); // Refresh the list
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
    }
  };

  // Delete user
  const deleteUser = async (userId: number, userName: string) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `Delete user "${userName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        container: "swal2-container-high-z",
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        const apiResult = await response.json();

        if (apiResult.success) {
          MySwal.fire({
            title: "Deleted!",
            text: "User has been deleted.",
            icon: "success",
            timer: 2000,
            customClass: {
              container: "swal2-container-high-z",
            },
          });
          fetchUsers(); // Refresh the list
        } else {
          MySwal.fire({
            title: "Error",
            text: apiResult.error || "Failed to delete user",
            icon: "error",
            customClass: {
              container: "swal2-container-high-z",
            },
          });
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        MySwal.fire({
          title: "Error",
          text: "Failed to connect to server",
          icon: "error",
          customClass: {
            container: "swal2-container-high-z",
          },
        });
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
    if (selectedUser && registrationType) {
      try {
        const response = await fetch(
          `/api/users/${selectedUser.id}/register-biometric`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ type: registrationType }),
          }
        );

        const result = await response.json();

        if (result.success) {
          fetchUsers(); // Refresh the list
        }
      } catch (error) {
        console.error("Error updating registration:", error);
      }
    }
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
              <Button>
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
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status: value })
                    }
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
                  >
                    Create User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1"
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

        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Registrations</th>
                    <th className="text-left p-2">Last Seen</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{user.name}</td>
                      <td className="p-2 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="p-2">{user.department}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Badge
                            variant={
                              user.card_registered ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            Card
                          </Badge>
                          <Badge
                            variant={
                              user.fingerprint_registered
                                ? "default"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            Finger
                          </Badge>
                          <Badge
                            variant={
                              user.palm_registered ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            Palm
                          </Badge>
                          <Badge
                            variant={
                              user.face_registered ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            Face
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {user.last_seen
                          ? new Date(user.last_seen).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegistration(user.id, "card")}
                            disabled={user.card_registered}
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRegistration(user.id, "fingerprint")
                            }
                            disabled={user.fingerprint_registered}
                          >
                            <Fingerprint className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegistration(user.id, "palm")}
                            disabled={user.palm_registered}
                          >
                            <Hand className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegistration(user.id, "face")}
                            disabled={user.face_registered}
                          >
                            <Camera className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUser(user.id, user.name)}
                            disabled={user.email === "admin@biometric.system"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
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
              >
                Update User
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditUserOpen(false)}
                className="flex-1"
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
    </SidebarInset>
  );
}
