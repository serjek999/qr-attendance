"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export const useScanHistory = () => {
    const [scanHistory, setScanHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load scan history from database
    const loadScanHistory = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('scan_history')
                .select(`
                    *,
                    students (
                        id,
                        full_name,
                        school_id,
                        year_level
                    )
                `)
                .order('scanned_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error loading scan history:', error);
                return;
            }

            // Transform database data to match the expected format
            const transformedHistory = data.map(record => ({
                timestamp: record.scanned_at,
                status: record.scan_status,
                studentInfo: record.students ? {
                    full_name: record.students.full_name,
                    first_name: record.students.full_name?.split(' ')[0] || '',
                    last_name: record.students.full_name?.split(' ').slice(1).join(' ') || '',
                    school_id: record.students.school_id,
                    year_level: record.students.year_level
                } : null,
                error: record.error_message,
                scanData: record.scan_data,
                attendanceRecorded: record.attendance_recorded
            }));

            setScanHistory(transformedHistory);
        } catch (error) {
            console.error('Error loading scan history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add a new scan to history
    const addScanToHistory = useCallback(async (scanData) => {
        try {
            // First, try to create the scan_history table if it doesn't exist
            const { error: createError } = await supabase.rpc('create_scan_history_table_if_not_exists');

            if (createError) {
                console.log('Table creation not supported, continuing with insert...');
            }

            // Prepare the scan record
            const scanRecord = {
                student_id: scanData.studentInfo?.id || null,
                student_school_id: scanData.studentInfo?.school_id || null,
                student_name: scanData.studentInfo?.full_name || null,
                scan_status: scanData.status,
                scan_data: scanData.scanData || null,
                error_message: scanData.error || null,
                scanned_by: null, // TODO: Add SBO officer ID when auth is implemented
                attendance_recorded: scanData.attendanceRecorded || false
            };

            // Insert into database
            const { data, error } = await supabase
                .from('scan_history')
                .insert(scanRecord)
                .select();

            if (error) {
                console.error('Error saving scan to history:', error);
                // Fallback to local storage if database fails
                const localHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
                localHistory.unshift(scanData);
                localStorage.setItem('scanHistory', JSON.stringify(localHistory.slice(0, 20)));
                setScanHistory(prev => [scanData, ...prev.slice(0, 19)]);
                return;
            }

            // Reload scan history from database
            await loadScanHistory();

        } catch (error) {
            console.error('Error adding scan to history:', error);
            // Fallback to local storage
            const localHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
            localHistory.unshift(scanData);
            localStorage.setItem('scanHistory', JSON.stringify(localHistory.slice(0, 20)));
            setScanHistory(prev => [scanData, ...prev.slice(0, 19)]);
        }
    }, [loadScanHistory]);

    // Clear scan history
    const clearScanHistory = useCallback(async () => {
        try {
            // Clear from database
            const { error } = await supabase
                .from('scan_history')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

            if (error) {
                console.error('Error clearing scan history:', error);
            }

            // Clear from local storage
            localStorage.removeItem('scanHistory');

            // Clear local state
            setScanHistory([]);
        } catch (error) {
            console.error('Error clearing scan history:', error);
        }
    }, []);

    // Load scan history on mount
    useEffect(() => {
        loadScanHistory();
    }, [loadScanHistory]);

    return {
        scanHistory,
        loading,
        addScanToHistory,
        clearScanHistory,
        loadScanHistory
    };
}; 