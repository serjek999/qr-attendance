import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, ScanLine, BookOpen, Settings, Trophy, LogIn } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

const Navigation = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#13392F' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PHINMA Cagayan De Oro College
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern QR-based attendance tracking with unified login for all users
          </p>
        </div>

        {/* Main Login Card */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="p-8 text-center">
              <div className="mb-6">
                <Logo size="xlarge" useImage={true} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-white mb-2"> Smart Access </h2>
                <p className="text-white/70">
                No need to choose — we’ll detect if you’re a student, sbo, faculty, or admin.
                </p>
              </div>
              <Link href="/auth">
                <Button className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30" size="lg">
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
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <GraduationCap className="h-12 w-12 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Students</h3>
                <p className="text-sm text-white/70">
                  Access your tribe feed, leaderboard, and attendance status
                </p>
              </div>
            </div>
          </Card>

          {/* SBO Portal */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <Users className="h-12 w-12 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">SBO Officers</h3>
                <p className="text-sm text-white/70">
                  Scan QR codes, moderate posts, and manage attendance
                </p>
              </div>
            </div>
          </Card>

          {/* Faculty Portal */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Faculty</h3>
                <p className="text-sm text-white/70">
                  View attendance reports and analytics dashboard
                </p>
              </div>
            </div>
          </Card>

          {/* Admin Portal */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="p-6 text-center">
              <div className="mb-4">
                <Settings className="h-12 w-12 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Administrators</h3>
                <p className="text-sm text-white/70">
                  Full system control and user management
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="text-center mb-16">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 max-w-md mx-auto">
            <div className="p-6">
              <div className="mb-4">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white">Tribe Leaderboard</h3>
                <p className="text-white/70">View live rankings and competition standings</p>
              </div>
              <Link href="/leaderboard">
                <Button className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8 text-white">System Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Logo size="small" useImage={true} />
              </div>
              <h4 className="font-semibold mb-2 text-white">Smart Access Login</h4>
              <p className="text-sm text-white/70">One login system for all user types</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ScanLine className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-white">QR Scanning</h4>
              <p className="text-sm text-white/70">Fast mobile QR code scanning</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-white">Social Feed</h4>
              <p className="text-sm text-white/70">Tribe-based social media experience</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-white">Real-time Analytics</h4>
              <p className="text-sm text-white/70">Live attendance tracking and insights</p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Navigation;