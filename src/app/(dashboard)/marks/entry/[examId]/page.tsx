"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, use } from "react";
import { marksService, Exam, MarksEntry } from "@/services/marksService";
import { studentService, Student } from "@/services/studentService";
import { ArrowLeft, Save, Loader2, Search, Calculator, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MarksEntryPage({ params }: { params: Promise<{ examId: string }> }) {
    const { examId } = use(params);
    const router = useRouter();

    const [exam, setExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Record<string, Record<string, number>>>({}); // studentId -> subject -> marks
    // Distinguish between entry date (createdAt) and exam conduct date (examDate)
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSuccess, setSavingSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, [examId]);

    const loadData = async () => {
        try {
            const [examData, studentsData] = await Promise.all([
                marksService.getExam(examId),
                studentService.getStudents()
            ]);

            setExam(examData);
            setStudents(studentsData);

            if (examData) {
                // Default examDate to the exam's creation date if available, or stay with today
                if (examData.date) setExamDate(examData.date);

                // Initialize marks from existing entries
                if (examData.entries) {
                    const marksMap: Record<string, Record<string, number>> = {};
                    examData.entries.forEach((entry) => {
                        if (!marksMap[entry.studentId]) marksMap[entry.studentId] = {};
                        marksMap[entry.studentId][entry.subject] = entry.marksObtained;
                        // Synchronize examDate with existing records if possible (picking first one)
                        if (entry.examDate) setExamDate(entry.examDate);
                    });
                    setMarks(marksMap);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId: string, subject: string, value: string) => {
        const numValue = value === "" ? 0 : Number(value);
        if (isNaN(numValue) || numValue < 0 || (exam && numValue > exam.maxMarks)) return;

        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subject]: numValue
            }
        }));
        setSavingSuccess(false);
    };

    const handleSave = async () => {
        if (!exam) return;
        setSaving(true);
        try {
            const entries: MarksEntry[] = [];

            Object.entries(marks).forEach(([studentId, studentMarks]) => {
                const student = students.find(s => s.id === studentId);
                if (!student) return;

                Object.entries(studentMarks).forEach(([subject, marksObtained]) => {
                    entries.push({
                        studentId,
                        studentName: student.fullName,
                        subject,
                        marksObtained,
                        maxMarks: exam.maxMarks,
                        examDate: examDate // Explicitly saving the conducted date
                    });
                });
            });

            await marksService.updateExamEntries(examId, entries);
            setSavingSuccess(true);
            setTimeout(() => setSavingSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to save marks");
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateTotal = (studentId: string) => {
        const studentMarks = marks[studentId] || {};
        return Object.values(studentMarks).reduce((sum, val) => sum + val, 0);
    };

    const calculatePercentage = (studentId: string) => {
        if (!exam || exam.subjects.length === 0) return 0;
        const total = calculateTotal(studentId);
        const maxTotal = exam.maxMarks * exam.subjects.length;
        return ((total / maxTotal) * 100).toFixed(1);
    };

    if (loading || !exam) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#5F6368] font-medium text-sm">Loading exam datasheet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/marks" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal text-[#202124]">{exam.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded">
                                {exam.grade}
                            </span>
                            <span className="text-xs text-[#9AA0A6]">•</span>
                            <span className="text-sm text-[#5F6368]">Max: {exam.maxMarks} per subject</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {savingSuccess && (
                        <span className="text-sm text-[#1E8E3E] flex items-center gap-1 animate-fade-in bg-[#E6F4EA] px-3 py-1 rounded-full">
                            All Saved
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 shadow-sm min-w-[120px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save All</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Exam Date Selector & Reassurance (New Section) */}
            <div className="card-base bg-white p-4 border border-[#E8EAED] rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                    <label className="text-[12px] font-medium text-[#5F6368] uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-[#4285F4]" />
                        Exam Date (Day exam was conducted)
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#DADCE0] rounded-md text-[#202124] focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] font-medium"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-sm text-[#202124] font-medium">You can enter marks anytime, even after the exam.</p>
                    <p className="text-xs text-[#5F6368]">This date correctly classifies when the student actually wrote the paper.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                    <input
                        type="text"
                        placeholder="Filter students by name..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#DADCE0] rounded-lg text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ml-auto flex items-center gap-2 text-sm text-[#5F6368] bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-[#E8EAED]">
                    <Calculator size={16} />
                    <span>Auto-calculating totals</span>
                </div>
            </div>

            {/* Spreadsheet Grid */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full border-collapse">
                        <thead className="bg-[#F8F9FA] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-5 py-4 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider border-b border-r border-[#E8EAED] min-w-[200px] sticky left-0 bg-[#F8F9FA] z-20">Student Name</th>
                                <th className="px-4 py-4 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider border-b border-r border-[#E8EAED] min-w-[100px]">Class</th>
                                {exam.subjects.map(subject => (
                                    <th key={subject} className="px-4 py-4 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider border-b border-r border-[#E8EAED] min-w-[120px]">
                                        {subject}
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-center text-[12px] font-medium text-[#4285F4] uppercase tracking-wider border-b border-r border-[#E8EAED] min-w-[100px] bg-[#E8F0FE]/50">Total</th>
                                <th className="px-4 py-4 text-center text-[12px] font-medium text-[#1E8E3E] uppercase tracking-wider border-b border-[#E8EAED] min-w-[100px] bg-[#E6F4EA]/50">%</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredStudents.map((student) => {
                                const total = calculateTotal(student.id!);
                                const percentage = calculatePercentage(student.id!);
                                const grade = marksService.calculateGrade(Number(percentage));

                                return (
                                    <tr key={student.id} className="hover:bg-[#F8F9FA] transition-colors">
                                        <td className="px-5 py-3 border-b border-r border-[#E8EAED] sticky left-0 bg-white group-hover:bg-[#F8F9FA] z-10">
                                            <p className="text-[14px] font-medium text-[#202124]">{student.fullName}</p>
                                        </td>
                                        <td className="px-4 py-3 border-b border-r border-[#E8EAED] text-[13px] text-[#5F6368]">
                                            {student.grade}
                                        </td>
                                        {exam.subjects.map(subject => (
                                            <td key={subject} className="px-2 py-2 border-b border-r border-[#E8EAED]">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={exam.maxMarks}
                                                    className="w-full text-center py-1.5 rounded border border-transparent hover:border-[#DADCE0] focus:border-[#4285F4] focus:bg-[#E8F0FE] focus:ring-1 focus:ring-[#4285F4] transition-all text-[#202124] font-medium"
                                                    value={marks[student.id!]?.[subject] ?? ""}
                                                    onChange={(e) => handleMarkChange(student.id!, subject, e.target.value)}
                                                    placeholder="-"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 border-b border-r border-[#E8EAED] text-center font-bold text-[#4285F4] bg-[#F8F9FA]">
                                            {total}
                                        </td>
                                        <td className="px-4 py-3 border-b border-[#E8EAED] text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${Number(percentage) >= 40 ? 'text-[#1E8E3E] bg-[#E6F4EA]' : 'text-[#D93025] bg-[#FCE8E6]'
                                                }`}>
                                                {percentage}% ({grade})
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
