"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Calendar, Check, X, Clock, Grid, List } from "lucide-react";
import { staffService, Staff, StaffAttendance } from "@/services/staffService";

type AttendanceStatus = "Present" | "Absent" | "Half Day";

export default function StaffAttendancePage() {
    const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

    // Daily View State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

    // Monthly View State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Attendance Data
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({}); // For Daily: staffId -> status
    const [monthlyData, setMonthlyData] = useState<StaffAttendance[]>([]); // For Monthly: list of all entries

    useEffect(() => {
        loadStaff();
    }, []);

    useEffect(() => {
        if (viewMode === "daily") {
            loadDailyAttendance();
        } else {
            loadMonthlyAttendance();
        }
    }, [viewMode, selectedDate, selectedMonth, selectedYear, staff]);

    const loadStaff = async () => {
        try {
            const data = await staffService.getStaff();
            setStaff(data.filter(s => s.status === "Active"));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyAttendance = async () => {
        if (staff.length === 0) return;
        try {
            const data = await staffService.getAttendanceForDate(selectedDate);

            // Build map
            const map: Record<string, AttendanceStatus> = {};
            data.forEach(a => map[a.staffId] = a.status);

            // Default to Present if not found
            staff.forEach(s => {
                if (!map[s.id!]) map[s.id!] = "Present";
            });
            setAttendanceMap(map);
        } catch (error) {
            console.error(error);
        }
    };

    const loadMonthlyAttendance = async () => {
        try {
            const data = await staffService.getAllAttendanceForMonth(selectedMonth, selectedYear);
            setMonthlyData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({ ...prev, [staffId]: status }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const entries = staff.map(s => ({
                staffId: s.id!,
                staffName: s.fullName,
                date: selectedDate,
                status: attendanceMap[s.id!] || "Present"
            }));
            await staffService.markAttendance(entries);
            alert("Attendance saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save attendance.");
        } finally {
            setSaving(false);
        }
    };

    const daysInMonth = useMemo(() => {
        return new Date(selectedYear, selectedMonth + 1, 0).getDate();
    }, [selectedMonth, selectedYear]);

    const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

    const getStatusIcon = (status: string) => {
        if (status === "Present") return <div className="w-2 h-2 rounded-full bg-[#1E8E3E] mx-auto" title="Present" />;
        if (status === "Absent") return <div className="w-2 h-2 rounded-full bg-[#D93025] mx-auto" title="Absent" />;
        if (status === "Half Day") return <div className="w-2 h-2 rounded-full bg-[#F9AB00] mx-auto" title="Half Day" />;
        return null;
    };

    const statusButtons: { status: AttendanceStatus, icon: any, color: string, bg: string }[] = [
        { status: "Present", icon: Check, color: "text-[#1E8E3E]", bg: "bg-[#E6F4EA]" },
        { status: "Absent", icon: X, color: "text-[#D93025]", bg: "bg-[#FCE8E6]" },
        { status: "Half Day", icon: Clock, color: "text-[#F9AB00]", bg: "bg-[#FEF7E0]" }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/staff" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal text-[#202124]">Staff Attendance</h1>
                        <p className="text-sm text-[#5F6368] mt-1">Track daily or monthly attendance</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-[#F1F3F4] p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("daily")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "daily" ? "bg-white text-[#202124] shadow-sm" : "text-[#5F6368] hover:bg-[#E8EAED]"
                            }`}
                    >
                        <List size={16} /> Daily
                    </button>
                    <button
                        onClick={() => setViewMode("monthly")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "monthly" ? "bg-white text-[#202124] shadow-sm" : "text-[#5F6368] hover:bg-[#E8EAED]"
                            }`}
                    >
                        <Grid size={16} /> Monthly Sheet
                    </button>
                </div>
            </div>

            {/* Controls */}
            {viewMode === "daily" ? (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="card-base bg-white border border-[#E8EAED] p-2 rounded-lg shadow-sm flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[#5F6368] px-2">
                            <Calendar size={18} />
                            <span className="text-sm font-medium">Date:</span>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-2 py-1 border-none text-[#202124] focus:ring-0 text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || staff.length === 0}
                        className="btn-primary flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></>
                        ) : (
                            <><Save size={18} /><span>Save Changes</span></>
                        )}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4 card-base bg-white border border-[#E8EAED] p-3 rounded-lg shadow-sm w-fit">
                    <div className="flex items-center gap-2 text-[#5F6368]">
                        <Calendar size={18} />
                        <span className="text-sm font-medium">Month:</span>
                    </div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-[#F8F9FA] border border-[#DADCE0] rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-[#1A73E8]"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-[#F8F9FA] border border-[#DADCE0] rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-[#1A73E8]"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            )}

            {/* Content Area */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-[#5F6368]">Loading...</div>
                ) : staff.length === 0 ? (
                    <div className="p-12 text-center text-[#5F6368]">No active staff members found.</div>
                ) : viewMode === "daily" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Staff Member</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Attendance Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-[#F8F9FA] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center text-xs font-medium">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#202124]">{member.fullName}</p>
                                                    <p className="text-[11px] text-[#9AA0A6]">{member.staffCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#5F6368]">{member.role}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {statusButtons.map(btn => {
                                                    const Icon = btn.icon;
                                                    const isActive = attendanceMap[member.id!] === btn.status;
                                                    return (
                                                        <button
                                                            key={btn.status}
                                                            onClick={() => handleStatusChange(member.id!, btn.status)}
                                                            className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all border ${isActive
                                                                ? `${btn.bg} ${btn.color} border-current shadow-sm`
                                                                : 'bg-white text-[#9AA0A6] border-[#E8EAED] hover:border-[#DADCE0]'
                                                                }`}
                                                        >
                                                            <Icon size={14} />
                                                            <span>{btn.status}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs box-border">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="sticky left-0 bg-[#F8F9FA] z-10 px-4 py-3 text-left font-bold text-[#5F6368] border-r border-[#E8EAED] min-w-[150px]">Staff</th>
                                    {daysArray.map(day => (
                                        <th key={day} className="px-1 py-3 text-center font-medium text-[#5F6368] w-8 min-w-[32px]">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {staff.map(member => {
                                    // Filter attendance for this staff
                                    const staffAttendance = monthlyData.filter(a => a.staffId === member.id);
                                    // Create a map: Date(YYYY-MM-DD) -> Status
                                    const statusMap: Record<number, string> = {};
                                    staffAttendance.forEach(a => {
                                        const day = parseInt(a.date.split('-')[2]);
                                        statusMap[day] = a.status;
                                    });

                                    return (
                                        <tr key={member.id} className="hover:bg-[#F8F9FA]">
                                            <td className="sticky left-0 bg-white group-hover:bg-[#F8F9FA] z-10 px-4 py-3 border-r border-[#E8EAED]">
                                                <div className="font-medium text-[#202124] truncate max-w-[140px]" title={member.fullName}>{member.fullName}</div>
                                            </td>
                                            {daysArray.map(day => (
                                                <td key={day} className="px-1 py-3 text-center border-r border-dotted border-[#E8EAED] last:border-none">
                                                    {getStatusIcon(statusMap[day] || "")}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
