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
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
                {scanHistory.length > 0 && (
                    <Button
                        onClick={onClearHistory}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
                {scanHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No scans yet</p>
                        <p className="text-gray-400 text-xs mt-1">Scan history will appear here</p>
                    </div>
                ) : (
                    <>
                        {scanHistory.slice(0, 5).map((scan, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${scan.status === 'success'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {scan.status === 'success' ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                            <span className={`text-sm font-medium ${scan.status === 'success' ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                {scan.status === 'success' ? 'Success' : 'Failed'}
                                            </span>
                                        </div>

                                        {scan.status === 'success' && scan.studentInfo && (
                                            <div className="text-sm text-gray-700">
                                                <p className="font-medium">
                                                    {scan.studentInfo.first_name} {scan.studentInfo.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {scan.studentInfo.school_id}
                                                </p>
                                            </div>
                                        )}

                                        {scan.status === 'failed' && (
                                            <div className="text-sm text-red-700">
                                                <p>{scan.error || 'Scan failed'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(scan.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {scanHistory.length > 5 && (
                            <div className="text-center py-2">
                                <p className="text-xs text-gray-500">
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