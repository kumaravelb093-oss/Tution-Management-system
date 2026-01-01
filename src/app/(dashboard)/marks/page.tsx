"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Search, ArrowRight, LayoutList } from "lucide-react";
import { marksService, Exam } from "@/services/marksService";

export default function MarksPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            const data = await marksService.getExams();
            setExams(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Marks Management</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Manage exams and student performance</p>
                </div>
                <Link href="/marks/new-exam" className="btn-primary flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Create Exam</span>
                </Link>
            </div>

            {/* Search */}
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                <input
                    type="text"
                    placeholder="Search exams..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#DADCE0] rounded-lg text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] shadow-sm transition-shadow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-[#5F6368]">
                        Loading exams...
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-[#F1F3F4] rounded-full flex items-center justify-center mb-3">
                            <BookOpen size={24} className="text-[#9AA0A6]" />
                        </div>
                        <h3 className="text-[#202124] font-medium">No exams found</h3>
                        <p className="text-[#5F6368] text-sm mt-1">Create a new exam to get started.</p>
                    </div>
                ) : (
                    filteredExams.map(exam => (
                        <div key={exam.id} className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm hover:shadow-md transition-shadow group p-0 overflow-hidden flex flex-col h-full">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-[#F3E8FD] text-[#9333EA] rounded-lg">
                                        <LayoutList size={20} />
                                    </div>
                                    <span className="text-xs font-medium bg-[#F1F3F4] text-[#5F6368] px-2 py-1 rounded-full">
                                        {new Date(exam.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-medium text-[#202124] group-hover:text-[#4285F4] transition-colors">{exam.name}</h3>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#5F6368]">Total Marks</span>
                                        <span className="font-medium text-[#202124]">{exam.maxMarks}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#5F6368]">Subjects</span>
                                        <span className="font-medium text-[#202124]">{exam.subjects.length}</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/marks/entry/${exam.id}`}
                                className="p-4 bg-[#F8F9FA] border-t border-[#E8EAED] text-[#4285F4] text-sm font-medium flex items-center justify-between group-hover:bg-[#E8F0FE] transition-colors"
                            >
                                Enter Marks
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
