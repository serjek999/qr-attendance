"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, ArrowLeft, UserPlus, GraduationCap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { authUtils } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabaseClient";

const AuthForm = ({ onAuth }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [registrationData, setRegistrationData] = useState({
    schoolId: "",
    lastName: "",
    firstName: "",
    middleName: "",
    yearLevel: "",
    tribe: "",
    birthdate: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get tribes from database
  const [tribes, setTribes] = useState([]);
  const [yearLevels] = useState([
    { value: "y1", label: "Year 1" },
    { value: "y2", label: "Year 2" },
    { value: "y3", label: "Year 3" },
    { value: "y4", label: "Year 4" }
  ]);

  // Load tribes on component mount
  useEffect(() => {
    loadTribes();
  }, []);

  const loadTribes = async () => {
    try {
      const { data, error } = await supabase
        .from('tribes')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading tribes:', error);
      } else {
        setTribes(data || []);
      }
    } catch (error) {
      console.error('Error loading tribes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      let userType = 'student';
      let email = credentials.username;

      // Try to authenticate as different user types
      // First, try as admin
      result = await authUtils.loginAdmin(email, credentials.password);
      if (result.success) {
        userType = 'admin';
      } else {
        // Try as faculty
        result = await authUtils.loginFaculty(email, credentials.password);
        if (result.success) {
          userType = 'faculty';
        } else {
          // Try as SBO officer
          result = await authUtils.loginSBO(email, credentials.password);
          if (result.success) {
            userType = 'sbo';
          } else {
            // Finally, try as student
            result = await authUtils.loginStudent(credentials.username, credentials.password);
            if (result.success) {
              userType = 'student';
            }
          }
        }
      }

      if (result.success) {
        const userData = {
          ...result[userType] || result.student,
          role: userType
        };

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.full_name || userData.first_name}!`,
        });
        onAuth(userData);
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid username or password.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegistrationChange = (field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      const requiredFields = ['schoolId', 'lastName', 'firstName', 'yearLevel', 'tribe', 'birthdate'];
      const missingFields = requiredFields.filter(field => !registrationData[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Registration Failed",
          description: `Please fill in all required fields: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Register student using authUtils
      const result = await authUtils.registerStudent(registrationData);

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `Welcome ${registrationData.firstName}! Your password is: ${registrationData.lastName}${registrationData.birthdate}`,
        });

        // Auto-login the student
        const loginResult = await authUtils.loginStudent(registrationData.schoolId, `${registrationData.lastName}${registrationData.birthdate}`);
        
        if (loginResult.success) {
          const userData = {
            ...loginResult.student,
            role: 'student'
          };
          onAuth(userData);
        }
      } else {
        toast({
          title: "Registration Failed",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#13392F' }}>
      <div className="container mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-white hover:text-white/80 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Logo size="large" useImage={true} />
              </div>
              <CardTitle className="text-2xl text-white">
                {isLoginMode ? "Login" : "Student Registration"}
              </CardTitle>
              <CardDescription className="text-white/70">
                {isLoginMode 
                  ? "Enter your credentials to access the system"
                  : "Create your student account"
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoginMode ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center text-white">
                        <User className="h-4 w-4 mr-2" />
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Student ID or username@domain"
                        value={credentials.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        required
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 transition-all duration-300 focus:ring-2 focus:ring-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center text-white">
                        <Lock className="h-4 w-4 mr-2" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={credentials.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                          className="pr-10 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 transition-all duration-300 focus:ring-2 focus:ring-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="mt-6 p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                    <p className="text-sm text-white/70 mb-2">Login Formats:</p>
                    <div className="space-y-1 text-xs text-white/50">
                      <p><strong>Students:</strong> School ID (e.g., 2023123456)</p>
                      <p><strong>Faculty/SBO/Admin:</strong> Email address (e.g., jake@example.com)</p>
                      <p><strong>Password:</strong> Check with your administrator</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-white/70 mb-2">
                      Are you a student? Create your account below
                    </p>
                    <Button
                      type="button"
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                      onClick={() => setIsLoginMode(false)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register as Student
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <form onSubmit={handleRegistration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolId" className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        School ID *
                      </Label>
                      <Input
                        id="schoolId"
                        type="text"
                        placeholder="e.g., 2023123456"
                        value={registrationData.schoolId}
                        onChange={(e) => handleRegistrationChange("schoolId", e.target.value)}
                        required
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last Name"
                          value={registrationData.lastName}
                          onChange={(e) => handleRegistrationChange("lastName", e.target.value)}
                          required
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First Name"
                          value={registrationData.firstName}
                          onChange={(e) => handleRegistrationChange("firstName", e.target.value)}
                          required
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        type="text"
                        placeholder="Middle Name (Optional)"
                        value={registrationData.middleName}
                        onChange={(e) => handleRegistrationChange("middleName", e.target.value)}
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yearLevel">Year Level *</Label>
                        <Select
                          value={registrationData.yearLevel}
                          onValueChange={(value) => handleRegistrationChange("yearLevel", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearLevels.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tribe">Tribe *</Label>
                        <Select
                          value={registrationData.tribe}
                          onValueChange={(value) => handleRegistrationChange("tribe", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Tribe" />
                          </SelectTrigger>
                          <SelectContent>
                            {tribes.map((tribe) => (
                              <SelectItem key={tribe.id} value={tribe.id}>
                                {tribe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthdate">Birthdate *</Label>
                      <Input
                        id="birthdate"
                        type="date"
                        value={registrationData.birthdate}
                        onChange={(e) => handleRegistrationChange("birthdate", e.target.value)}
                        required
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your password will be: LastName + Birthdate (e.g., Smith2023-01-15)
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsLoginMode(true)}
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 