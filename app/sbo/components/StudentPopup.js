"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, User, Calendar, Clock, Users } from "lucide-react";

const StudentPopup = ({
    showStudentPopup,
    scannedStudentInfo,
    onClose,
    onRecordAttendance
}) => {
    if (!showStudentPopup || !scannedStudentInfo) return null;

    // Debug: Log the student info being passed
    console.log('StudentPopup - scannedStudentInfo:', scannedStudentInfo);
    console.log('StudentPopup - student data:', scannedStudentInfo?.student);
    console.log('StudentPopup - year_level:', scannedStudentInfo?.student?.year_level);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-1">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm mx-2 p-3 sm:p-4 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/20">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                            <CheckCircle className="h-5 w-5 text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">QR Scan Successful!</h3>
                            <p className="text-xs text-white/70">Student found in database</p>
                        </div>
                    </div>
                    <Button
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 p-1"
                        size="sm"
                        onClick={onClose}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>

                {/* Student Info */}
                <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-md rounded-lg">
                        <User className="h-4 w-4 text-white flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-sm sm:text-base truncate">
                                {scannedStudentInfo.student.full_name}
                            </p>
                            <p className="text-xs sm:text-sm text-white/70">School ID: {scannedStudentInfo.student.school_id}</p>
                        </div>
                    </div>

                    {/* Year Level and Tribe - Side by Side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-md rounded-lg">
                            <Calendar className="h-4 w-4 text-white flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-xs sm:text-sm">Year Level</p>
                                <p className="text-xs sm:text-sm text-white/70">
                                    {scannedStudentInfo.student.year_level || 'Not specified'}
                                </p>
                            </div>
                        </div>

                        {/* Tribe Information */}
                        {scannedStudentInfo.student.tribes && (
                            <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-md rounded-lg">
                                <Users className="h-4 w-4 text-white flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-white text-xs sm:text-sm">Tribe</p>
                                    <p className="text-xs sm:text-sm text-white/70 truncate">
                                        {scannedStudentInfo.student.tribes.name}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-md rounded-lg">
                        <Clock className="h-4 w-4 text-white flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-xs sm:text-sm">Scan Time</p>
                            <p className="text-xs sm:text-sm text-white/70">
                                {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Additional Student Details */}
                    {scannedStudentInfo.student.birthdate && (
                        <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-md rounded-lg">
                            <Calendar className="h-4 w-4 text-white flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-xs sm:text-sm">Birthdate</p>
                                <p className="text-xs sm:text-sm text-white/70">
                                    {new Date(scannedStudentInfo.student.birthdate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Attendance Status */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${scannedStudentInfo.existingAttendance
                        ? 'bg-white/20 backdrop-blur-md border border-white/30'
                        : 'bg-white/20 backdrop-blur-md border border-white/30'
                        }`}>
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 ${scannedStudentInfo.existingAttendance ? 'text-yellow-400' : 'text-green-400'
                            }`} />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-xs sm:text-sm">Attendance Status</p>
                            <p className={`text-xs sm:text-sm ${scannedStudentInfo.existingAttendance ? 'text-yellow-300' : 'text-green-300'
                                }`}>
                                {scannedStudentInfo.existingAttendance
                                    ? 'Already recorded today'
                                    : 'Ready to record attendance'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={onRecordAttendance}
                        disabled={scannedStudentInfo.existingAttendance}
                        className={`flex-1 ${scannedStudentInfo.existingAttendance
                            ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white/50 cursor-not-allowed'
                            : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                            } py-2`}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {scannedStudentInfo.existingAttendance
                            ? 'Already Recorded'
                            : 'Record Attendance'
                        }
                    </Button>
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 py-2"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StudentPopup; 