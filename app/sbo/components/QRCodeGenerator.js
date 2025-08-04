"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Download } from "lucide-react";

const QRCodeGenerator = () => {
    const [studentData, setStudentData] = useState({
        student_id: "STU001",
        name: "John Doe",
        tribe: "Tribe Alpha"
    });
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    const generateQRCode = () => {
        // Generate QR code with just the student ID for scanner compatibility
        const qrData = studentData.student_id;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
        setQrCodeUrl(qrUrl);
    };

    const downloadQRCode = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = `qr-${studentData.student_id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
                <CardTitle className="flex items-center text-white">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="student_id" className="text-white">Student ID</Label>
                        <Input
                            id="student_id"
                            value={studentData.student_id}
                            onChange={(e) => setStudentData(prev => ({ ...prev, student_id: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Enter student ID"
                        />
                    </div>
                    <div>
                        <Label htmlFor="name" className="text-white">Name</Label>
                        <Input
                            id="name"
                            value={studentData.name}
                            onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Enter student name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="tribe" className="text-white">Tribe</Label>
                        <Input
                            id="tribe"
                            value={studentData.tribe}
                            onChange={(e) => setStudentData(prev => ({ ...prev, tribe: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Enter tribe name"
                        />
                    </div>
                </div>

                <Button
                    onClick={generateQRCode}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                >
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                </Button>

                {qrCodeUrl && (
                    <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded-lg inline-block">
                            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                        </div>
                        <div>
                            <Button
                                onClick={downloadQRCode}
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR Code
                            </Button>
                        </div>
                        <div className="text-sm text-white/70">
                            <p><strong>QR Code Data:</strong> {studentData.student_id}</p>
                            <p><strong>Student Name:</strong> {studentData.name}</p>
                            <p><strong>Tribe:</strong> {studentData.tribe}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default QRCodeGenerator; 