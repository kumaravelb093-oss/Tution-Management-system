"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { marksService } from "@/services/marksService";
import { ArrowLeft, Save, Plus, X, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [grade, setGrade] = useState("");
    const [maxMarks, setMaxMarks] = useState("100");
    const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Science", "English"]);
    const [newSubject, setNewSubject] = useState("");

    const handleAddSubject = () => {
        if (newSubject.trim()) {
            setSubjects([...subjects, newSubject.trim()]);
            setNewSubject("");
        }
    };

    const handleRemoveSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (subjects.length === 0) {
            alert("Please add at least one subject");
            return;
        }

        setLoading(true);
        try {
            await marksService.createExam({
                name,
                date,
                grade,
                maxMarks: Number(maxMarks),
                subjects
            });
            router.push("/marks");
        } catch (error) {
            console.error(error);
            alert("Failed to create exam");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/marks" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Create Exam</h1>
                    <p className="text-sm text-[#5F6368]">Configure exam details and subjects</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm p-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Basic Info */}
                    <div className="space-y-6">
                        <h3 className="font-medium text-[#202124] border-b border-[#E8EAED] pb-2">Exam Information</h3>

                        <div>
                            <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Exam Name *</label>
                            <input
                                type="text" required
                                placeholder="e.g. Mid-Term Examination 2024"
                                className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] text-[#202124]"
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Class / Grade *</label>
                            <input
                                type="text" required
                                placeholder="e.g. 10th Standard"
                                className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] text-[#202124]"
                                value={grade} onChange={(e) => setGrade(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Date *</label>
                            <input
                                type="date" required
                                className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] text-[#202124]"
                                value={date} onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#5F6368] mb-2 uppercase tracking-wide">Max Marks per Subject *</label>
                            <input
                                type="number" required
                                className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] text-[#202124]"
                                value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right: Subjects */}
                    <div className="space-y-6">
                        <h3 className="font-medium text-[#202124] border-b border-[#E8EAED] pb-2">Subjects</h3>

                        <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E8EAED]">
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Add new subject..."
                                    className="flex-1 px-3 py-2 bg-white border border-[#DADCE0] rounded-md text-sm focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSubject}
                                    className="p-2 bg-[#4285F4] text-white rounded-md hover:bg-[#3367D6] transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {subjects.map((subject, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-[#E8EAED] rounded-md group">
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={16} className="text-[#5F6368]" />
                                            <span className="text-[#202124] font-medium text-sm">{subject}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubject(index)}
                                            className="text-[#9AA0A6] hover:text-[#D93025] hover:bg-[#FCE8E6] p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {subjects.length === 0 && (
                                    <p className="text-center text-sm text-[#5F6368] py-4">No subjects added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#E8EAED]">
                    <Link
                        href="/marks"
                        className="px-6 py-2.5 rounded-md text-[#4285F4] font-medium hover:bg-[#E8F0FE] transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary min-w-[140px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Exam</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
