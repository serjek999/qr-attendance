"use client";

import {
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    Settings,
    Plus
} from 'lucide-react';

const NavigationSidebar = ({ activeTab, setActiveTab, onManageTribes }) => {
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
            id: "tribes",
            label: "Tribes",
            icon: Users,
            description: "Manage student tribes"
        },
        {
            id: "reports",
            label: "Reports",
            icon: BarChart3,
            description: "Analytics and reports"
        }
    ];

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
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
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
                        onClick={onManageTribes}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add New Tribe</span>
                    </button>

                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Create Post</span>
                    </button>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Database</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Online</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">API</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Healthy</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Scanner</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar; 