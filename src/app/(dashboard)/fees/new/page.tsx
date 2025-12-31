"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studentService, Student } from "@/services/studentService";
import { feeService } from "@/services/feeService";
import { ArrowLeft, Check, Search, Calendar, User, IndianRupee } from "lucide-react";
import Link from "next/link";

export default function NewPaymentPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Selection States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Payment Form States
    const [feeMonth, setFeeMonth] = useState("");
    const [feeYear, setFeeYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

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

    const filteredStudents = students.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchTerm(""); // Clear search to show selection clearly
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !amount || !feeMonth) {
            alert("Please fill all required fields");
            return;
        }

        setSubmitting(true);
        try {
            await feeService.addPayment({
                studentId: selectedStudent.id!, // Assuming id exists if fetched
                studentName: selectedStudent.fullName,
                grade: selectedStudent.grade,
                amount: Number(amount),
                feeMonth,
                feeYear: Number(feeYear),
                paymentDate,
                remarks
            });
            // In a real app, we would show a success modal and option to print Receipt here
            router.push("/fees");
        } catch (error) {
            console.error(error);
            alert("Failed to record payment.");
        } finally {
            setSubmitting(false);
        }
    };

    const getMonthName = (index: number) => {
        return new Date(0, index).toLocaleString('default', { month: 'long' });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/fees" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Record Payment</h1>
                    <p className="text-sm text-[#5F6368]">Create a new fee receipt</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Student Selection */}
                <div className="lg:col-span-1 border border-[#E8EAED] rounded-lg bg-white overflow-hidden shadow-sm flex flex-col h-[500px]">
                    <div className="p-4 bg-[#F8F9FA] border-b border-[#E8EAED]">
                        <h3 className="font-medium text-[#202124]">1. Select Student</h3>
                    </div>

                    {!selectedStudent ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-[#E8EAED]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        className="w-full pl-9 pr-3 py-2 border border-[#DADCE0] rounded-md text-sm focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {loading ? <p className="text-sm text-[#5F6368] p-4 text-center">Loading...</p> :
                                    filteredStudents.length === 0 ? <p className="text-sm text-[#5F6368] p-4 text-center">No students found.</p> :
                                        filteredStudents.map(student => (
                                            <button
                                                key={student.id}
                                                onClick={() => handleSelectStudent(student)}
                                                className="w-full text-left p-3 hover:bg-[#F8F9FA] rounded-md border border-transparent hover:border-[#E8EAED] transition-all group"
                                            >
                                                <p className="font-medium text-[#202124] text-sm group-hover:text-[#1A73E8]">{student.fullName}</p>
                                                <p className="text-xs text-[#5F6368]">{student.grade}</p>
                                            </button>
                                        ))
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-[#E8F0FE] rounded-full flex items-center justify-center mb-4">
                                <User size={32} className="text-[#1A73E8]" />
                            </div>
                            <h3 className="text-lg font-medium text-[#202124]">{selectedStudent.fullName}</h3>
                            <p className="text-sm text-[#5F6368] mb-1">{selectedStudent.grade}</p>
                            <p className="text-sm text-[#5F6368] mb-6">{selectedStudent.phone}</p>

                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="text-sm text-[#1A73E8] font-medium hover:underline border border-[#DADCE0] px-4 py-2 rounded-md hover:bg-[#F8F9FA]"
                            >
                                Change Student
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Collection Details */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="border border-[#E8EAED] rounded-lg bg-white shadow-sm h-full flex flex-col">
                        <div className="p-4 bg-[#F8F9FA] border-b border-[#E8EAED]">
                            <h3 className="font-medium text-[#202124]">2. Payment Details</h3>
                        </div>

                        <div className="p-8 space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Fee Month *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                                        <select
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-[#202124]"
                                            value={feeMonth} onChange={(e) => setFeeMonth(e.target.value)}
                                        >
                                            <option value="">Select Month</option>
                                            <option value="Admission">Admission Fee</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i} value={getMonthName(i)}>{getMonthName(i)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Fee Year *</label>
                                    <input
                                        type="number" required
                                        className="w-full px-3 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-[#202124]"
                                        value={feeYear} onChange={(e) => setFeeYear(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Amount Paid *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={20} />
                                    <input
                                        type="number" required placeholder="0.00"
                                        className="w-full pl-10 pr-3 py-3 bg-white border border-[#DADCE0] rounded-md text-2xl font-normal text-[#202124] focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                                        value={amount} onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Payment Date *</label>
                                    <input
                                        type="date" required
                                        className="w-full px-3 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-[#202124]"
                                        value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Remarks (Optional)</label>
                                <textarea
                                    rows={2} placeholder="Add a note..."
                                    className="w-full px-3 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-[#202124]"
                                    value={remarks} onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-[#F8F9FA] border-t border-[#E8EAED] flex justify-end gap-3 rounded-b-lg">
                            <Link href="/fees" className="px-5 py-2.5 rounded-md text-[#1A73E8] font-medium hover:bg-[#E8F0FE] transition-colors">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting || !selectedStudent}
                                className="btn-primary flex items-center gap-2 disabled:bg-[#A8C7FA]"
                            >
                                {submitting ? "Processing..." : <><Check size={18} /> Record Payment</>}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
