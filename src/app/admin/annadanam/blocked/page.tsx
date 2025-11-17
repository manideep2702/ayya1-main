"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/ui/alert-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AdminGuard from "../../_components/AdminGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlockedUser {
  id: string;
  user_id: string;
  email: string;
  blocked_at: string;
  blocked_until: string;
  reason: string;
  consecutive_misses: number;
  status: string;
  days_remaining: number;
  unblocked_by: string | null;
  unblocked_at: string | null;
  notes: string | null;
}

export default function BlockedUsersPage() {
  const [users, setUsers] = useState<BlockedUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const router = useRouter();
  const { show } = useAlert();

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("list_blocked_users");
      if (error) throw error;
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load blocked users");
      setUsers(null);
    } finally {
      setLoading(false);
    }
  };

  const runAutoBlockCheck = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("check_and_block_no_show_users");
      if (error) throw error;
      
      const blocked = Array.isArray(data) ? data : [];
      if (blocked.length > 0) {
        show({
          title: "Auto-block completed",
          description: `${blocked.length} user(s) have been blocked for consecutive no-shows.`,
          variant: "success",
        });
      } else {
        show({
          title: "No new blocks",
          description: "No users met the criteria for blocking.",
          variant: "info",
        });
      }
      
      // Reload the list
      await loadBlockedUsers();
    } catch (e: any) {
      show({
        title: "Auto-block failed",
        description: e?.message || "Failed to run auto-block check",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to unblock ${email}?`)) return;
    
    try {
      setUnblocking(userId);
      const supabase = getSupabaseBrowserClient();
      
      // Get current admin user ID
      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData?.user?.id;
      
      if (!adminId) {
        throw new Error("Unable to identify admin user");
      }
      
      const { data, error } = await supabase.rpc("unblock_user", {
        p_user_id: userId,
        p_admin_user_id: adminId,
        p_notes: `Manually unblocked by admin on ${new Date().toISOString()}`,
      });
      
      if (error) throw error;
      
      if (data) {
        show({
          title: "User unblocked",
          description: `${email} can now book Annadanam slots again.`,
          variant: "success",
        });
        await loadBlockedUsers();
      } else {
        throw new Error("User not found or already unblocked");
      }
    } catch (e: any) {
      show({
        title: "Unblock failed",
        description: e?.message || "Failed to unblock user",
        variant: "error",
      });
    } finally {
      setUnblocking(null);
    }
  };

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const unblocked = users?.filter((u) => u.status === "unblocked") || [];

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Blocked Users Management</h1>
              <p className="mt-2 text-muted-foreground">
                Manage users blocked for missing consecutive Annadanam bookings
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/admin")}>
              ← Back to Admin
            </Button>
          </div>

          {/* Actions */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button onClick={loadBlockedUsers} disabled={loading}>
                  {loading ? "Loading..." : "Refresh List"}
                </Button>
                <Button onClick={runAutoBlockCheck} disabled={loading} variant="secondary">
                  Run Auto-Block Check
                </Button>
                <div className="ml-auto text-sm text-muted-foreground">
                  <div><strong>Active Blocks:</strong> {activeUsers.length}</div>
                  <div><strong>Unblocked:</strong> {unblocked.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Active Blocks */}
          {activeUsers.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Currently Blocked Users</h2>
              <div className="space-y-4">
                {activeUsers.map((user) => (
                  <Card key={user.id} className="border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{user.email}</h3>
                            <Badge variant="destructive">Blocked</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>
                              <strong>Reason:</strong> {user.reason}
                            </div>
                            <div>
                              <strong>Consecutive Misses:</strong> {user.consecutive_misses}
                            </div>
                            <div>
                              <strong>Blocked at:</strong>{" "}
                              {new Date(user.blocked_at).toLocaleString()}
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                              <strong>Blocked until:</strong>{" "}
                              {new Date(user.blocked_until).toLocaleString()} (
                              {user.days_remaining} days remaining)
                            </div>
                          </div>
                        </div>
                        <div>
                          <Button
                            onClick={() => unblockUser(user.user_id, user.email)}
                            disabled={unblocking === user.user_id}
                            variant="outline"
                            size="sm"
                          >
                            {unblocking === user.user_id ? "Unblocking..." : "Unblock User"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Previously Unblocked */}
          {unblocked.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Previously Unblocked Users</h2>
              <div className="space-y-4">
                {unblocked.map((user) => (
                  <Card key={user.id} className="opacity-60">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{user.email}</h3>
                            <Badge variant="secondary">Unblocked</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>
                              <strong>Original Reason:</strong> {user.reason}
                            </div>
                            <div>
                              <strong>Was blocked:</strong>{" "}
                              {new Date(user.blocked_at).toLocaleDateString()} -{" "}
                              {new Date(user.blocked_until).toLocaleDateString()}
                            </div>
                            {user.unblocked_at && (
                              <div>
                                <strong>Unblocked at:</strong>{" "}
                                {new Date(user.unblocked_at).toLocaleString()}
                              </div>
                            )}
                            {user.notes && (
                              <div>
                                <strong>Notes:</strong> {user.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && users && users.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No blocked users found. Great news! 🎉
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Users will be automatically blocked after missing 2 consecutive bookings (enforced from Nov 15, 2025).
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="mb-3 font-semibold">How Blocking Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>• Automatic Blocking:</strong> Users who miss 2 consecutive bookings (don't show up) are automatically blocked for 7 days.
                </li>
                <li>
                  <strong>• Enforcement Date:</strong> This system is enforced starting November 15, 2025.
                </li>
                <li>
                  <strong>• Manual Unblock:</strong> Admins can manually unblock users at any time using the "Unblock User" button.
                </li>
                <li>
                  <strong>• Auto-Block Check:</strong> The system runs automatically, but admins can manually trigger a check using the "Run Auto-Block Check" button.
                </li>
                <li>
                  <strong>• User Experience:</strong> Blocked users will see a prominent warning when they try to book and won't be able to proceed.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminGuard>
  );
}

