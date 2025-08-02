"use client";

import { useState, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/app/lib/supabaseClient';

export const useScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [isFullScreenScanner, setIsFullScreenScanner] = useState(false);
    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [scannedStudentInfo, setScannedStudentInfo] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const html5QrScannerRef = useRef(null);

    const getCurrentTimeInfo = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        const isTimeInWindow = currentHour >= 7 && currentHour < 12;
        const isTimeOutWindow = currentHour >= 13 && currentHour < 17;
        const canScan = isTimeInWindow || isTimeOutWindow;

        let message = `Current time: ${timeString}`;
        if (isTimeInWindow) {
            message += " - Time In Window (7:00 AM - 12:00 PM)";
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
    }, []);

    const startFullScreenScanning = useCallback(async () => {
        try {
            console.log('Starting QR scanner...');

            // Check camera permissions first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // Stop the test stream
                console.log('Camera permissions granted');
            } catch (permissionError) {
                console.error('Camera permission denied:', permissionError);
                toast({
                    title: "Camera Permission Required",
                    description: "Please allow camera access to use the QR scanner",
                    variant: "destructive"
                });
                return;
            }

            setIsFullScreenScanner(true);
            setIsScanning(true);

            // Wait for modal to render with better timing
            const waitForElement = (elementId, maxAttempts = 50) => {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    const checkElement = () => {
                        attempts++;
                        const element = document.getElementById(elementId);
                        console.log(`Attempt ${attempts}: Looking for element ${elementId}`, element ? 'Found' : 'Not found');
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

            // Wait for the element to be available
            console.log('Waiting for qr-reader-fullscreen element...');
            await waitForElement('qr-reader-fullscreen');
            console.log('Element found, initializing scanner...');

            // Clear any existing content
            const element = document.getElementById('qr-reader-fullscreen');
            if (element) {
                element.innerHTML = '';
                // Add a small delay to ensure the element is ready
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Initialize the scanner with more robust configuration
            html5QrScannerRef.current = new Html5QrcodeScanner(
                'qr-reader-fullscreen',
                {
                    fps: 8, // Reduced FPS for better stability
                    qrbox: { width: 250, height: 250 }, // Smaller box for better focus
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    aspectRatio: 1.0,
                    disableFlip: false,
                    supportedScanTypes: [
                        Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                        Html5QrcodeScanType.SCAN_TYPE_FILE
                    ],
                    // Remove experimental features that cause BarcodeDetector errors
                    // experimentalFeatures: {
                    //     useBarCodeDetectorIfSupported: true
                    // },
                    // Add more robust configuration
                    formatsToSupport: [
                        'QR_CODE',
                        'AZTEC',
                        'CODABAR',
                        'CODE_39',
                        'CODE_93',
                        'CODE_128',
                        'DATA_MATRIX',
                        'MAXICODE',
                        'ITF',
                        'EAN_13',
                        'EAN_8',
                        'PDF_417',
                        'RSS_14',
                        'RSS_EXPANDED',
                        'UPC_A',
                        'UPC_E',
                        'UPC_EAN_EXTENSION'
                    ]
                },
                false
            );

            console.log('Scanner created, rendering...');

            try {
                html5QrScannerRef.current.render(handleScanSuccess, handleScanError);
                console.log('Scanner rendered successfully');
            } catch (renderError) {
                console.error('Error rendering scanner with advanced config:', renderError);

                // Try with a simpler configuration as fallback
                console.log('Trying fallback scanner configuration...');

                const fallbackScanner = new Html5QrcodeScanner(
                    'qr-reader-fullscreen',
                    {
                        fps: 5, // Even lower FPS for fallback
                        qrbox: { width: 200, height: 200 }, // Smaller box
                        rememberLastUsedCamera: true,
                        showTorchButtonIfSupported: true,
                        showZoomSliderIfSupported: true,
                        aspectRatio: 1.0,
                        disableFlip: false,
                        // Minimal format support for fallback
                        formatsToSupport: ['QR_CODE']
                    },
                    false
                );

                try {
                    fallbackScanner.render(handleScanSuccess, handleScanError);
                    html5QrScannerRef.current = fallbackScanner;
                    console.log('Fallback scanner rendered successfully');
                } catch (fallbackError) {
                    console.error('Fallback scanner also failed:', fallbackError);

                    // Try with the most basic configuration
                    console.log('Trying basic scanner configuration...');
                    const basicScanner = new Html5QrcodeScanner(
                        'qr-reader-fullscreen',
                        {
                            fps: 3,
                            qrbox: { width: 150, height: 150 },
                            rememberLastUsedCamera: true
                        },
                        false
                    );

                    try {
                        basicScanner.render(handleScanSuccess, handleScanError);
                        html5QrScannerRef.current = basicScanner;
                        console.log('Basic scanner rendered successfully');
                    } catch (basicError) {
                        console.error('Basic scanner also failed:', basicError);
                        throw new Error('Failed to initialize QR scanner. Please check camera permissions and try again.');
                    }
                }
            }

            toast({
                title: "Scanner Started",
                description: "Full screen scanner is now active",
            });
        } catch (error) {
            console.error('Error starting full screen scanner:', error);
            setIsFullScreenScanner(false);
            setIsScanning(false);
            toast({
                title: "Scanner Error",
                description: error.message || "Failed to start scanner. Please try again.",
                variant: "destructive"
            });
        }
    }, []);

    const stopScanning = useCallback(() => {
        if (html5QrScannerRef.current) {
            html5QrScannerRef.current.clear();
            html5QrScannerRef.current = null;
        }
        setIsScanning(false);
        setIsFullScreenScanner(false);
        setShowStudentPopup(false);
        setScannedStudentInfo(null);
    }, []);

    const handleScanSuccess = useCallback(async (data) => {
        try {
            console.log('QR Code scanned successfully:', data);

            // Stop the scanner but keep the modal open for the popup
            if (html5QrScannerRef.current) {
                html5QrScannerRef.current.clear();
                html5QrScannerRef.current = null;
            }
            setIsScanning(false);

            // Clean the scanned data - remove any whitespace or special characters
            const cleanData = data.trim();
            console.log('Cleaned QR data:', cleanData);

            // Find student by school_id first, then by id
            let student = null;
            let { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    tribes (
                        id,
                        name
                    )
                `)
                .eq('school_id', cleanData)
                .single();

            console.log('Student search by school_id result:', { studentData, studentError });
            if (studentData) {
                console.log('Student data details:', {
                    id: studentData.id,
                    full_name: studentData.full_name,
                    school_id: studentData.school_id,
                    year_level: studentData.year_level,
                    tribe_id: studentData.tribe_id,
                    tribes: studentData.tribes
                });
            }

            if (studentError) {
                console.log('Trying to find student by ID...');
                // Try finding by id
                const { data: studentById, error: idError } = await supabase
                    .from('students')
                    .select(`
                        *,
                        tribes (
                            id,
                            name
                        )
                    `)
                    .eq('id', cleanData)
                    .single();

                console.log('Student search by ID result:', { studentById, idError });
                if (studentById) {
                    console.log('Student data details (by ID):', {
                        id: studentById.id,
                        full_name: studentById.full_name,
                        school_id: studentById.school_id,
                        year_level: studentById.year_level,
                        tribe_id: studentById.tribe_id,
                        tribes: studentById.tribes
                    });
                }

                if (idError) {
                    throw new Error(`Student not found with school ID: ${cleanData}`);
                }
                student = studentById;
            } else {
                student = studentData;
            }

            // Check if student already has attendance for today
            const today = new Date().toISOString().split('T')[0];
            const { data: existingAttendance } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', today)
                .single();

            const studentInfo = {
                student,
                existingAttendance: !!existingAttendance
            };

            console.log('Setting scannedStudentInfo:', studentInfo);
            console.log('Student year_level in final data:', studentInfo.student.year_level);

            setScannedStudentInfo(studentInfo);
            setShowStudentPopup(true);

            // Add to scan history
            const newScan = {
                timestamp: new Date().toISOString(),
                status: 'success',
                studentInfo: {
                    full_name: student.full_name,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    school_id: student.school_id,
                    year_level: student.year_level
                },
                existingAttendance: !!existingAttendance
            };

            setScanHistory(prev => [newScan, ...prev.slice(0, 9)]);

        } catch (error) {
            console.error('Scan error:', error);

            const errorScan = {
                timestamp: new Date().toISOString(),
                status: 'failed',
                error: error.message || 'Student not found',
                scannedData: data
            };

            setScanHistory(prev => [errorScan, ...prev.slice(0, 9)]);

            toast({
                title: "Scan Error",
                description: error.message || "Failed to process QR code",
                variant: "destructive"
            });
        }
    }, []);

    const handleScanError = useCallback((error) => {
        // Filter out common non-critical errors that don't need user attention
        const errorMessage = error?.message || error?.toString() || '';
        const errorName = error?.name || '';

        // List of common errors that are normal during scanning
        const nonCriticalErrors = [
            'No barcode or QR code detected',
            'NoQRCodeFoundError',
            'QRCodeParseError',
            'No QR code found',
            'No barcode found',
            'No QR code detected in camera view',
            'NotFoundException: No MultiFormat Readers were able to detect the code',
            'No MultiFormat Readers were able to detect the code',
            'NotFoundException'
        ];

        // Check if this is a non-critical error
        const isNonCritical = nonCriticalErrors.some(nonCritical =>
            errorMessage.includes(nonCritical) || errorName.includes(nonCritical)
        );

        if (isNonCritical) {
            // Log at debug level only - these are normal during scanning
            console.log('Scanner: No QR code in view (normal during scanning)');
            return;
        }

        // For actual errors, log them properly
        console.error('QR scan error:', error);

        // Only show toast for real errors that need user attention
        if (error && !isNonCritical) {
            console.log('Scanner error (needs attention):', errorMessage);

            // Show user-friendly error message for certain errors
            if (errorMessage.includes('NotFoundException') || errorMessage.includes('MultiFormat Readers')) {
                console.log('💡 This error usually means the QR code format is not supported or the code is damaged');
            }
        }
    }, []);

    const handleRecordAttendance = useCallback(async () => {
        if (!scannedStudentInfo) return;

        try {
            const timeInfo = getCurrentTimeInfo();
            const today = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            console.log('Recording attendance for:', {
                student_id: scannedStudentInfo.student.id,
                tribe_id: scannedStudentInfo.student.tribe_id,
                date: today,
                time_in: timeInfo.isTimeInWindow ? currentTime : null,
                time_out: timeInfo.isTimeOutWindow ? currentTime : null,
                timeInfo
            });

            const attendanceData = {
                student_id: scannedStudentInfo.student.id,
                tribe_id: scannedStudentInfo.student.tribe_id,
                date: today,
                time_in: timeInfo.isTimeInWindow ? currentTime : null,
                time_out: timeInfo.isTimeOutWindow ? currentTime : null
            };

            const { data, error } = await supabase
                .from('attendance_records')
                .insert(attendanceData)
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Database error');
            }

            console.log('Attendance recorded successfully:', data);

            toast({
                title: "Attendance Recorded",
                description: `Successfully recorded ${timeInfo.isTimeInWindow ? 'time-in' : 'time-out'} for ${scannedStudentInfo.student.full_name}`,
            });

            setShowStudentPopup(false);
            setScannedStudentInfo(null);
            setIsFullScreenScanner(false);

        } catch (error) {
            console.error('Error recording attendance:', error);
            toast({
                title: "Recording Error",
                description: error.message || "Failed to record attendance. Please try again.",
                variant: "destructive"
            });
        }
    }, [scannedStudentInfo, getCurrentTimeInfo]);

    const clearScanHistory = useCallback(() => {
        setScanHistory([]);
    }, []);

    return {
        // State
        isScanning,
        isFullScreenScanner,
        showStudentPopup,
        scannedStudentInfo,
        scanHistory,

        // Functions
        getCurrentTimeInfo,
        startFullScreenScanning,
        stopScanning,
        handleRecordAttendance,
        clearScanHistory,

        // Event handlers
        onCloseScanner: () => {
            setShowStudentPopup(false);
            setScannedStudentInfo(null);
            setIsFullScreenScanner(false);
        },
        onClosePopup: () => {
            setShowStudentPopup(false);
            setScannedStudentInfo(null);
            setIsFullScreenScanner(false);
        }
    };
}; 