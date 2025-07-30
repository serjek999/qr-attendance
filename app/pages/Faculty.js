"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Calendar, Clock, Search, ArrowLeft, Download, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { authUtils } from "../lib/auth";

const Faculty = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    schoolId: "",
    studentName: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await authUtils.loginFaculty(loginData.username, loginData.password);
      
      if (result.success) {
        setIsLoggedIn(true);
        setUser(result.faculty);
        
        // Load attendance records
        loadAttendanceRecords();
        
        toast({
          title: "Login Successful! 🎉",
          description: `Welcome, ${result.faculty.full_name}`
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const result = await authUtils.getAttendanceRecords();
      
      if (result.success) {
        const formattedRecords = result.data.map(record => ({
          id: record.id,
          schoolId: record.school_id,
          studentName: record.student_name,
          date: record.date,
          timeIn: record.time_in,
          timeOut: record.time_out,
          status: record.status
        }));
        
        setAttendanceRecords(formattedRecords);
        setFilteredRecords(formattedRecords);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    let filtered = attendanceRecords;
    
    if (newFilters.date) {
      filtered = filtered.filter(record => record.date === newFilters.date);
    }
    
    if (newFilters.schoolId) {
      filtered = filtered.filter(record => 
        record.schoolId.toLowerCase().includes(newFilters.schoolId.toLowerCase())
      );
    }
    
    if (newFilters.studentName) {
      filtered = filtered.filter(record =>
        record.studentName.toLowerCase().includes(newFilters.studentName.toLowerCase())
      );
    }
    
    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setFilters({ date: "", schoolId: "", studentName: "" });
    setFilteredRecords(attendanceRecords);
  };

  const exportAttendance = async () => {
    try {
      const result = await authUtils.exportAttendanceCSV(filters);
      
      if (result.success) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: "Attendance report has been downloaded"
        });
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance report",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: "bg-green-100 text-green-800 border-green-200",
      partial: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      absent: "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatistics = () => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const partial = filteredRecords.filter(r => r.status === 'partial').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    
    return { total, present, partial, absent };
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-md mx-auto">
            <Card variant="gradient">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">Faculty Login</CardTitle>
                <CardDescription>
                  Access the attendance management dashboard
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button type="submit" variant="academic" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Login
                      </>
                    )}
                  </Button>
                </form>
                

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{user?.full_name}</span>
            </div>
            <Button 
              onClick={() => {
                setIsLoggedIn(false);
                setUser(null);
                setAttendanceRecords([]);
                setFilteredRecords([]);
              }} 
              variant="outline"
            >
              Logout
            </Button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <Card variant="gradient" className="mb-8">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl text-primary">Faculty Dashboard</CardTitle>
              <CardDescription className="text-lg">
                Welcome, {user?.full_name}! Student Attendance Management System
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Partial</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Export */}
          <Card variant="elevated" className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2 text-primary" />
                Filters & Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFilter">Date</Label>
                  <Input
                    id="dateFilter"
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schoolIdFilter">School ID</Label>
                  <Input
                    id="schoolIdFilter"
                    type="text"
                    placeholder="Search by School ID"
                    value={filters.schoolId}
                    onChange={(e) => handleFilterChange('schoolId', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentNameFilter">Student Name</Label>
                  <Input
                    id="studentNameFilter"
                    type="text"
                    placeholder="Search by name"
                    value={filters.studentName}
                    onChange={(e) => handleFilterChange('studentName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="block">Actions</Label>
                  <div className="flex gap-2">
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear
                    </Button>
                    <Button onClick={exportAttendance} variant="academic" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Attendance Records
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredRecords.length} records
                </span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground">School ID</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Student Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Time In</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Time Out</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No attendance records found</p>
                          <p className="text-sm">Adjust your filters or check back later</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-mono">{record.schoolId}</td>
                          <td className="p-3">{record.studentName}</td>
                          <td className="p-3">{record.date}</td>
                          <td className="p-3 font-mono">
                            {record.timeIn ? (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-green-600" />
                                {record.timeIn}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--:--:--</span>
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            {record.timeOut ? (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-blue-600" />
                                {record.timeOut}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--:--:--</span>
                            )}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(record.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Faculty;