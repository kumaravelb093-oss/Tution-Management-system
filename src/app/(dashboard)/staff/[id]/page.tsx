"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { staffService, Staff, StaffAttendance, StaffSalary } from "@/services/staffService";
import { pdfService } from "@/services/pdfService";
import {
    ArrowLeft, User, Phone, MapPin, Mail, Calendar,
    Download, DollarSign, TrendingUp, Briefcase,
    CheckCircle2, XCircle, Trash2, Edit, PieChart as PieChartIcon, Clock
} from "lucide-react";
import Link from "next/link";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [staff, setStaff] = useState<Staff | null>(null);
    const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
    const [salaries, setSalaries] = useState<StaffSalary[]>([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "attendance" | "salary">("profile");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Staff
                const staffData = await staffService.getStaffById(id);
                if (staffData) {
                    setStaff(staffData);

                    // Fetch Attendance
                    const attendanceData = await staffService.getFullAttendance(id);
                    setAttendance(attendanceData);

                    // Fetch Salary History
                    const salaryData = await staffService.getSalaryHistory(id);
                    setSalaries(salaryData);
                } else {
                    router.push("/staff");
                }
            } catch (error) {
                console.error(error);
                alert("Failed to load staff data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    // Attendance Stats for Pie Chart
    const attendanceStats = useMemo(() => {
        const stats = { Present: 0, Absent: 0, "Half Day": 0 };
        attendance.forEach(a => {
            if (stats[a.status] !== undefined) {
                stats[a.status]++;
            }
        });
        return [
            { name: "Present", value: stats.Present, color: "#1E8E3E" },
            { name: "Absent", value: stats.Absent, color: "#D93025" },
            { name: "Half Day", value: stats["Half Day"], color: "#F9AB00" }
        ].filter(item => item.value > 0);
    }, [attendance]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return;
        setActionLoading(true);
        try {
            await staffService.deleteStaff(id);
            router.push("/staff");
        } catch (error) {
            console.error(error);
            alert("Failed to delete staff member");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-[#5F6368]">Loading staff profile...</div>;
    }

    if (!staff) return null;

    // Tab Styles
    const tabBase = "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2";
    const tabActive = "border-[#1A73E8] text-[#1A73E8]";
    const tabInactive = "border-transparent text-[#5F6368] hover:text-[#202124] hover:border-[#DADCE0]";

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/staff" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal text-[#202124]">{staff.fullName}</h1>
                        <p className="text-sm text-[#5F6368]">ID: <span className="font-bold text-[#4285F4]">{staff.staffCode}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/staff/edit/${id}`}
                        className="flex items-center gap-2 px-4 py-2 border border-[#DADCE0] rounded-md text-[#202124] text-sm font-medium hover:bg-[#F8F9FA] transition-colors"
                    >
                        <Edit size={16} />
                        <span>Edit Info</span>
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="p-2 text-[#D93025] hover:bg-[#FCE8E6] rounded-md transition-colors"
                        title="Delete Staff"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Sidebar: Key Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-base bg-white border border-[#E8EAED] p-6 rounded-lg shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8] text-4xl font-normal mb-4">
                                {staff.fullName.charAt(0)}
                            </div>
                            <h2 className="text-xl font-medium text-[#202124]">{staff.fullName}</h2>
                            <p className="text-[#5F6368]">{staff.role}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${staff.status === 'Active' ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#Fce8E6] text-[#D93025]'}`}>
                                {staff.status}
                            </span>
                        </div>

                        <div className="mt-8 space-y-5 border-t border-[#E8EAED] pt-6">
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-[#9AA0A6]" />
                                <p className="text-sm text-[#202124]">{staff.phone}</p>
                            </div>
                            {staff.email && (
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-[#9AA0A6]" />
                                    <p className="text-sm text-[#202124]">{staff.email}</p>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-[#9AA0A6] mt-0.5" />
                                <p className="text-sm text-[#202124] leading-relaxed">{staff.address}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <TrendingUp size={18} className="text-[#9AA0A6]" />
                                <p className="text-xs text-[#5F6368]">Joined {new Date(staff.joiningDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Tabs */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Tabs Navigation */}
                    <div className="bg-white border-b border-[#E8EAED] flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`${tabBase} ${activeTab === "profile" ? tabActive : tabInactive}`}
                        >
                            <User size={16} /> Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("attendance")}
                            className={`${tabBase} ${activeTab === "attendance" ? tabActive : tabInactive}`}
                        >
                            <PieChartIcon size={16} /> Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab("salary")}
                            className={`${tabBase} ${activeTab === "salary" ? tabActive : tabInactive}`}
                        >
                            <DollarSign size={16} /> Salary
                        </button>
                    </div>

                    {/* Content Groups */}
                    <div className="bg-white border border-[#E8EAED] rounded-lg p-6 shadow-sm min-h-[400px]">

                        {/* PROFILE TAB */}
                        {activeTab === "profile" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h3 className="text-lg font-medium text-[#202124] mb-4">Professional Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-[#5F6368] uppercase">Qualification</label>
                                        <p className="text-sm text-[#202124] mt-1">{staff.qualification || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#5F6368] uppercase">Gender</label>
                                        <p className="text-sm text-[#202124] mt-1">{staff.gender}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#5F6368] uppercase">Salary Type</label>
                                        <p className="text-sm text-[#202124] mt-1">{staff.salaryType}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#5F6368] uppercase">Basic Salary</label>
                                        <p className="text-sm text-[#1E8E3E] font-medium mt-1">₹{staff.basicSalary.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ATTENDANCE TAB */}
                        {activeTab === "attendance" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-[#202124]">Attendance Overview</h3>
                                    <span className="text-xs font-medium text-[#5F6368] bg-[#F1F3F4] px-2 py-1 rounded">Last 12 Months</span>
                                </div>

                                {attendanceStats.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={attendanceStats}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {attendanceStats.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-4">
                                            {attendanceStats.map(stat => (
                                                <div key={stat.name} className="flex items-center justify-between p-3 rounded-lg border border-[#E8EAED]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                                                        <span className="text-sm font-medium text-[#202124]">{stat.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#202124]">{stat.value} Days</span>
                                                </div>
                                            ))}
                                            <div className="mt-4 pt-4 border-t border-[#E8EAED] text-center">
                                                <p className="text-xs text-[#5F6368]">Total Recorded Days: {attendance.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-[#5F6368] italic">No attendance records found.</div>
                                )}
                            </div>
                        )}

                        {/* SALARY TAB */}
                        {activeTab === "salary" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h3 className="text-lg font-medium text-[#202124] mb-4">Salary History</h3>
                                {salaries.length === 0 ? (
                                    <div className="text-center py-12 text-[#5F6368] italic">No salary records found.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-[#5F6368]">Month</th>
                                                    <th className="px-4 py-3 text-center font-medium text-[#5F6368]">Working Days</th>
                                                    <th className="px-4 py-3 text-center font-medium text-[#5F6368]">Present</th>
                                                    <th className="px-4 py-3 text-right font-medium text-[#5F6368]">Net Pay</th>
                                                    <th className="px-4 py-3 text-center font-medium text-[#5F6368]">Status</th>
                                                    <th className="px-4 py-3 text-center font-medium text-[#5F6368]">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E8EAED]">
                                                {salaries.map(s => (
                                                    <tr key={s.id} className="hover:bg-[#F8F9FA]">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-[#202124]">{s.month} {s.year}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[#5F6368]">{s.totalWorkingDays}</td>
                                                        <td className="px-4 py-3 text-center text-[#5F6368]">{s.presentDays}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-[#1E8E3E]">₹{s.netSalary.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.paymentStatus === 'Paid' ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#FCE8E6] text-[#D93025]'}`}>
                                                                {s.paymentStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => pdfService.generateSalarySlip(s)}
                                                                className="text-[#4285F4] hover:bg-[#E8F0FE] p-1.5 rounded-full transition-colors"
                                                                title="Download Slip"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
}
