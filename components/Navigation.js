import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, ScanLine, BookOpen } from "lucide-react";
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
            Modern QR-based attendance tracking for students, officers, and faculty
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Student Registration */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-8 text-center">
              <div className="mb-6">
                <Users className="h-16 w-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Student Portal</h2>
                <p className="text-muted-foreground">
                  Register your account and get your QR code for attendance
                </p>
              </div>
              <Link href="/student">
                <Button variant="academic" className="w-full" size="lg">
                  Student Registration
                </Button>
              </Link>
            </div>
          </Card>

          {/* SBO Scanning */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-8 text-center">
              <div className="mb-6">
                <ScanLine className="h-16 w-16 text-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-foreground mb-2">SBO Scanner</h2>
                <p className="text-muted-foreground">
                  Scan student QR codes for attendance tracking
                </p>
              </div>
              <Link href="/scan">
                <Button variant="gradient" className="w-full" size="lg">
                  Start Scanning
                </Button>
              </Link>
            </div>
          </Card>

          {/* Faculty Dashboard */}
          <Card variant="gradient" className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 transform hover:scale-105">
            <div className="p-8 text-center">
              <div className="mb-6">
                <BookOpen className="h-16 w-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Faculty Dashboard</h2>
                <p className="text-muted-foreground">
                  View and manage all student attendance records
                </p>
              </div>
              <Link href="/faculty">
                <Button variant="academic" className="w-full" size="lg">
                  Faculty Login
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
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Auto QR Generation</h4>
              <p className="text-sm text-muted-foreground">Instant QR code creation upon registration</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ScanLine className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Mobile Scanning</h4>
              <p className="text-sm text-muted-foreground">Fast QR code scanning with camera</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Time Restrictions</h4>
              <p className="text-sm text-muted-foreground">Controlled time-in and time-out windows</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Real-time Reports</h4>
              <p className="text-sm text-muted-foreground">Live attendance tracking and analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;