"use client";

import { QrCode, FileText, Shield, BarChart3, Settings, LogOut, User } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";

const Sidebar = ({ user, activeTab, setActiveTab }) => {
    const { logout } = useAuthUser();

    const navigationItems = [
        {
            id: "scan",
            label: "QR Scanner",
            icon: QrCode,
            description: "Scan student QR codes"
        },
        {
            id: "feed",
            label: "Posts Feed",
            icon: FileText,
            description: "Manage announcements"
        },
        {
            id: "moderation",
            label: "Moderation",
            icon: Shield,
            description: "Review pending posts"
        },
        {
            id: "reports",
            label: "Reports",
            icon: BarChart3,
            description: "View attendance reports"
        }
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                    <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-primary">SBO Portal</h1>
                <p className="text-sm text-muted-foreground">Student Body Organization</p>
            </div>

            {/* User Info */}
            {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Logged In</span>
                    </div>
                    <p className="text-sm text-blue-700">
                        {user.full_name || `${user.first_name} ${user.last_name}`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        SBO Officer
                    </p>
                </div>
            )}

            {/* Navigation */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Navigation
                </h3>
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                </h3>
                <button
                    onClick={() => setActiveTab("scan")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                    <QrCode className="h-4 w-4" />
                    Start Scanning
                </button>
            </div>

            {/* System Status */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    System Status
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">System Online</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                        QR scanning active
                    </p>
                </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar; 