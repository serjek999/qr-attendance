"use client";

import {
    LayoutDashboard,
    FileText,
    Calendar,
    BarChart3,
    Users,
    Plus,
    Trophy
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const NavigationSidebar = ({ activeTab, setActiveTab, isMobile = false }) => {
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
            description: "View announcements and posts"
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
            id: "attendance",
            label: "Attendance",
            icon: Calendar,
            description: "Track student attendance"
        },
        {
            id: "reports",
            label: "Reports",
            icon: BarChart3,
            description: "Analytics and reports"
        }
    ];

    const handleQuickAction = (action) => {
        switch (action) {
            case 'createPost':
                setActiveTab('posts');
                // Trigger post creation form (this will be handled by the PostsFeed component)
                break;
            case 'viewAttendance':
                setActiveTab('attendance');
                break;
            default:
                break;
        }
    };

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



            {/* Faculty Info */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">Faculty Info</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-white" />
                        <span className="text-sm text-white/70">Faculty Member</span>
                    </div>

                    <div className="text-xs text-white/50">
                        Access to view posts, attendance records, and generate reports.
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