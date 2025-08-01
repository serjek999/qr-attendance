"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, User, Calendar, Clock } from "lucide-react";

const StudentPopup = ({
    showStudentPopup,
    scannedStudentInfo,
    onClose,
    onRecordAttendance
}) => {
    if (!showStudentPopup || !scannedStudentInfo) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-900">QR Scan Successful!</h3>
                            <p className="text-sm text-green-700">Student found in database</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <XCircle className="h-5 w-5" />
                    </Button>
                </div>

                {/* Student Info */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                            <p className="font-semibold text-gray-900">
                                {scannedStudentInfo.first_name} {scannedStudentInfo.last_name}
                            </p>
                            <p className="text-sm text-gray-600">School ID: {scannedStudentInfo.school_id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                            <p className="font-semibold text-gray-900">Year Level</p>
                            <p className="text-sm text-gray-600">{scannedStudentInfo.year_level}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <div>
                            <p className="font-semibold text-gray-900">Scan Time</p>
                            <p className="text-sm text-gray-600">
                                {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={onRecordAttendance}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Record Attendance
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StudentPopup; 