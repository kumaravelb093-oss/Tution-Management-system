"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, UserCheck, Wallet, Trash2, Edit } from "lucide-react";
import { staffService, Staff } from "@/services/staffService";

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [presentToday, setPresentToday] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [staffData, presentCount] = await Promise.all([
                staffService.getStaff(),
                staffService.getPresentTodayCount()
            ]);
            setStaff(staffData);
            setPresentToday(presentCount);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await staffService.deleteStaff(id);
            setStaff(prev => prev.filter(s => s.id !== id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error(error);
            alert("Failed to delete staff member.");
        }
    };

    const filteredStaff = staff.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staffCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSalary = staff.filter(s => s.status === "Active").reduce((sum, s) => sum + s.basicSalary, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Staff Management</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Manage staff, attendance, and payroll</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/staff/attendance" className="btn-secondary">
                        Mark Attendance
                    </Link>
                    <Link href="/staff/add" className="btn-primary flex items-center gap-2 shadow-sm">
                        <Plus size={18} />
                        <span>Add Staff</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-base bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Total Staff</p>
                            <h3 className="text-3xl font-normal text-[#202124] mt-2">{staff.length}</h3>
                        </div>
                        <div className="w-10 h-10 bg-[#E8F0FE] rounded-full flex items-center justify-center">
                            <Users className="text-[#4285F4]" size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-medium text-[#1E8E3E] bg-[#E6F4EA] px-2 py-0.5 rounded-full">
                            {staff.filter(s => s.status === "Active").length} Active
                        </span>
                    </div>
                </div>

                <div className="card-base bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Present Today</p>
                            <h3 className="text-3xl font-normal text-[#202124] mt-2">{presentToday}</h3>
                        </div>
                        <div className="w-10 h-10 bg-[#E6F4EA] rounded-full flex items-center justify-center">
                            <UserCheck className="text-[#1E8E3E]" size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link href="/staff/attendance" className="text-xs text-[#1A73E8] hover:underline font-medium">
                            View Attendance →
                        </Link>
                    </div>
                </div>

                <div className="card-base bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Monthly Payroll</p>
                            <h3 className="text-3xl font-normal text-[#202124] mt-2">₹{totalSalary.toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 bg-[#FEF7E0] rounded-full flex items-center justify-center">
                            <Wallet className="text-[#F9AB00]" size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link href="/staff/salary" className="text-xs text-[#1A73E8] hover:underline font-medium">
                            Generate Salaries →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="input-group flex-1 max-w-md shadow-sm">
                    <div className="input-group-icon">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name / ID / Role..."
                        className="input-group-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Staff Table */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-[#5F6368]">Loading staff records...</div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-[#F1F3F4] rounded-full flex items-center justify-center mb-3">
                            <Users size={24} className="text-[#9AA0A6]" />
                        </div>
                        <h3 className="text-[#202124] font-medium">No staff found</h3>
                        <p className="text-[#5F6368] text-sm mt-1">Add a new staff member to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Staff Name & ID</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3.5 text-right text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Salary</th>
                                    <th className="px-6 py-3.5 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-[#F8F9FA] transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/staff/${member.id}`} className="flex items-center gap-3 group cursor-pointer">
                                                <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center text-xs font-medium group-hover:bg-[#D2E3FC] transition-colors">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-medium text-[#202124] group-hover:text-[#1A73E8] transition-colors">{member.fullName}</p>
                                                    <p className="text-[12px] text-[#5F6368]">{member.staffCode || "Pending"}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#202124]">{member.role}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-[14px] text-[#202124]">{member.phone}</p>
                                            <p className="text-[12px] text-[#5F6368]">{member.email || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[14px] font-medium text-[#202124]">₹{member.basicSalary.toLocaleString()}</span>
                                            <p className="text-[11px] text-[#9AA0A6]">{member.salaryType}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'Active'
                                                ? 'bg-[#E6F4EA] text-[#1E8E3E]'
                                                : 'bg-[#FCE8E6] text-[#D93025]'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/staff/edit/${member.id}`}
                                                    className="p-2 text-[#5F6368] hover:text-[#4285F4] hover:bg-[#E8F0FE] rounded-full transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                {deleteConfirm === member.id ? (
                                                    <button
                                                        onClick={() => handleDelete(member.id!)}
                                                        className="px-3 py-1 text-xs bg-[#D93025] text-white rounded-md font-medium"
                                                    >
                                                        Confirm
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(member.id!)}
                                                        className="p-2 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] rounded-full transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
