import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

const TimeRestrictionInfo = ({ showCurrentTime = true, className = "" }) => {
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

    const timeInfo = getCurrentTimeInfo();

    return (
        <Card className={`bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-800 text-lg">
                    <Clock className="h-5 w-5 mr-2" />
                    Attendance Scanning Hours
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Scanning Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-semibold text-green-800">Time In</h4>
                        </div>
                        <p className="text-sm text-green-700">🕖 7:00 AM - 11:30 AM</p>
                        <p className="text-xs text-green-600 mt-1">Students can check in during this window</p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <h4 className="font-semibold text-orange-800">Time Out</h4>
                        </div>
                        <p className="text-sm text-orange-700">🕐 1:00 PM - 5:00 PM</p>
                        <p className="text-xs text-orange-600 mt-1">Students can check out during this window</p>
                    </div>
                </div>

                {/* Current Time Status */}
                {showCurrentTime && (
                    <div className={`p-4 rounded-lg border ${
                        timeInfo.canScan 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center space-x-2 mb-2">
                            {timeInfo.canScan ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <h4 className={`font-semibold ${
                                timeInfo.canScan ? 'text-green-800' : 'text-red-800'
                            }`}>
                                Current Status
                            </h4>
                        </div>
                        <p className={`text-sm ${
                            timeInfo.canScan ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {timeInfo.message}
                        </p>
                        {timeInfo.canScan && (
                            <p className="text-xs text-green-600 mt-1">
                                {timeInfo.isTimeInWindow ? '✅ Time In recording is active' : '✅ Time Out recording is active'}
                            </p>
                        )}
                        {!timeInfo.canScan && (
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ QR scanning is only allowed during specified time windows
                            </p>
                        )}
                    </div>
                )}

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">Important Notes:</p>
                            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                                <li>• QR scanning is only active during specified time windows</li>
                                <li>• Students can only check in during Time In hours (7:00 AM - 11:30 AM)</li>
                                <li>• Students can only check out during Time Out hours (1:00 PM - 5:00 PM)</li>
                                <li>• Attendance records are automatically categorized as Time In or Time Out</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TimeRestrictionInfo; 