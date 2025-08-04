"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { QrCode, Camera, X, AlertCircle } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

const FixedQRScanner = ({ onScan, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const videoRef = useRef(null);
    const qrScannerRef = useRef(null);

    // Check if current time is within allowed scanning windows
    const getCurrentTimeInfo = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Time-in window: 7:00 AM - 11:30 AM
        const isTimeInWindow = (currentHour === 7 && currentMinute >= 0) ||
            (currentHour > 7 && currentHour < 11) ||
            (currentHour === 11 && currentMinute <= 30);

        // Time-out window: 1:00 PM - 5:00 PM
        const isTimeOutWindow = currentHour >= 13 && currentHour < 17;

        const canScan = isTimeInWindow || isTimeOutWindow;

        let message = `Current time: ${timeString}`;
        if (isTimeInWindow) {
            message += " - Time In Window (7:00 AM - 11:30 AM)";
        } else if (isTimeOutWindow) {
            message += " - Time Out Window (1:00 PM - 5:00 PM)";
        } else {
            message += " - Outside scanning hours";
        }

        return {
            time: timeString,
            isTimeInWindow,
            isTimeOutWindow,
            canScan,
            message
        };
    };

    // Test function for development
    const testScan = () => {
        console.log('Test scan triggered');
        const testData = 'STU001';
        console.log('Calling handleScanSuccess with test data:', testData);
        handleScanSuccess(testData);
    };

    const startScanner = async () => {
        try {
            setError(null);
            setIsScanning(true);
            setDebugInfo('Starting scanner...');

            // Check camera permissions first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // Stop the test stream
                console.log('Camera permissions granted');
                setDebugInfo('Camera permissions granted');
            } catch (permissionError) {
                console.error('Camera permission denied:', permissionError);
                setError('Camera access denied. Please allow camera permissions and try again.');
                setIsScanning(false);
                toast({
                    title: "Camera Error",
                    description: "Please allow camera access to use the QR scanner",
                    variant: "destructive"
                });
                return;
            }

            // Wait for the video element to be available
            const waitForElement = (elementId, maxAttempts = 100) => {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    const checkElement = () => {
                        attempts++;
                        const element = document.getElementById(elementId);
                        if (element) {
                            resolve(element);
                        } else if (attempts >= maxAttempts) {
                            reject(new Error(`HTML Element with id=${elementId} not found after ${maxAttempts * 50}ms`));
                        } else {
                            setTimeout(checkElement, 50);
                        }
                    };
                    checkElement();
                });
            };

            // Wait for the video element
            console.log('Waiting for video element...');
            await waitForElement('qr-scanner-video');
            console.log('Video element found, initializing scanner...');
            setDebugInfo('Video element found, initializing scanner...');

            const videoElement = document.getElementById('qr-scanner-video');
            if (!videoElement) {
                throw new Error('Video element not found');
            }

            // Initialize QR Scanner
            qrScannerRef.current = new QrScanner(
                videoElement,
                (result) => {
                    console.log('QR Code detected:', result.data);
                    handleScanSuccess(result.data);
                },
                {
                    onDecodeError: (error) => {
                        // Filter out common non-critical errors that are normal during scanning
                        const errorMessage = error?.message || error?.toString() || '';
                        const nonCriticalErrors = [
                            'No QR code found',
                            'NoQRCodeFoundError',
                            'QRCodeParseError',
                            'No QR code detected',
                            'No barcode found',
                            'No QR code detected in camera view'
                        ];

                        const isNonCritical = nonCriticalErrors.some(nonCritical =>
                            errorMessage.includes(nonCritical)
                        );

                        if (!isNonCritical) {
                            console.error('QR scan error:', error);
                        }
                    },
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    overlay: null, // We'll use our custom overlay
                    maxScansPerSecond: 5,
                    returnDetailedScanResult: true
                }
            );

            // Start scanning
            await qrScannerRef.current.start();
            console.log('QR Scanner started successfully');
            setDebugInfo('QR Scanner started successfully');

            toast({
                title: "Scanner Started",
                description: "QR scanner is now active",
            });
        } catch (err) {
            console.error('Scanner error:', err);
            setError(`Failed to start scanner: ${err.message}. Please try again.`);
            setIsScanning(false);
            toast({
                title: "Scanner Error",
                description: "Failed to start scanner. Please try again.",
                variant: "destructive"
            });
        }
    };

    const stopScanner = () => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
        setIsScanning(false);
        setError(null);
        setDebugInfo('');
    };

    const handleScanSuccess = (data) => {
        console.log('QR Code scanned successfully:', data);

        // Validate the scanned data
        if (!data || typeof data !== 'string') {
            console.error('Invalid QR data received:', data);
            toast({
                title: "Scan Error",
                description: "Invalid QR code data received",
                variant: "destructive"
            });
            return;
        }

        // Clean the data
        const cleanData = data.trim();
        if (!cleanData) {
            console.error('Empty QR data after cleaning');
            toast({
                title: "Scan Error",
                description: "Empty QR code data",
                variant: "destructive"
            });
            return;
        }

        console.log('Cleaned QR data:', cleanData);
        console.log('Calling onScan callback with data:', cleanData);

        // Stop the scanner
        stopScanner();

        // Call the onScan callback with the cleaned data
        onScan(cleanData);

        console.log('onScan callback completed');
    };

    const handleStartScanning = () => {
        startScanner();
    };

    const handleStopScanning = () => {
        stopScanner();
    };

    useEffect(() => {
        return () => {
            stopScanner();
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
                            <h3 className="text-lg font-semibold text-white mb-2">Scanner Error</h3>
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

                                {/* Time Restriction Info */}
                                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-white mb-2">Scanning Hours:</h4>
                                    <div className="text-sm text-white/70 space-y-1">
                                        <p>🕖 <strong>Time In:</strong> 7:00 AM - 11:30 AM</p>
                                        <p>🕐 <strong>Time Out:</strong> 1:00 PM - 5:00 PM</p>
                                    </div>
                                    <div className="mt-3 p-2 bg-white/10 rounded">
                                        <p className="text-sm font-medium text-white">
                                            {getCurrentTimeInfo().message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStartScanning}
                                size="lg"
                                disabled={!getCurrentTimeInfo().canScan}
                                className={`${getCurrentTimeInfo().canScan
                                        ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                                        : 'bg-gray-500/50 border-gray-400/30 text-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                <QrCode className="h-5 w-5 mr-2" />
                                {getCurrentTimeInfo().canScan ? 'Start Scanner' : 'Outside Scanning Hours'}
                            </Button>

                            {!getCurrentTimeInfo().canScan && (
                                <p className="text-sm text-red-400 mt-3">
                                    ⚠️ Scanning is only allowed during specified time windows
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Scanner Status */}
                            <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">Scanner Active</span>
                            </div>

                            {/* Time Status */}
                            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3">
                                <div className="text-center">
                                    <p className="text-sm text-white/70 mb-1">Current Time Window</p>
                                    <p className="text-white font-medium">
                                        {getCurrentTimeInfo().message}
                                    </p>
                                    <p className="text-xs text-white/50 mt-1">
                                        {getCurrentTimeInfo().isTimeInWindow ? 'Recording Time In' :
                                            getCurrentTimeInfo().isTimeOutWindow ? 'Recording Time Out' :
                                                'Outside scanning hours'}
                                    </p>
                                </div>
                            </div>

                            {/* QR Scanner Container */}
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                                <video
                                    id="qr-scanner-video"
                                    className="w-full h-96 object-cover"
                                ></video>

                                {/* Scanner Overlay - Removed yellow border */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-64 h-64">
                                            {/* Overlay removed */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center gap-4">
                                <Button
                                    onClick={handleStopScanning}
                                    variant="outline"
                                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                >
                                    Stop Scanner
                                </Button>

                                {/* Removed test scan button */}
                            </div>

                            {/* Debug Info */}
                            {debugInfo && (
                                <div className="text-center text-xs text-white/50 bg-black/20 p-2 rounded">
                                    <p>Debug: {debugInfo}</p>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="text-center text-sm text-white/70">
                                <p>Position the QR code in the center of the camera view to scan</p>
                                <p className="mt-1">Make sure the QR code is clearly visible and well-lit</p>
                                {/* Removed test mode hint */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FixedQRScanner; 