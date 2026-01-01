"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, User } from "lucide-react";
import { studentService, Student } from "@/services/studentService";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await studentService.getStudents();
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Students</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Manage admissions and student records</p>
                </div>
                <Link href="/students/add" className="btn-primary flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Add Student</span>
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name / ID / Phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] shadow-sm transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table Container */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-[#5F6368]">
                        Loading student records...
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-[#F1F3F4] rounded-full flex items-center justify-center mb-3">
                            <User size={24} className="text-[#9AA0A6]" />
                        </div>
                        <h3 className="text-[#202124] font-medium">No students found</h3>
                        <p className="text-[#5F6368] text-sm mt-1">Try adjusting your search or add a new student.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Student Name & ID</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-[#F8F9FA] transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <Link href={`/students/${student.id}`} className="flex items-center gap-3 group/link">
                                                <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center text-xs font-medium group-hover/link:bg-[#1A73E8] group-hover/link:text-white transition-colors">
                                                    {student.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-medium text-[#202124] group-hover/link:text-[#1A73E8] group-hover/link:underline">{student.fullName}</p>
                                                    <p className="text-[12px] text-[#5F6368]">{student.studentCode || "DT-Pending"}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#202124]">
                                            {student.grade}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[14px] text-[#202124]">{student.phone}</p>
                                            <p className="text-[12px] text-[#5F6368]">{student.parentName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                                ? 'bg-[#E6F4EA] text-[#1E8E3E]'
                                                : 'bg-[#FCE8E6] text-[#D93025]'
                                                }`}>
                                                {student.status}
                                            </span>
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
