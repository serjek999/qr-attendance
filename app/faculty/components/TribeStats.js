"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react';

const TribeStats = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        todayAttendance: 0,
        attendanceRate: 0,
        topTribe: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                // Fetch total students
                const { data: students, error: studentsError } = await supabase
                    .from('students')
                    .select('id, tribe_id');

                if (studentsError) throw studentsError;

                // Fetch today's attendance
                const { data: attendance, error: attendanceError } = await supabase
                    .from('attendance_records')
                    .select('student_id')
                    .eq('date', today);

                if (attendanceError) throw attendanceError;

                const totalStudents = students.length;
                const todayAttendees = new Set(attendance.map(a => a.student_id));
                const presentToday = students.filter(student =>
                    todayAttendees.has(student.id)
                ).length;

                const attendanceRate = totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;

                // Find top performing tribe
                const tribeStats = {};
                students.forEach(student => {
                    if (student.tribe_id) {
                        if (!tribeStats[student.tribe_id]) {
                            tribeStats[student.tribe_id] = { total: 0, present: 0 };
                        }
                        tribeStats[student.tribe_id].total++;
                        if (todayAttendees.has(student.id)) {
                            tribeStats[student.tribe_id].present++;
                        }
                    }
                });

                let topTribe = null;
                let highestRate = 0;

                for (const [tribeId, stats] of Object.entries(tribeStats)) {
                    const rate = (stats.present / stats.total) * 100;
                    if (rate > highestRate) {
                        highestRate = rate;
                        topTribe = { id: tribeId, rate: Math.round(rate), present: stats.present, total: stats.total };
                    }
                }

                // Get tribe name if we have a top tribe
                if (topTribe) {
                    const { data: tribeData } = await supabase
                        .from('tribes')
                        .select('name')
                        .eq('id', topTribe.id)
                        .single();

                    if (tribeData) {
                        topTribe.name = tribeData.name;
                    }
                }

                setStats({
                    totalStudents,
                    todayAttendance: presentToday,
                    attendanceRate: Math.round(attendanceRate),
                    topTribe
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Top Tribe</p>
                            <p className="text-lg font-bold text-gray-900">
                                {stats.topTribe ? stats.topTribe.name : 'N/A'}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-500 bg-opacity-10">
                            <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Tribe Details */}
            {stats.topTribe && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Top Performing Tribe</h3>
                        <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-gray-600">Best Attendance Today</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.topTribe.name}</div>
                            <div className="text-sm text-gray-600">Tribe Name</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.topTribe.rate}%</div>
                            <div className="text-sm text-gray-600">Attendance Rate</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.topTribe.present}/{stats.topTribe.total}
                            </div>
                            <div className="text-sm text-gray-600">Present/Total</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${stats.topTribe.rate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TribeStats; 