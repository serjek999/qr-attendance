"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, Camera, CheckCircle, XCircle, Clock, ArrowLeft, LogOut, User, UserCheck } from "lucide-react";
import Link from "next/link";
import QrScanner from "qr-scanner";
import LoginForm from "@/components/LoginForm.jsx";
import { authUtils } from "@/app/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const Scan = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
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
    setShowConfirmDialog(false);
    setScannedStudent(null);
    setIsProcessing(false);
    
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

  const handleConfirmAttendance = async () => {
    if (!scannedStudent) return;
    
    setIsProcessing(true);
    const timeInfo = getCurrentTimeInfo();
    
    // Fast recording - since we've already validated the student can be recorded
    // we can proceed directly to recording without additional checks

    try {
      const result = await authUtils.recordAttendance(scannedStudent.student.school_id, user.id);
      
      if (result.success) {
        const record = result.data;
        const type = record.time_out ? 'time-out' : 'time-in';
        
        setScanHistory(prev => [{
          schoolId: scannedStudent.student.school_id,
          time: timeInfo.time,
          type: type,
          status: 'success',
          message: `${type === 'time-out' ? 'Time-out' : 'Time-in'} recorded for ${record.student_name}`
        }, ...prev.slice(0, 9)]);
        
        // Fast success feedback
        toast({
          title: `${type === 'time-out' ? 'Time-Out' : 'Time-In'} Recorded! ✅`,
          description: `${scannedStudent.student.school_id} - ${scannedStudent.student.first_name} ${scannedStudent.student.last_name} ${type === 'time-out' ? 'time-out' : 'time-in'} recorded successfully`,
        });
      } else {
        setScanHistory(prev => [{
          schoolId: scannedStudent.student.school_id,
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
        schoolId: scannedStudent.student.school_id,
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
    
    setShowConfirmDialog(false);
    setScannedStudent(null);
    setIsProcessing(false);
  };

  const handleCancelAttendance = () => {
    setShowConfirmDialog(false);
    setScannedStudent(null);
    setIsProcessing(false);
    
    toast({
      title: "Scan Cancelled",
      description: "Attendance recording was cancelled"
    });
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
        async (result) => {
          const schoolId = result.data;
          setLastScan(schoolId);
          setIsScanningQR(true);
          
          // Fast duplicate detection and auto-processing
          try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            const attendancePromise = authUtils.checkStudentAttendance(schoolId);
            const attendanceResult = await Promise.race([attendancePromise, timeoutPromise]);
            
            // Log the result for debugging
            console.log('Attendance check result:', attendanceResult);
            
            if (attendanceResult.success) {
              const timeInfo = getCurrentTimeInfo();
              const studentData = attendanceResult.data;
              
              // Fast duplicate detection - show toast immediately for duplicates
              if (studentData.hasRecord) {
                const record = studentData.record;
                
                // Already complete record - show toast and don't open dialog
                if (record.time_in && record.time_out) {
                  toast({
                    title: "Already Recorded Today",
                    description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                    variant: "destructive"
                  });
                  return; // Don't open dialog, just show toast
                }
                
                // Already time-in during time-in hours - show toast and don't open dialog
                if (record.time_in && !record.time_out && timeInfo.isTimeInWindow) {
                  toast({
                    title: "Already Time-In",
                    description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${record.time_in}`,
                    variant: "destructive"
                  });
                  return; // Don't open dialog, just show toast
                }
              }
              
              // Check recent records for today's entry (fallback check)
              const recentRecords = studentData.recentRecords || [];
              const today = new Date().toISOString().split('T')[0];
              const todayRecord = recentRecords.find(record => record.date === today);
              
              if (todayRecord) {
                // Already complete record in recent records
                if (todayRecord.time_in && todayRecord.time_out) {
                  toast({
                    title: "Already Recorded Today",
                    description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                    variant: "destructive"
                  });
                  return; // Don't open dialog, just show toast
                }
                
                // Already time-in during time-in hours in recent records
                if (todayRecord.time_in && !todayRecord.time_out && timeInfo.isTimeInWindow) {
                  toast({
                    title: "Already Time-In",
                    description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${todayRecord.time_in}`,
                    variant: "destructive"
                  });
                  return; // Don't open dialog, just show toast
                }
              }
              
              // Only open dialog for students who can actually be recorded
              setScannedStudent(studentData);
              setShowConfirmDialog(true);
              
              // No toast here - let the dialog handle the user interaction
              
            } else {
              // Handle different types of errors
              let errorTitle = "Student Not Found";
              let errorMessage = attendanceResult.message || "Unknown error occurred";
              
              if (attendanceResult.message) {
                if (attendanceResult.message.includes('not found') || attendanceResult.message.includes('does not exist')) {
                  errorTitle = "Student Not Found";
                } else if (attendanceResult.message.includes('database') || attendanceResult.message.includes('connection')) {
                  errorTitle = "Database Error";
                } else if (attendanceResult.message.includes('permission') || attendanceResult.message.includes('unauthorized')) {
                  errorTitle = "Permission Error";
                } else {
                  errorTitle = "Error";
                }
              }
              
              toast({
                title: errorTitle,
                description: errorMessage,
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error checking student attendance:', error);
            
            // Provide more specific error messages
            let errorMessage = "Failed to get student information";
            if (error.message) {
              if (error.message.includes('not found') || error.message.includes('does not exist')) {
                errorMessage = "Student not found in database";
              } else if (error.message.includes('network') || error.message.includes('connection')) {
                errorMessage = "Network connection error. Please check your internet connection.";
              } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                errorMessage = "Permission denied. Please check your login credentials.";
              } else {
                errorMessage = `Error: ${error.message}`;
              }
            }
            
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive"
            });
          } finally {
            setIsScanningQR(false);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          overlay: false
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
                  
                  {/* Custom yellow broken line overlay when scanning */}
                  {isScanning && !isScanningQR && (
                    <div className="qr-scanner-overlay"></div>
                  )}
                  
                  {/* Processing indicator */}
                  {isScanningQR && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>Processing QR code...</p>
                        <p className="text-sm opacity-75">Please wait</p>
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

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog} 
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open);
          setShowConfirmDialog(open);
          if (!open) {
            setScannedStudent(null);
            setIsProcessing(false);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md"
          onEscapeKeyDown={() => {
            console.log('Escape key pressed');
            setShowConfirmDialog(false);
            setScannedStudent(null);
            setIsProcessing(false);
          }}
          onInteractOutside={() => {
            console.log('Clicked outside dialog');
            setShowConfirmDialog(false);
            setScannedStudent(null);
            setIsProcessing(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0"
                  onClick={() => {
                    console.log('DialogClose clicked');
                    setScannedStudent(null);
                    setIsProcessing(false);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </DialogClose>
              {(() => {
                const timeInfo = getCurrentTimeInfo();
                if (scannedStudent?.hasRecord) {
                  if (scannedStudent?.record?.time_in && scannedStudent?.record?.time_out) {
                    return 'Student Already Recorded';
                  } else if (scannedStudent?.record?.time_in && !scannedStudent?.record?.time_out) {
                    if (timeInfo.isTimeInWindow) {
                      return 'Student Already Time-In';
                    } else {
                      return 'Ready for Time-Out';
                    }
                  }
                } else {
                  // Check if there's a record for today in recent records
                  const recentRecords = scannedStudent?.recentRecords || [];
                  const today = new Date().toISOString().split('T')[0];
                  const todayRecord = recentRecords.find(record => record.date === today);
                  
                  console.log('Fallback check:', { today, todayRecord, recentRecords });
                  
                  if (todayRecord) {
                    if (todayRecord.time_in && todayRecord.time_out) {
                      return 'Student Already Recorded';
                    } else if (todayRecord.time_in && !todayRecord.time_out) {
                      if (timeInfo.isTimeInWindow) {
                        return 'Student Already Time-In';
                      } else {
                        return 'Ready for Time-Out';
                      }
                    }
                  }
                  return 'Confirm Attendance';
                }
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const timeInfo = getCurrentTimeInfo();
                if (scannedStudent?.hasRecord) {
                  if (scannedStudent?.record?.time_in && scannedStudent?.record?.time_out) {
                    return 'This student has already been recorded for today. Check the details below.';
                  } else if (scannedStudent?.record?.time_in && !scannedStudent?.record?.time_out) {
                    if (timeInfo.isTimeInWindow) {
                      return 'This student is already time-in. Time-out can be recorded between 1:00 PM - 5:00 PM.';
                    } else {
                      return 'This student can record time-out when the time-out window is active.';
                    }
                  }
                                  } else {
                    // Check if there's a record for today in recent records
                    const recentRecords = scannedStudent?.recentRecords || [];
                    const today = new Date().toISOString().split('T')[0];
                    const todayRecord = recentRecords.find(record => record.date === today);
                    
                    if (todayRecord) {
                      if (todayRecord.time_in && todayRecord.time_out) {
                        return 'This student has already been recorded for today. Check the details below.';
                      } else if (todayRecord.time_in && !todayRecord.time_out) {
                        if (timeInfo.isTimeInWindow) {
                          return 'This student is already time-in. Time-out can be recorded between 1:00 PM - 5:00 PM.';
                        } else {
                          return 'This student can record time-out when the time-out window is active.';
                        }
                      }
                    }
                    return 'Please confirm the student information before recording attendance';
                  }
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {scannedStudent?.student && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Student Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">School ID:</span>
                    <span className="font-mono font-medium text-blue-900">{scannedStudent.student.school_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Name:</span>
                    <span className="font-medium text-blue-900">{scannedStudent.student.first_name} {scannedStudent.student.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Year Level:</span>
                    <span className="font-medium text-blue-900">
                      {scannedStudent.student.year_level ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {scannedStudent.student.year_level}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not specified</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Birthdate:</span>
                    <span className="text-blue-900">{new Date(scannedStudent.student.birthdate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {(() => {
                const timeInfo = getCurrentTimeInfo();
                
                // Debug logging
                console.log('Dialog Debug:', {
                  hasRecord: scannedStudent?.hasRecord,
                  record: scannedStudent?.record,
                  recentRecords: scannedStudent?.recentRecords,
                  timeInfo
                });
                
                // Check if student has a record for today (either through hasRecord or recentRecords)
                const hasTodayRecord = scannedStudent?.hasRecord || 
                  (scannedStudent?.recentRecords?.some(record => record.date === new Date().toISOString().split('T')[0]));
                
                if (hasTodayRecord) {
                  // Get the today's record
                  const todayRecord = scannedStudent?.record || 
                    scannedStudent?.recentRecords?.find(record => record.date === new Date().toISOString().split('T')[0]);
                  
                  if (todayRecord?.time_in && todayRecord?.time_out) {
                    // Complete record (both time-in and time-out)
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-900">Already Recorded Today</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-red-700">Time In:</span>
                            <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Time Out:</span>
                            <span className="font-medium text-red-900">{todayRecord.time_out}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Status:</span>
                            <span className="font-medium text-green-700">Complete</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (todayRecord?.time_in && !todayRecord?.time_out) {
                    // Only time-in recorded
                    if (timeInfo.isTimeInWindow) {
                      // During time-in hours - show already time-in message
                      return (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900">Already Time-In</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-red-700">Time In:</span>
                              <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700">Status:</span>
                              <span className="font-medium text-orange-700">Time-In Only</span>
                            </div>
                            <div className="text-sm text-red-700 mt-2">
                              This student is already time-in only. Time-out can be recorded between 1:00 PM - 5:00 PM.
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Outside time-in hours - show ready for time-out
                      return (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-900">Ready for Time-Out</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-orange-700">Time In:</span>
                              <span className="font-medium text-orange-900">{todayRecord.time_in}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-700">Status:</span>
                              <span className="font-medium text-orange-700">Time-In Only</span>
                            </div>
                            <div className="text-sm text-orange-700 mt-2">
                              Student can record time-out when time-out window is active.
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                                 } else {
                   // Check if there's a record for today in recent records
                   const recentRecords = scannedStudent?.recentRecords || [];
                   const today = new Date().toISOString().split('T')[0];
                   const todayRecord = recentRecords.find(record => record.date === today);
                   
                   if (todayRecord) {
                     // Student has a record for today - show appropriate status
                     if (todayRecord.time_in && todayRecord.time_out) {
                       // Complete record for today
                       return (
                         <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                           <div className="flex items-center gap-2 mb-3">
                             <XCircle className="h-4 w-4 text-red-600" />
                             <span className="font-medium text-red-900">Already Recorded Today</span>
                           </div>
                           <div className="space-y-2 text-sm">
                             <div className="flex justify-between">
                               <span className="text-red-700">Time In:</span>
                               <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-red-700">Time Out:</span>
                               <span className="font-medium text-red-900">{todayRecord.time_out}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-red-700">Status:</span>
                               <span className="font-medium text-green-700">Complete</span>
                             </div>
                           </div>
                         </div>
                       );
                     } else if (todayRecord.time_in && !todayRecord.time_out) {
                       // Only time-in recorded for today
                       if (timeInfo.isTimeInWindow) {
                         // During time-in hours - show already time-in message
                         return (
                           <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                             <div className="flex items-center gap-2 mb-3">
                               <XCircle className="h-4 w-4 text-red-600" />
                               <span className="font-medium text-red-900">Already Time-In</span>
                             </div>
                             <div className="space-y-2 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-red-700">Time In:</span>
                                 <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-red-700">Status:</span>
                                 <span className="font-medium text-orange-700">Time-In Only</span>
                               </div>
                               <div className="text-sm text-red-700 mt-2">
                                 This student is already time-in only. Time-out can be recorded between 1:00 PM - 5:00 PM.
                               </div>
                             </div>
                           </div>
                         );
                       } else {
                         // Outside time-in hours - show ready for time-out
                         return (
                           <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                             <div className="flex items-center gap-2 mb-3">
                               <Clock className="h-4 w-4 text-orange-600" />
                               <span className="font-medium text-orange-900">Ready for Time-Out</span>
                             </div>
                             <div className="space-y-2 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-orange-700">Time In:</span>
                                 <span className="font-medium text-orange-900">{todayRecord.time_in}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-orange-700">Status:</span>
                                 <span className="font-medium text-orange-700">Time-In Only</span>
                               </div>
                               <div className="text-sm text-orange-700 mt-2">
                                 Student can record time-out when time-out window is active.
                               </div>
                             </div>
                           </div>
                         );
                       }
                     }
                   } else {
                     // No record for today - show ready to record with history
                     const hasRecentRecords = recentRecords.length > 0;
                   
                     if (timeInfo.isTimeInWindow) {
                       return (
                         <div className="space-y-3">
                           <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                             <div className="flex items-center gap-2 mb-3">
                               <CheckCircle className="h-4 w-4 text-green-600" />
                               <span className="font-medium text-green-900">Ready to Record</span>
                             </div>
                             <div className="text-sm text-green-800">
                               This student has not been recorded today. Ready to record time-in.
                             </div>
                           </div>
                           
                           {hasRecentRecords && (
                             <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                               <div className="flex items-center gap-2 mb-3">
                                 <Clock className="h-4 w-4 text-gray-600" />
                                 <span className="font-medium text-gray-900">Recent Attendance History</span>
                               </div>
                               <div className="space-y-2 text-sm">
                                 {recentRecords.map((record, index) => (
                                   <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                                     <div>
                                       <span className="font-medium text-gray-700">{record.date}</span>
                                       <div className="text-xs text-gray-500">
                                         {record.time_in && `Time-in: ${record.time_in}`}
                                         {record.time_in && record.time_out && ' | '}
                                         {record.time_out && `Time-out: ${record.time_out}`}
                                       </div>
                                     </div>
                                     <span className={`text-xs px-2 py-1 rounded ${
                                       record.time_in && record.time_out 
                                         ? 'bg-green-100 text-green-700' 
                                         : 'bg-orange-100 text-orange-700'
                                     }`}>
                                       {record.time_in && record.time_out ? 'Complete' : 'Partial'}
                                     </span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                       );
                     } else if (timeInfo.isTimeOutWindow) {
                       // During time-out hours, check if student has time-in but no time-out
                       return (
                         <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                           <div className="flex items-center gap-2 mb-3">
                             <Clock className="h-4 w-4 text-blue-600" />
                             <span className="font-medium text-blue-900">Ready for Time-Out</span>
                           </div>
                           <div className="text-sm text-blue-800">
                             Student can record time-out now (1:00 PM - 5:00 PM).
                           </div>
                         </div>
                       );
                     } else {
                       return (
                         <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                           <div className="flex items-center gap-2 mb-3">
                             <Clock className="h-4 w-4 text-yellow-600" />
                             <span className="font-medium text-yellow-900">Time-In Not Available</span>
                           </div>
                           <div className="text-sm text-yellow-800">
                             This student has not been recorded today, but time-in is only allowed between 7:00 AM - 11:30 AM.
                           </div>
                         </div>
                       );
                     }
                   }
                 }
              })()}


              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Current time: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Close button clicked');
                setShowConfirmDialog(false);
                setScannedStudent(null);
                setIsProcessing(false);
              }}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {(() => {
              const timeInfo = getCurrentTimeInfo();
              const canRecord = (!scannedStudent?.hasRecord && timeInfo.isTimeInWindow) || 
                               (scannedStudent?.hasRecord && !scannedStudent?.record.time_out && timeInfo.isTimeOutWindow);
              
              if (canRecord) {
                return (
                  <Button
                    onClick={handleConfirmAttendance}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Recording...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Record {!scannedStudent?.hasRecord ? 'Time-In' : 'Time-Out'}
                      </>
                    )}
                  </Button>
                );
              }
              return null;
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scan;