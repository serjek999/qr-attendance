"use client";

import {
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    Settings,
    Plus,
    UserPlus,
    Calendar,
    Trophy
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const NavigationSidebar = ({ activeTab, setActiveTab, onManageTribes, isMobile = false }) => {
    const navigationItems = [
        {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            description: "Dashboard overview and stats"
        },
        {
            id: "posts",
            label: "Posts",
            icon: FileText,
            description: "Manage announcements and posts"
        },
        {
            id: "events",
            label: "Events",
            icon: Calendar,
            description: "Create and manage events"
        },
        {
            id: "scoring",
            label: "Tribe Scoring",
            icon: Trophy,
            description: "Manage tribe scores and rankings"
        },
        {
            id: "tribes",
            label: "Tribes",
            icon: Users,
            description: "Manage student tribes"
        },
        {
            id: "users",
            label: "Users",
            icon: UserPlus,
            description: "Manage faculty and SBO accounts"
        },
        {
            id: "reports",
            label: "Reports",
            icon: BarChart3,
            description: "Analytics and reports"
        }
    ];

    const sidebarContent = (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">Navigation</h3>
                <div className="space-y-2">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${activeTab === item.id
                                ? "bg-white/20 text-white backdrop-blur-md border border-white/30"
                                : "hover:bg-white/10 text-white/70 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className="h-5 w-5" />
                                <div>
                                    <div className="font-medium">{item.label}</div>
                                    <div className="text-xs text-white/50">{item.description}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>



            {/* System Status */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">System Status</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Database</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-400">Online</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">API</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-400">Healthy</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Scanner</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-400">Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return isMobile ? (
        <ScrollArea className="h-[calc(100vh-120px)]">
            {sidebarContent}
        </ScrollArea>
    ) : (
        sidebarContent
    );
};

export default NavigationSidebar; 