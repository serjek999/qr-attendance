"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { QrCode, Camera, X, AlertCircle } from "lucide-react";
import { toast } from '@/hooks/use-toast';

const FixedQRScanner = ({ onScan, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            setError(null);

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsScanning(true);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied. Please allow camera permissions and try again.');
            toast({
                title: "Camera Error",
                description: "Please allow camera access to use the QR scanner",
                variant: "destructive"
            });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
        setError(null);
    };

    const handleStartScanning = () => {
        startCamera();
    };

    const handleStopScanning = () => {
        stopCamera();
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">QR Code Scanner</h2>
                            <p className="text-sm text-white/70">Scan student QR codes for attendance</p>
                        </div>
                    </div>
                    <Button
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                        size="sm"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Scanner Content */}
                <div className="p-6">
                    {error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Camera Error</h3>
                            <p className="text-white/70 mb-6">{error}</p>
                            <Button
                                onClick={handleStartScanning}
                                size="lg"
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                            >
                                <Camera className="h-5 w-5 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    ) : !isScanning ? (
                        <div className="text-center py-12">
                            <div className="mb-6">
                                <Camera className="h-16 w-16 text-white/50 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Ready to Scan
                                </h3>
                                <p className="text-white/70 mb-6">
                                    Click the button below to start the QR scanner
                                </p>
                            </div>
                            <Button
                                onClick={handleStartScanning}
                                size="lg"
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                            >
                                <QrCode className="h-5 w-5 mr-2" />
                                Start Scanner
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Scanner Status */}
                            <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">Scanner Active</span>
                            </div>

                            {/* Video Container */}
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    className="w-full h-96 object-cover"
                                    autoPlay
                                    playsInline
                                    muted
                                />

                                {/* Scanner Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-64 h-64 border-4 border-yellow-400 border-dashed rounded-lg">
                                            <div className="qr-scanner-overlay"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center">
                                <Button
                                    onClick={handleStopScanning}
                                    variant="outline"
                                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                >
                                    Stop Scanner
                                </Button>
                            </div>

                            {/* Instructions */}
                            <div className="text-center text-sm text-white/70">
                                <p>Position the QR code within the yellow border to scan</p>
                                <p className="mt-1">Make sure the QR code is clearly visible and well-lit</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FixedQRScanner; 