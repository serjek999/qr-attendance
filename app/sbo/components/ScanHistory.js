"use client";

import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

const ScanHistory = ({ scanHistory, onClearHistory }) => {
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
                {scanHistory.length > 0 && (
                    <Button
                        onClick={onClearHistory}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
                {scanHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <QrCode className="h-12 w-12 text-white/50 mx-auto mb-4" />
                        <p className="text-white/70 text-sm">No scans yet</p>
                        <p className="text-white/50 text-xs mt-1">Scan history will appear here</p>
                    </div>
                ) : (
                    <>
                        {scanHistory.slice(0, 5).map((scan, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${scan.status === 'success'
                                    ? 'bg-green-500/10 border-green-400/30'
                                    : 'bg-red-500/10 border-red-400/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left side - Student Name */}
                                    <div className="flex-1">
                                        {scan.status === 'success' && scan.studentInfo ? (
                                            <div className="text-sm text-white/90">
                                                <p className="font-medium text-white">
                                                    {scan.studentInfo.full_name ||
                                                        (scan.studentInfo.first_name && scan.studentInfo.last_name ?
                                                            `${scan.studentInfo.first_name} ${scan.studentInfo.last_name}` :
                                                            'Student Name Not Available')}
                                                </p>
                                                <p className="text-xs text-white/70">
                                                    ID: {scan.studentInfo.school_id}
                                                </p>
                                            </div>
                                        ) : scan.status === 'failed' ? (
                                            <div className="text-sm text-red-300">
                                                <p>{scan.error || 'Scan failed'}</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-white/70">
                                                <p>Unknown student</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side - Success/Failed status and time */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            {scan.status === 'success' ? (
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-400" />
                                            )}
                                            <span className={`text-sm font-medium ${scan.status === 'success' ? 'text-green-300' : 'text-red-300'
                                                }`}>
                                                {scan.status === 'success' ? 'Success' : 'Failed'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-white/70">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(scan.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {scanHistory.length > 5 && (
                            <div className="text-center py-2">
                                <p className="text-xs text-white/70">
                                    Scroll to see more scans ({scanHistory.length - 5} more)
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ScanHistory; 