"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, Camera, CheckCircle, XCircle, Clock, ArrowLeft, LogOut, User } from "lucide-react";
import Link from "next/link";
import QrScanner from "qr-scanner";
import LoginForm from "@/components/LoginForm";
import { authUtils } from "../lib/auth";

const Scan = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const { toast } = useToast();

  const handleLogin = async (userData) => {
    try {
      const result = await authUtils.loginSBO(userData.username, userData.password);

      if (result.success) {
        setUser(result.officer);
        setIsAuthenticated(true);
        
        // Load recent attendance records
        loadRecentAttendance();
        
        toast({
          title: "Login Successful! ✅",
          description: `Welcome, ${result.officer.full_name}`
        });
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    }
  };

  const loadRecentAttendance = async () => {
    try {
      const result = await authUtils.getAttendanceRecords({ limit: 10 });
      
      if (result.success) {
        const formattedHistory = result.data.map(record => ({
          schoolId: record.school_id,
          time: record.time_in || record.time_out,
          type: record.time_out ? 'time-out' : 'time-in',
          status: record.status === 'present' ? 'success' : 'error',
          message: `${record.status === 'present' ? 'Attendance recorded' : 'Error'} - ${record.student_name}`
        }));
        
        setScanHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error loading recent attendance:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setScanHistory([]);
    setLastScan("");
    
    // Stop scanning if active
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const getCurrentTimeInfo = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeString = now.toLocaleTimeString();
    
    // Time-in window: 7:00 AM to 11:30 AM
    const isTimeInWindow = (hours >= 7 && hours < 11) || (hours === 11 && minutes <= 30);
    
    // Time-out window: 1:00 PM to 5:00 PM  
    const isTimeOutWindow = hours >= 13 && hours < 17;
    
    return {
      time: timeString,
      isTimeInWindow,
      isTimeOutWindow,
      canScan: isTimeInWindow || isTimeOutWindow,
      currentWindow: isTimeInWindow ? 'time-in' : isTimeOutWindow ? 'time-out' : null
    };
  };

  const processAttendance = async (schoolId) => {
    const timeInfo = getCurrentTimeInfo();
    
    if (!timeInfo.canScan) {
      const errorMessage = "Attendance scanning is only allowed during:\n• Time-in: 7:00 AM - 11:30 AM\n• Time-out: 1:00 PM - 5:00 PM";
      
      setScanHistory(prev => [{
        schoolId,
        time: timeInfo.time,
        type: (timeInfo.currentWindow || 'time-in'),
        status: 'error',
        message: errorMessage
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "Scanning Not Allowed",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await authUtils.recordAttendance(schoolId, user.id);
      
      if (result.success) {
        const record = result.data;
        const type = record.time_out ? 'time-out' : 'time-in';
        
        setScanHistory(prev => [{
          schoolId,
          time: timeInfo.time,
          type: type,
          status: 'success',
          message: `${type === 'time-out' ? 'Time-out' : 'Time-in'} recorded for ${record.student_name}`
        }, ...prev.slice(0, 9)]);
        
        toast({
          title: "Attendance Recorded! ✅",
          description: `${schoolId} - ${result.message}`
        });
      } else {
        setScanHistory(prev => [{
          schoolId,
          time: timeInfo.time,
          type: (timeInfo.currentWindow || 'time-in'),
          status: 'error',
          message: result.message
        }, ...prev.slice(0, 9)]);
        
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Attendance recording error:', error);
      const errorMessage = "Failed to record attendance";
      
      setScanHistory(prev => [{
        schoolId,
        time: timeInfo.time,
        type: (timeInfo.currentWindow || 'time-in'),
        status: 'error',
        message: errorMessage
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          const schoolId = result.data;
          setLastScan(schoolId);
          processAttendance(schoolId);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      qrScannerRef.current = qrScanner;
      await qrScanner.start();
      setIsScanning(true);
      
      toast({
        title: "Scanner Active",
        description: "Point camera at student QR codes to record attendance"
      });
      
    } catch (error) {
      console.error('Scanner error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    
    toast({
      title: "Scanner Stopped",
      description: "QR code scanning has been disabled"
    });
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const timeInfo = getCurrentTimeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{user?.full_name}</span>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card variant="gradient" className="mb-8">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <ScanLine className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl text-primary">SBO Attendance Scanner</CardTitle>
              <CardDescription className="text-lg">
                Welcome, {user?.full_name}! Scan student QR codes to record attendance
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-primary" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  {timeInfo.canScan 
                    ? `Active window: ${timeInfo.currentWindow?.replace('-', ' ').toUpperCase()}`
                    : "Scanner is currently disabled"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Time Status */}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Current Time:</span>
                    <span className="font-mono">{timeInfo.time}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className={`p-2 rounded ${timeInfo.isTimeInWindow ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      <div className="font-medium">Time-in Window</div>
                      <div>7:00 AM - 11:30 AM</div>
                    </div>
                    <div className={`p-2 rounded ${timeInfo.isTimeOutWindow ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      <div className="font-medium">Time-out Window</div>
                      <div>1:00 PM - 5:00 PM</div>
                    </div>
                  </div>
                </div>

                {/* Video Scanner */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Camera preview will appear here</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanner Controls */}
                <div className="space-y-3">
                  {!isScanning ? (
                    <Button 
                      onClick={startScanning} 
                      variant="academic" 
                      className="w-full"
                      disabled={!timeInfo.canScan}
                    >
                      <ScanLine className="h-4 w-4 mr-2" />
                      Start Scanner
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopScanning} 
                      variant="destructive" 
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Stop Scanner
                    </Button>
                  )}
                  
                  {!timeInfo.canScan && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Scanner disabled outside of attendance hours
                      </p>
                    </div>
                  )}
                </div>

                {lastScan && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Last Scanned:</p>
                    <p className="font-mono text-green-900">{lastScan}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan History */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>
                  Last 10 attendance records
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No scans yet</p>
                      <p className="text-sm">Start scanning to see attendance records</p>
                    </div>
                  ) : (
                    scanHistory.map((scan, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          scan.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-medium">{scan.schoolId}</span>
                          {scan.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm opacity-75">
                          <div>{scan.time} - {scan.type.toUpperCase()}</div>
                          <div className="mt-1">{scan.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan;