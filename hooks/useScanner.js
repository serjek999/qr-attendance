"use client";

import { useState, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
            }

            // Initialize the scanner
            html5QrScannerRef.current = new Html5QrcodeScanner(
                'qr-reader-fullscreen',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                },
                false
            );

            console.log('Scanner created, rendering...');
            html5QrScannerRef.current.render(handleScanSuccess, handleScanError);
            console.log('Scanner rendered successfully');

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
            // Stop the scanner but keep the modal open for the popup
            if (html5QrScannerRef.current) {
                html5QrScannerRef.current.clear();
                html5QrScannerRef.current = null;
            }
            setIsScanning(false);

            // Find student by school_id first, then by id
            let student = null;
            let { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', data)
                .single();

            if (studentError) {
                // Try finding by id
                const { data: studentById, error: idError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', data)
                    .single();

                if (idError) {
                    throw new Error('Student not found');
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

            setScannedStudentInfo(studentInfo);
            setShowStudentPopup(true);

            // Add to scan history
            const newScan = {
                schoolId: student.school_id,
                time: new Date().toLocaleTimeString(),
                type: existingAttendance ? 'duplicate' : 'success',
                status: existingAttendance ? 'warning' : 'success',
                message: existingAttendance
                    ? 'Student already recorded today'
                    : 'Student found and ready for attendance'
            };

            setScanHistory(prev => [newScan, ...prev.slice(0, 9)]);

        } catch (error) {
            console.error('Scan error:', error);

            const errorScan = {
                schoolId: data,
                time: new Date().toLocaleTimeString(),
                type: 'error',
                status: 'error',
                message: error.message || 'Student not found'
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
        console.error('QR scan error:', error);
        // Don't show toast for every scan error as it can be spammy
        // Only log for debugging purposes
    }, []);

    const handleRecordAttendance = useCallback(async () => {
        if (!scannedStudentInfo) return;

        try {
            const timeInfo = getCurrentTimeInfo();
            const today = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toLocaleTimeString();

            const { error } = await supabase
                .from('attendance_records')
                .insert({
                    student_id: scannedStudentInfo.student.id,
                    date: today,
                    time_in: timeInfo.isTimeInWindow ? currentTime : null,
                    time_out: timeInfo.isTimeOutWindow ? currentTime : null,
                    recorded_by: 'sbo'
                });

            if (error) throw error;

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
                description: "Failed to record attendance. Please try again.",
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