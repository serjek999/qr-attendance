"use client";

import { useState } from "react";
import { QrCode, FileText, Shield, BarChart3, LogOut, User, Calendar, Trophy, Bell, Users, Target, Settings } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";

const Sidebar = ({ user, activeTab, setActiveTab }) => {
    const { logout } = useAuthUser();
    const [selectedOption, setSelectedOption] = useState("");

    const handleLogout = () => {
        logout();
    };

    const comboboxOptions = [
        { value: "scanner", label: "QR Scanner Settings" },
        { value: "attendance", label: "Attendance Reports" },
        { value: "moderation", label: "Post Moderation" },
        { value: "events", label: "Event Management" },
        { value: "tribes", label: "Tribe Management" },
        { value: "analytics", label: "Analytics Dashboard" },
        { value: "notifications", label: "Notification Center" },
        { value: "system", label: "System Settings" },
    ];

    return (
        <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                        </div>
                        <h3 className="font-semibold text-lg text-white">{user?.full_name || 'SBO Officer'}</h3>
                        <p className="text-sm text-white/70">SBO Officer</p>
                        <Badge className="mt-2 bg-white/20 text-white">
                            <Target className="h-3 w-3 mr-1" />
                            Student Body
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-4">
                    <nav className="space-y-2">
                        <Button
                            className={`w-full justify-start ${activeTab === "scan" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("scan")}
                        >
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Scanner
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "feed" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("feed")}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Posts Feed
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "events" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("events")}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Events
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "scoring" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("scoring")}
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Tribe Scoring
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "moderation" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("moderation")}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Moderation
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "reports" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => setActiveTab("reports")}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Reports
                        </Button>
                    </nav>
                </CardContent>
            </Card>

            {/* Quick Actions Combobox */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center text-white">
                        <Settings className="h-4 w-4 mr-2" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Combobox
                        options={comboboxOptions}
                        value={selectedOption}
                        onValueChange={setSelectedOption}
                        placeholder="Select quick action..."
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default Sidebar; 