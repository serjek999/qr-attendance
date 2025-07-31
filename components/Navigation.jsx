import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, ScanLine, BookOpen, Settings, Trophy, LogIn, Shield } from "lucide-react";
import Link from "next/link";

const Navigation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              School Attendance System
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern QR-based attendance tracking with unified login for all users
          </p>
        </div>

        {/* Main Login Card */}
        <div className="max-w-md mx-auto mb-12">
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-8 text-center">
              <div className="mb-6">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Unified Login</h2>
                <p className="text-muted-foreground">
                  One login for all users - we'll detect your role automatically
                </p>
              </div>
              <Link href="/auth">
                <Button variant="academic" className="w-full" size="lg">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Role Information Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-8">
          {/* Student Portal */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-foreground mb-2">Students</h3>
                <p className="text-sm text-muted-foreground">
                  Access your tribe feed, leaderboard, and attendance status
                </p>
              </div>
            </div>
          </Card>

          {/* SBO Portal */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-foreground mb-2">SBO Officers</h3>
                <p className="text-sm text-muted-foreground">
                  Scan QR codes, moderate posts, and manage attendance
                </p>
              </div>
            </div>
          </Card>

          {/* Faculty Portal */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-foreground mb-2">Faculty</h3>
                <p className="text-sm text-muted-foreground">
                  View attendance reports and analytics dashboard
                </p>
              </div>
            </div>
          </Card>

          {/* Admin Portal */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <Settings className="h-12 w-12 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-foreground mb-2">Administrators</h3>
                <p className="text-sm text-muted-foreground">
                  Full system control and user management
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="text-center mb-16">
          <Card variant="elevated" className="max-w-md mx-auto">
            <div className="p-6">
              <div className="mb-4">
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold">Tribe Leaderboard</h3>
                <p className="text-muted-foreground">View live rankings and competition standings</p>
              </div>
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">System Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Unified Login</h4>
              <p className="text-sm text-muted-foreground">One login system for all user types</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ScanLine className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">QR Scanning</h4>
              <p className="text-sm text-muted-foreground">Fast mobile QR code scanning</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Social Feed</h4>
              <p className="text-sm text-muted-foreground">Tribe-based social media experience</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Real-time Analytics</h4>
              <p className="text-sm text-muted-foreground">Live attendance tracking and insights</p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Navigation;