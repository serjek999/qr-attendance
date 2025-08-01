"use client";

import {
    LayoutDashboard,
    FileText,
    Calendar,
    BarChart3,
    Users,
    Plus
} from 'lucide-react';

const NavigationSidebar = ({ activeTab, setActiveTab }) => {
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

    return (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Navigation</h3>
                <div className="space-y-2">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${activeTab === item.id
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className="h-5 w-5" />
                                <div>
                                    <div className="font-medium">{item.label}</div>
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => handleQuickAction('createPost')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Post</span>
                    </button>

                    <button
                        onClick={() => handleQuickAction('viewAttendance')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Calendar className="h-4 w-4" />
                        <span>View Attendance</span>
                    </button>
                </div>
            </div>

            {/* Faculty Info */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Faculty Info</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Faculty Member</span>
                    </div>

                    <div className="text-xs text-gray-500">
                        Access to view posts, attendance records, and generate reports.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar; 