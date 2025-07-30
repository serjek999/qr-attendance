"use client";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  QrCode,
  Download,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { authUtils } from "../lib/auth";

const Student = () => {
  const [formData, setFormData] = useState({
    schoolId: "",
    lastName: "",
    firstName: "",
    birthdate: "",
  });
  const [loginData, setLoginData] = useState({
    schoolId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistrationMode, setIsRegistrationMode] = useState(true);
  const qrRef = useRef(null);
  const { toast } = useToast();

  const generatePassword = (lastName, birthdate) => {
    return `${lastName}${birthdate}`;
  };

  const generateQRCode = async (schoolId) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(schoolId, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (formData.lastName && formData.birthdate) {
      const password = generatePassword(formData.lastName, formData.birthdate);
      setGeneratedPassword(password);
    }
  }, [formData.lastName, formData.birthdate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.schoolId || !formData.lastName || !formData.firstName || !formData.birthdate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authUtils.registerStudent({
        schoolId: formData.schoolId,
        lastName: formData.lastName,
        firstName: formData.firstName,
        birthdate: formData.birthdate
      });

      if (result.success) {
        await generateQRCode(formData.schoolId);
        setIsRegistered(true);
        toast({
          title: "Registration Successful! 🎉",
          description: result.message
        });
      } else {
        // Check if the error is due to existing account
        if (result.message.includes('already exists')) {
          toast({
            title: "Account Already Exists",
            description: "This School ID is already registered. Please use the login form instead.",
            variant: "destructive"
          });
          // Switch to login mode
          setIsRegistrationMode(false);
          setLoginData(prev => ({ ...prev, schoolId: formData.schoolId }));
        } else {
          toast({
            title: "Registration Failed",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.schoolId || !loginData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoginLoading(true);

    try {
      // Get student data to verify credentials
      const studentResult = await authUtils.getStudentBySchoolId(loginData.schoolId);
      
      if (!studentResult.success) {
        toast({
          title: "Login Failed",
          description: "Student not found. Please check your School ID.",
          variant: "destructive"
        });
        return;
      }

      const student = studentResult.data;
      
      // Verify password
      const isValidPassword = await authUtils.verifyPassword(loginData.password, student.password_hash);
      
      if (!isValidPassword) {
        toast({
          title: "Login Failed",
          description: "Invalid password. Please check your credentials.",
          variant: "destructive"
        });
        return;
      }

      // Login successful
      await generateQRCode(loginData.schoolId);
      setIsLoggedIn(true);
      setFormData({
        schoolId: student.school_id,
        lastName: student.last_name,
        firstName: student.first_name,
        birthdate: student.birthdate,
      });
      
      toast({
        title: "Login Successful! ✅",
        description: `Welcome back, ${student.first_name} ${student.last_name}!`
      });
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.download = `${formData.schoolId}-qr-code.png`;
      link.href = qrCodeUrl;
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved to your device"
      });
    }
  };

  if (isRegistered || isLoggedIn) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="container mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card variant="gradient" className="text-center">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl text-primary">
                {isRegistered ? "Registration Complete!" : "Login Successful!"}
              </CardTitle>
              <CardDescription className="text-lg">
                Welcome, {formData.lastName}! {isRegistered ? "Your student account has been created." : "You have successfully logged in."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-white/50 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Your Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">School ID</Label>
                    <p className="font-mono text-lg text-foreground">{formData.schoolId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    <p className="text-lg text-foreground">{formData.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    <p className="text-lg text-foreground">{formData.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Birthdate</Label>
                    <p className="text-lg text-foreground">{formData.birthdate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                    <p className="font-mono text-lg text-foreground">{generatedPassword}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-inner">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Your QR Code</h3>
                <div ref={qrRef} className="flex justify-center mb-4">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="Student QR Code"
                      className="border-2 border-primary/20 rounded-lg shadow-md"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Save this QR code! You&apos;ll need to show it to SBO officers for attendance tracking.
                </p>
                <Button onClick={downloadQR} variant="academic" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Important Reminders:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Time-in is allowed from 7:00 AM to 11:30 AM</li>
                  <li>• Time-out is allowed from 1:00 PM to 5:00 PM</li>
                  <li>• Keep your QR code accessible on your phone</li>
                  <li>• Contact SBO if you encounter any issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
    <div className="container mx-auto px-4">
      <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <div className="max-w-md mx-auto">
        <Card variant="gradient">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">
              {isRegistrationMode ? "Student Registration" : "Student Login"}
            </CardTitle>
            <CardDescription>
              {isRegistrationMode 
                ? "Create your account to get your attendance QR code"
                : "Login to access your attendance QR code"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Toggle between Registration and Login */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <Button
                type="button"
                variant={isRegistrationMode ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsRegistrationMode(true)}
              >
                Register
              </Button>
              <Button
                type="button"
                variant={!isRegistrationMode ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsRegistrationMode(false)}
              >
                Login
              </Button>
            </div>

            {isRegistrationMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolId">School ID</Label>
                <Input
                  id="schoolId"
                  name="schoolId"
                  type="text"
                  placeholder="e.g., 2021-001234"
                  value={formData.schoolId}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="e.g., DelaCruz"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g., Juan"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {generatedPassword && (
                <div className="space-y-2">
                  <Label>Generated Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={generatedPassword}
                      readOnly
                      className="font-mono bg-muted/30"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your password is: LastName + Birthdate
                  </p>
                </div>
              )}

              <Button type="submit" variant="academic" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Registering...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Register & Generate QR
                  </>
                )}
              </Button>
            </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginSchoolId">School ID</Label>
                  <Input
                    id="loginSchoolId"
                    name="schoolId"
                    type="text"
                    placeholder="e.g., 2021-001234"
                    value={loginData.schoolId}
                    onChange={handleLoginInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      name="password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your password is: LastName + Birthdate
                  </p>
                </div>

                <Button type="submit" variant="academic" className="w-full" disabled={isLoginLoading}>
                  {isLoginLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Login & Get QR Code
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
};

export default Student;
