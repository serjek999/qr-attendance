"use client";

import { Button } from "@/components/ui/button";
import { QrCode, Camera, X } from "lucide-react";

const ScannerModal = ({
    isFullScreenScanner,
    isScanning,
    onClose,
    onStartScanning,
    onStopScanning,
    getCurrentTimeInfo
}) => {
    if (!isFullScreenScanner) return null;

    const timeInfo = getCurrentTimeInfo();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Advanced QR Scanner</h2>
                            <p className="text-sm text-gray-600">Scan student QR codes for attendance</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Scanner Content */}
                <div className="p-6">
                    {/* Time Status */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">Current Time Status:</h3>
                        <div className="text-blue-800">
                            {timeInfo.message}
                        </div>
                        {!timeInfo.canScan && (
                            <div className="mt-2 text-red-600 text-sm">
                                ⚠️ Attendance recording is only allowed during specified time windows.
                            </div>
                        )}
                    </div>

                    {/* Scanner Area */}
                    <div className="space-y-4">
                        {!isScanning ? (
                            <div className="text-center py-12">
                                <div className="mb-6">
                                    <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Ready to Scan
                                    </h3>
                                    <p className="text-gray-600">
                                        Click the button below to start the QR scanner
                                    </p>
                                </div>
                                <Button
                                    onClick={onStartScanning}
                                    size="lg"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <QrCode className="h-5 w-5 mr-2" />
                                    Start Scanner
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Scanner Status */}
                                <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-800 font-medium">Scanner Active</span>
                                </div>

                                {/* QR Scanner Container */}
                                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                                    <div
                                        id="qr-reader-fullscreen"
                                        className="w-full h-96"
                                    ></div>

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
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={onStopScanning}
                                        variant="outline"
                                        className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    >
                                        Stop Scanner
                                    </Button>
                                </div>

                                {/* Instructions */}
                                <div className="text-center text-sm text-gray-600">
                                    <p>Position the QR code within the yellow border to scan</p>
                                    <p className="mt-1">Make sure the QR code is clearly visible and well-lit</p>
                                </div>


                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScannerModal; 