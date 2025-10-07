"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SettingsSkeleton } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState<'gmail' | 'outlook' | null>(null);
  
  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Connected email accounts
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  
  // User settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    autoQuarantine: true,
    strictMode: false,
    scanAttachments: true,
    threatSensitivity: 3,
  });

  const tabs = [
    { 
      id: "account", 
      name: "Account", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: "email", 
      name: "Email Integration", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "security", 
      name: "Security", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    { 
      id: "notifications", 
      name: "Notifications", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
  ];

  // Load data on mount
  useEffect(() => {
    loadData();
    handleOAuthCallback();
  }, []);

  // Load user profile and settings
  async function loadData() {
    try {
      setLoading(true);
      const [profileRes, settingsRes, accountsRes] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getSettings(),
        apiClient.getEmailAccounts(),
      ]);

      if (profileRes.success) {
        setProfile({
          name: profileRes.data.user.name || "",
          email: profileRes.data.user.email || "",
        });
      }

      if (settingsRes.success) {
        setSettings(settingsRes.data.settings);
      }

      if (accountsRes.success) {
        setConnectedAccounts(accountsRes.data.emailAccounts);
      }
    } catch (error: any) {
      console.error("Load data error:", error);
      if (error.message === "Unauthorized") {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle OAuth callback
  function handleOAuthCallback() {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get("success");
    const email = searchParams.get("email");
    const error = searchParams.get("error");
    const details = searchParams.get("details");

    console.log('OAuth callback:', { success, email, error, details });

    if (success === "gmail_connected" && email) {
      toast.success(`Gmail Connected! Account ${decodeURIComponent(email)} connected successfully`);
      loadData(); // Reload accounts
      window.history.replaceState({}, "", "/settings");
    }

    if (success === "outlook_connected" && email) {
      toast.success(`Outlook Connected! Account ${decodeURIComponent(email)} connected successfully`);
      loadData();
      window.history.replaceState({}, "", "/settings");
    }

    if (error) {
      const errorMsg = error.replace(/_/g, " ");
      const fullError = details 
        ? `${errorMsg}: ${decodeURIComponent(details)}` 
        : errorMsg;
      toast.error(`Connection Failed - ${fullError}`);
      window.history.replaceState({}, "", "/settings");
      setConnecting(null);
    }
  }

  // Save profile
  async function handleSaveProfile() {
    try {
      setSaving(true);
      const response = await apiClient.updateProfile(profile);
      if (response.success) {
        toast.success("Profile updated successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match. Please make sure both passwords are the same");
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (response.success) {
        toast.success("Password updated successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  // Save settings
  async function handleSaveSettings() {
    try {
      setSaving(true);
      const response = await apiClient.updateSettings(settings);
      if (response.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Connect Gmail
  async function handleGmailConnect() {
    try {
      setConnecting('gmail');
      const response = await apiClient.getGmailAuthUrl();
      if (response.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect Gmail. Please try again");
      setConnecting(null);
    }
  }

  // Connect Outlook
  async function handleOutlookConnect() {
    try {
      setConnecting('outlook');
      const response = await apiClient.getOutlookAuthUrl();
      if (response.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect Outlook. Please try again");
      setConnecting(null);
    }
  }

  // Disconnect account
  async function handleDisconnect(accountId: string) {
    if (!confirm("Are you sure you want to disconnect this account?")) {
      return;
    }

    try {
      const response = await apiClient.disconnectEmailAccount(accountId);
      if (response.success) {
        toast.success("Email account disconnected successfully");
        loadData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect account");
    }
  }

  // Sync emails
  async function handleSync(accountId: string, provider: string) {
    try {
      setSaving(true);
      const response =
        provider === "gmail"
          ? await apiClient.syncGmailAccount(accountId)
          : await apiClient.syncOutlookAccount(accountId);

      if (response.success) {
        toast.success(`Synced ${response.data.imported} new emails! (${response.data.scanned} scanned for threats)`);
        loadData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sync emails");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Settings</h1>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-[#151515] rounded-xl border border-[#1E1E1E] p-2 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[#1E1E1E] rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <SettingsSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-[#151515] rounded-xl border border-[#1E1E1E] p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 flex items-center gap-3 ${
                    activeTab === tab.id
                      ? "bg-[#1E1E1E] text-white"
                      : "text-white hover:bg-[#1E1E1E]"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Account Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-6">
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Connected Email Accounts</h2>
                  <div className="space-y-4">
                    {connectedAccounts.length === 0 ? (
                      <p className="text-white text-center py-4">
                        No email accounts connected yet
                      </p>
                    ) : (
                      connectedAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-lg gap-3 flex-wrap"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-[#151515] rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium capitalize">{account.provider}</p>
                              <p className="text-sm text-white truncate">{account.email}</p>
                              {account.lastSyncedAt && (
                                <p className="text-xs text-white">
                                  Last synced:{" "}
                                  {new Date(account.lastSyncedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSync(account.id, account.provider)}
                              disabled={saving}
                              className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm flex-shrink-0 disabled:opacity-50"
                            >
                              {saving ? "Syncing..." : "Sync Now"}
                            </button>
                            <button
                              onClick={() => handleDisconnect(account.id)}
                              className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm flex-shrink-0"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      onClick={() => setShowAddEmailModal(true)}
                      className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Add Email Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Security Preferences</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-Quarantine Threats</p>
                        <p className="text-sm text-white">
                          Automatically move malicious emails to quarantine
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.autoQuarantine}
                          onChange={(e) =>
                            setSettings({ ...settings, autoQuarantine: e.target.checked })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Strict Mode</p>
                        <p className="text-sm text-white">
                          Block suspicious emails even with low threat scores
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.strictMode}
                          onChange={(e) =>
                            setSettings({ ...settings, strictMode: e.target.checked })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Scan Attachments</p>
                        <p className="text-sm text-white">
                          Deep scan all email attachments for malware
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.scanAttachments}
                          onChange={(e) =>
                            setSettings({ ...settings, scanAttachments: e.target.checked })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="mt-6 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Security Settings"}
                  </button>
                </div>

                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Threat Sensitivity</h2>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm mb-2 block">
                        Phishing Detection Sensitivity: {settings.threatSensitivity}
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={settings.threatSensitivity}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            threatSensitivity: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-white mt-2">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-white">Receive email alerts for threats</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.emailNotifications}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              emailNotifications: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-white">
                          Browser push notifications for critical threats
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.pushNotifications}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              pushNotifications: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Security Reports</p>
                        <p className="text-sm text-white">
                          Get weekly summary of threats blocked
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.weeklyReports}
                          onChange={(e) =>
                            setSettings({ ...settings, weeklyReports: e.target.checked })
                          }
                        />
                        <div className="w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="mt-6 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Notification Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Email Account Modal */}
        {showAddEmailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#151515] rounded-2xl p-8 max-w-md w-full mx-4 border border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Email Account</h2>
                <button
                  onClick={() => setShowAddEmailModal(false)}
                  className="text-white hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-white mb-6">
                Choose your email provider to connect your account
              </p>

              <div className="space-y-3">
                {/* Gmail */}
                <button
                  onClick={handleGmailConnect}
                  disabled={connecting === 'gmail'}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">
                      {connecting === 'gmail' ? 'Connecting...' : 'Connect Gmail'}
                    </p>
                    <p className="text-sm text-white">
                      {connecting === 'gmail' ? 'Please wait...' : 'Use your Google account'}
                    </p>
                  </div>
                </button>

                {/* Outlook */}
                <button
                  onClick={handleOutlookConnect}
                  disabled={connecting === 'outlook'}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.268C24 5.596 18.627 0 12 0S0 5.596 0 12.268c0 6.235 4.667 11.426 10.742 12.41V15.96H7.508v-3.692h3.234V9.58c0-3.226 1.931-5.004 4.867-5.004 1.41 0 2.884.25 2.884.25v3.17h-1.625c-1.601 0-2.1.992-2.1 2.01v2.413h3.574l-.571 3.693h-3.003v8.716C19.333 23.694 24 18.502 24 12.268z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">
                      {connecting === 'outlook' ? 'Connecting...' : 'Connect Outlook'}
                    </p>
                    <p className="text-sm text-white">
                      {connecting === 'outlook' ? 'Please wait...' : 'Use your Microsoft account'}
                    </p>
                  </div>
                </button>

                {/* Custom Domain */}
                <button
                  onClick={() => {
                    toast.info("Custom domain configuration coming soon!");
                    setShowAddEmailModal(false);
                  }}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Custom Domain</p>
                    <p className="text-sm text-white">IMAP/SMTP configuration</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
