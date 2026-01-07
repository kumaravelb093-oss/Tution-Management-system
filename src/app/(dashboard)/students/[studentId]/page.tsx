"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { studentService, Student } from "@/services/studentService";
import { feeService, Payment } from "@/services/feeService";
import { marksService, MarksEntry, Exam } from "@/services/marksService";
import { pdfService } from "@/services/pdfService";
import {
    ArrowLeft, User, Calendar, Phone, MapPin, Mail,
    Download, FileText, TrendingUp, ShieldAlert,
    CheckCircle2, XCircle, Trash2, Edit, BarChart3, LineChart as LineChartIcon
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [student, setStudent] = useState<Student | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [marks, setMarks] = useState<MarksEntry[]>([]);
    const [exams, setExams] = useState<Record<string, Exam>>({});

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Tab State (Default to performance, or use URL param)
    const [activeTab, setActiveTab] = useState<"performance" | "fees">(
        searchParams.get("tab") === "fees" ? "fees" : "performance"
    );

    // Analytics State
    const [activeProgressionType, setActiveProgressionType] = useState<string>("");
    const [activeAnalysisDate, setActiveAnalysisDate] = useState<string>("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Student
                const docRef = doc(db, "students", studentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setStudent({ id: docSnap.id, ...docSnap.data() } as Student);

                    // Fetch Payments
                    const paymentData = await feeService.getPaymentsByStudent(studentId);
                    setPayments(paymentData);

                    // Fetch Marks
                    const marksData = await marksService.getMarksByStudent(studentId);
                    setMarks(marksData);

                    // Fetch Exams for mapping
                    const allExams = await marksService.getExams();
                    const examMap: Record<string, Exam> = {};
                    allExams.forEach(e => { if (e.id) examMap[e.id] = e; });
                    setExams(examMap);

                    // Initialize Analytics Filters
                    if (marksData.length > 0) {
                        const types = Array.from(new Set(marksData.map(m => m.examId ? examMap[m.examId]?.name : "").filter(Boolean)));
                        if (types.length > 0) setActiveProgressionType(types[0]);

                        const dates = Array.from(new Set(marksData.map(m => m.examDate).filter(Boolean)))
                            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                        if (dates.length > 0) setActiveAnalysisDate(dates[0]);
                    }
                } else {
                    router.push("/students");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId, router]);

    // Progression Chart Data
    const progressionData = useMemo(() => {
        if (!activeProgressionType) return [];

        // Group entries by date for the same exam name
        const dateGroups: Record<string, { totalObtained: number, totalMax: number }> = {};

        marks.forEach(m => {
            const eName = m.examId ? exams[m.examId]?.name : "";
            if (eName === activeProgressionType && m.examDate) {
                if (!dateGroups[m.examDate]) dateGroups[m.examDate] = { totalObtained: 0, totalMax: 0 };
                dateGroups[m.examDate].totalObtained += m.marksObtained;
                dateGroups[m.examDate].totalMax += m.maxMarks;
            }
        });

        return Object.entries(dateGroups)
            .map(([date, values]) => ({
                date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                fullDate: date,
                percentage: Math.round((values.totalObtained / values.totalMax) * 100)
            }))
            .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
    }, [marks, activeProgressionType, exams]);

    // Subject Analysis Data
    const analysisData = useMemo(() => {
        if (!activeAnalysisDate) return [];

        return marks
            .filter(m => m.examDate === activeAnalysisDate)
            .map(m => ({
                subject: m.subject,
                score: m.marksObtained,
                max: m.maxMarks,
                percentage: Math.round((m.marksObtained / m.maxMarks) * 100)
            }));
    }, [marks, activeAnalysisDate]);

    const handleToggleStatus = async () => {
        if (!student) return;
        setActionLoading(true);
        const newStatus = student.status === "Active" ? "Inactive" : "Active";
        try {
            const docRef = doc(db, "students", studentId);
            await updateDoc(docRef, { status: newStatus });
            setStudent({ ...student, status: newStatus as any });
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this student? All records will be lost.")) return;
        setActionLoading(true);
        try {
            await studentService.deleteStudent(studentId);
            router.push("/students");
        } catch (error) {
            console.error(error);
            alert("Failed to delete student");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-[#5F6368]">Loading comprehensive profile...</div>;
    }

    if (!student) return null;

    const examNames = Array.from(new Set(marks.map(m => m.examId ? exams[m.examId]?.name : "").filter(Boolean)));
    const analysisDates = Array.from(new Set(marks.map(m => m.examDate).filter(Boolean)))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const tabBase = "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2";
    const tabActive = "border-[#1A73E8] text-[#1A73E8]";
    const tabInactive = "border-transparent text-[#5F6368] hover:text-[#202124] hover:border-[#DADCE0]";

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/students" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal text-[#202124]">{student.fullName}</h1>
                        <p className="text-sm text-[#5F6368]">ID: <span className="font-bold text-[#4285F4]">{student.studentCode}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/students/edit/${studentId}`}
                        className="flex items-center gap-2 px-4 py-2 border border-[#DADCE0] rounded-md text-[#202124] text-sm font-medium hover:bg-[#F8F9FA] transition-colors"
                    >
                        <Edit size={16} />
                        <span>Edit Info</span>
                    </Link>
                    <button
                        onClick={handleToggleStatus}
                        disabled={actionLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${student.status === 'Active'
                            ? 'border-[#F5C6CB] text-[#D93025] hover:bg-[#FCE8E6]'
                            : 'border-[#C3E6CB] text-[#1E8E3E] hover:bg-[#E6F4EA]'
                            }`}
                    >
                        {student.status === 'Active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>Set {student.status === 'Active' ? 'Inactive' : 'Active'}</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="p-2 text-[#D93025] hover:bg-[#FCE8E6] rounded-md transition-colors"
                        title="Delete Student"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Sidebar: Key Details (Always Visible) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-base bg-white border border-[#E8EAED] p-6 rounded-lg shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8] text-4xl font-normal mb-4">
                                {student.fullName.charAt(0)}
                            </div>
                            <h2 className="text-xl font-medium text-[#202124]">{student.fullName}</h2>
                            <p className="text-[#5F6368]">{student.grade}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#FCE8E6] text-[#D93025]'}`}>
                                {student.status}
                            </span>
                        </div>

                        <div className="mt-8 space-y-5 border-t border-[#E8EAED] pt-6">
                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-[#9AA0A6] mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-[#202124]">{student.phone}</p>
                                    <p className="text-xs text-[#5F6368]">Parent: {student.parentName}</p>
                                </div>
                            </div>
                            {student.email && (
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-[#9AA0A6]" />
                                    <p className="text-sm text-[#202124]">{student.email}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-[#9AA0A6]" />
                                <p className="text-sm text-[#202124]">Born: {new Date(student.dob).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-[#9AA0A6] mt-0.5" />
                                <p className="text-sm text-[#202124] leading-relaxed">{student.address}</p>
                            </div>
                            <div className="flex items-center gap-3 pt-2 text-[#5F6368]">
                                <TrendingUp size={18} />
                                <p className="text-xs">Joined {new Date(student.joiningDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-base bg-[#E8F0FE] border-none p-6 rounded-lg text-center">
                        <p className="text-xs font-medium text-[#1A73E8] uppercase tracking-wide">Quick Actions</p>
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            <Link href={`/fees/new?studentId=${studentId}`} className="btn-primary w-full py-2.5 text-sm">Record Fee Payment</Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Tabs/Sections */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Tabs Navigation */}
                    <div className="bg-white border-b border-[#E8EAED] flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("performance")}
                            className={`${tabBase} ${activeTab === "performance" ? tabActive : tabInactive}`}
                        >
                            <TrendingUp size={16} /> Performance
                        </button>
                        <button
                            onClick={() => setActiveTab("fees")}
                            className={`${tabBase} ${activeTab === "fees" ? tabActive : tabInactive}`}
                        >
                            <ShieldAlert size={16} /> Fees History
                        </button>
                    </div>

                    {/* Performance Tab */}
                    {activeTab === "performance" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Analytics Section - PROGRESISON & SUBJECTS */}
                            {marks.length > 0 && (
                                <div className="grid grid-cols-1 gap-6">

                                    {/* Progression Chart */}
                                    <div className="card-base bg-white border border-[#E8EAED] p-6 rounded-lg shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={18} className="text-[#1A73E8]" />
                                                <h3 className="font-medium text-[#202124]">Learning Progression</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-[#9AA0A6] uppercase">Exam:</span>
                                                <select
                                                    className="text-xs font-medium border border-[#DADCE0] rounded px-2 py-1 bg-[#F8F9FA] focus:outline-none focus:border-[#4285F4]"
                                                    value={activeProgressionType}
                                                    onChange={(e) => setActiveProgressionType(e.target.value)}
                                                >
                                                    {examNames.map(name => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={progressionData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F4" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#5F6368', fontSize: 11 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5F6368', fontSize: 11 }} domain={[0, 100]} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        formatter={(value) => [`${value}%`, 'Score']}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="percentage"
                                                        stroke="#4285F4"
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: '#4285F4', strokeWidth: 2, stroke: '#FFF' }}
                                                        activeDot={{ r: 6, fill: '#1A73E8' }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Subject Comparison */}
                                    <div className="card-base bg-white border border-[#E8EAED] p-6 rounded-lg shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 size={18} className="text-[#4285F4]" />
                                                <h3 className="font-medium text-[#202124]">Subject-wise Proficiency</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-[#9AA0A6] uppercase">Date:</span>
                                                <select
                                                    className="text-xs font-medium border border-[#DADCE0] rounded px-2 py-1 bg-[#F8F9FA] focus:outline-none focus:border-[#4285F4]"
                                                    value={activeAnalysisDate}
                                                    onChange={(e) => setActiveAnalysisDate(e.target.value)}
                                                >
                                                    {analysisDates.map(date => (
                                                        <option key={date} value={date}>
                                                            {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analysisData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F3F4" />
                                                    <XAxis type="number" domain={[0, 100]} hide />
                                                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#202124', fontSize: 11, fontWeight: 500 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F8F9FA' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        formatter={(value, name, props) => [`${props.payload.score} / ${props.payload.max} (${value}%)`, 'Performance']}
                                                    />
                                                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={20}>
                                                        {analysisData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.percentage >= 35 ? '#4285F4' : '#EA4335'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Academic Performance Section - DETAILED TABLE */}
                            <div className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E8EAED] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={18} className="text-[#1A73E8]" />
                                        <h3 className="font-medium text-[#202124]">Performance Details</h3>
                                    </div>
                                    <span className="text-xs font-medium text-[#5F6368] uppercase">{marks.length} Score Entries</span>
                                </div>

                                <div className="p-0">
                                    {marks.length === 0 ? (
                                        <div className="p-8 text-center text-[#5F6368] italic text-sm">No exam marks recorded yet.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[#FFFFFF] border-b border-[#E8EAED]">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-medium text-[#5F6368]">Exam / Subject</th>
                                                        <th className="px-6 py-3 text-right font-medium text-[#5F6368]">Score</th>
                                                        <th className="px-6 py-3 text-center font-medium text-[#5F6368]">Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E8EAED]">
                                                    {marks.map((m) => {
                                                        const examName = m.examId ? exams[m.examId]?.name : "Unknown Exam";
                                                        const percentage = marksService.calculatePercentage(m.marksObtained, m.maxMarks);
                                                        const grade = marksService.calculateGrade(percentage);
                                                        return (
                                                            <tr key={m.id} className="hover:bg-[#F8F9FA]">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-medium text-[#202124]">{m.subject}</div>
                                                                    <div className="text-[11px] text-[#5F6368]">{examName} ({new Date(m.examDate).toLocaleDateString()})</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className="font-bold">{m.marksObtained}</span> / {m.maxMarks}
                                                                    <div className="text-[10px] text-[#9AA0A6]">{percentage}%</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${percentage >= 35 ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#FCE8E6] text-[#D93025]'
                                                                        }`}>
                                                                        {grade}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fees Tab */}
                    {activeTab === "fees" && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Fees & Billing Section */}
                            <div className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E8EAED] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={18} className="text-[#F9AB00]" />
                                        <h3 className="font-medium text-[#202124]">Fee Collection History</h3>
                                    </div>
                                    <span className="text-xs font-medium text-[#5F6368] uppercase">{payments.length} Records</span>
                                </div>

                                <div className="p-0">
                                    {payments.length === 0 ? (
                                        <div className="p-8 text-center text-[#5F6368] italic text-sm">No payment history found for this student.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[#FFFFFF] border-b border-[#E8EAED]">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-medium text-[#5F6368]">Month / Year</th>
                                                        <th className="px-6 py-3 text-right font-medium text-[#5F6368]">Amount</th>
                                                        <th className="px-6 py-3 text-center font-medium text-[#5F6368]">Receipt</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E8EAED]">
                                                    {payments.map((p) => (
                                                        <tr key={p.id} className="hover:bg-[#F8F9FA]">
                                                            <td className="px-6 py-4">
                                                                <div className="font-medium text-[#202124]">{p.feeMonth} {p.feeYear}</div>
                                                                <div className="text-[11px] text-[#9AA0A6]">{p.paymentDate}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-[#1E8E3E]">₹{p.amount.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => pdfService.generateReceipt(p)}
                                                                    className="p-2 text-[#4285F4] hover:bg-[#E8F0FE] rounded-full transition-all"
                                                                    title="Download PDF"
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
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
