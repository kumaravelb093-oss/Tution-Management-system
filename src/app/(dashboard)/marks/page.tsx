"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Search, LayoutList, TrendingUp, Users, Target, Award, Calendar } from "lucide-react";
import { marksService, Exam, MarksEntry } from "@/services/marksService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function MarksPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeExamName, setActiveExamName] = useState<string>("");
    const [activeDateIndex, setActiveDateIndex] = useState<number>(0);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            const data = await marksService.getExams();
            setExams(data);

            if (data.length > 0) {
                const names = Array.from(new Set(data.map(e => e.name)));
                const firstName = names[0];
                setActiveExamName(firstName);

                // Fetch details for the first exam of this name
                const firstExams = data.filter(e => e.name === firstName).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                if (firstExams[0]?.id) {
                    await loadExamDetails(firstExams[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadExamDetails = async (id: string) => {
        try {
            const fullExam = await marksService.getExam(id);
            if (fullExam) {
                setExams(prev => prev.map(e => e.id === id ? fullExam : e));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Grouping Logic
    const examNames = Array.from(new Set(exams.map(e => e.name)));
    const examsOfActiveName = exams
        .filter(e => e.name === activeExamName)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const activeExam = examsOfActiveName[activeDateIndex];

    // Trigger detail fetch when active selection changes
    useEffect(() => {
        if (activeExam?.id && !activeExam.entries) {
            loadExamDetails(activeExam.id);
        }
    }, [activeExam?.id]);

    // Analytics Calculations
    const calculateAnalytics = (exam: Exam | undefined) => {
        if (!exam || !exam.entries || exam.entries.length === 0) return null;

        const studentTotals: Record<string, number> = {};
        const subjectTotals: Record<string, { sum: number, count: number }> = {};
        exam.subjects.forEach(s => subjectTotals[s] = { sum: 0, count: 0 });

        exam.entries.forEach(entry => {
            if (!studentTotals[entry.studentId]) studentTotals[entry.studentId] = 0;
            studentTotals[entry.studentId] += entry.marksObtained;

            if (subjectTotals[entry.subject]) {
                subjectTotals[entry.subject].sum += entry.marksObtained;
                subjectTotals[entry.subject].count += 1;
            }
        });

        const totalsArray = Object.values(studentTotals);
        const maxPossiblePerStudent = exam.maxMarks * exam.subjects.length;

        const average = totalsArray.reduce((p, c) => p + c, 0) / totalsArray.length;
        const highest = Math.max(...totalsArray);
        const lowest = Math.min(...totalsArray);

        const passCount = totalsArray.filter(t => (t / maxPossiblePerStudent) >= 0.35).length;

        const subjectData = exam.subjects.map(s => ({
            subject: s,
            average: subjectTotals[s].count > 0
                ? Math.round((subjectTotals[s].sum / subjectTotals[s].count))
                : 0
        }));

        return {
            average: Math.round((average / maxPossiblePerStudent) * 100),
            highest,
            lowest,
            passRate: Math.round((passCount / totalsArray.length) * 100),
            subjectData
        };
    };

    const analytics = calculateAnalytics(activeExam);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Marks & Performance</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Institutional examination results and analytics</p>
                </div>
                <Link href="/marks/new-exam" className="btn-primary flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Create Exam</span>
                </Link>
            </div>

            {/* Exam Name Tabs */}
            <div className="flex items-center gap-1 border-b border-[#E8EAED] overflow-x-auto no-scrollbar scroll-smooth">
                {examNames.length === 0 ? (
                    <div className="py-2 text-sm text-[#5F6368]">No exams recorded yet</div>
                ) : (
                    examNames.map(name => (
                        <button
                            key={name}
                            onClick={() => { setActiveExamName(name); setActiveDateIndex(0); }}
                            className={`px-6 py-4 text-sm font-medium transition-all relative min-w-fit ${activeExamName === name
                                ? 'text-[#1A73E8]'
                                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
                                }`}
                        >
                            {name}
                            {activeExamName === name && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A73E8]" />
                            )}
                        </button>
                    ))
                )}
            </div>

            {activeExamName && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Date Sub-tabs Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                            <span className="text-xs font-bold text-[#9AA0A6] uppercase tracking-wider shrink-0">Select Date:</span>
                            {examsOfActiveName.map((e, idx) => (
                                <button
                                    key={e.id}
                                    onClick={() => setActiveDateIndex(idx)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${activeDateIndex === idx
                                        ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]'
                                        : 'bg-white text-[#5F6368] border-[#DADCE0] hover:border-[#9AA0A6]'
                                        }`}
                                >
                                    {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </button>
                            ))}
                        </div>
                        <Link
                            href={`/marks/entry/${activeExam?.id}`}
                            className="flex items-center gap-2 text-sm font-medium text-[#1A73E8] hover:underline"
                        >
                            <Plus size={16} /> Mark Entry Mode
                        </Link>
                    </div>

                    {/* Analytics Summary */}
                    {analytics ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="card-base bg-white border border-[#E8EAED] p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#E8F0FE] text-[#1A73E8] rounded-lg"><Target size={20} /></div>
                                        <span className="text-xs font-semibold text-[#5F6368] uppercase">Class Average</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#202124]">{analytics.average}%</span>
                                    </div>
                                </div>
                                <div className="card-base bg-white border border-[#E8EAED] p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#E6F4EA] text-[#1E8E3E] rounded-lg"><Award size={20} /></div>
                                        <span className="text-xs font-semibold text-[#5F6368] uppercase">Highest Score</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#202124]">{analytics.highest}</span>
                                        <span className="text-xs text-[#5F6368]">out of {activeExam.maxMarks * activeExam.subjects.length}</span>
                                    </div>
                                </div>
                                <div className="card-base bg-white border border-[#E8EAED] p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#FEF7E0] text-[#F9AB00] rounded-lg"><Users size={20} /></div>
                                        <span className="text-xs font-semibold text-[#5F6368] uppercase">Pass Rate</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#202124]">{analytics.passRate}%</span>
                                        <span className="text-xs text-[#5F6368]">students passed</span>
                                    </div>
                                </div>
                                <div className="card-base bg-white border border-[#E8EAED] p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#FCE8E6] text-[#D93025] rounded-lg"><TrendingUp size={20} /></div>
                                        <span className="text-xs font-semibold text-[#5F6368] uppercase">Lowest Score</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#202124]">{analytics.lowest}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 card-base bg-white border border-[#E8EAED] p-6 rounded-xl shadow-sm">
                                    <h3 className="text-sm font-semibold text-[#5F6368] uppercase mb-6 flex items-center gap-2">
                                        <BookOpen size={16} className="text-[#4285F4]" />
                                        Subject-wise Performance (Average Marks)
                                    </h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics.subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F4" />
                                                <XAxis
                                                    dataKey="subject"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#5F6368', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#5F6368', fontSize: 12 }}
                                                    domain={[0, activeExam.maxMarks]}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#F8F9FA' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                                                    {analytics.subjectData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.average >= (activeExam.maxMarks * 0.35) ? '#4285F4' : '#EA4335'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card-base bg-white border border-[#E8EAED] p-6 rounded-xl shadow-sm flex flex-col">
                                    <h3 className="text-sm font-semibold text-[#5F6368] uppercase mb-6 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#1A73E8]" />
                                        Exam Metadata
                                    </h3>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-center py-3 border-b border-[#F1F3F4]">
                                            <span className="text-sm text-[#5F6368]">Total Subjects</span>
                                            <span className="text-sm font-bold text-[#202124]">{activeExam.subjects.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-[#F1F3F4]">
                                            <span className="text-sm text-[#5F6368]">Max Marks / Subject</span>
                                            <span className="text-sm font-bold text-[#202124]">{activeExam.maxMarks}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-[#F1F3F4]">
                                            <span className="text-sm text-[#5F6368]">Participation</span>
                                            <span className="text-sm font-bold text-[#202124]">
                                                {Array.from(new Set(activeExam.entries?.map(e => e.studentId))).length} Students
                                            </span>
                                        </div>
                                        <div className="mt-auto pt-6">
                                            <div className="flex items-center gap-2 text-xs text-[#5F6368] bg-[#F8F9FA] p-3 rounded-lg">
                                                <Calendar size={14} />
                                                <span>Conduct Date: {new Date(activeExam.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="card-base bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between bg-[#F8F9FA]">
                                    <div className="flex items-center gap-2">
                                        <LayoutList size={18} className="text-[#4285F4]" />
                                        <h3 className="font-medium text-[#202124]">Student-wise Results</h3>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-white text-[#5F6368] border-b border-[#E8EAED]">
                                                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-[11px]">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-[11px]">Student</th>
                                                <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-[11px]">Total</th>
                                                <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-[11px]">Percentage</th>
                                                <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-[11px]">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F3F4]">
                                            {/* Logic to aggregate student data for table */}
                                            {(() => {
                                                const studentAggregates: Record<string, { id: string, name: string, total: number }> = {};
                                                activeExam.entries?.forEach(e => {
                                                    if (!studentAggregates[e.studentId]) {
                                                        studentAggregates[e.studentId] = { id: e.studentId, name: e.studentName, total: 0 };
                                                    }
                                                    studentAggregates[e.studentId].total += e.marksObtained;
                                                });

                                                const maxTotal = activeExam.maxMarks * activeExam.subjects.length;

                                                return Object.values(studentAggregates)
                                                    .sort((a, b) => b.total - a.total)
                                                    .map((agg, idx) => {
                                                        const pct = Math.round((agg.total / maxTotal) * 100);
                                                        const pass = pct >= 35;
                                                        return (
                                                            <tr key={agg.id} className="hover:bg-[#F8F9FA] transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-[#FEF7E0] text-[#F9AB00]' : 'bg-[#F1F3F4] text-[#5F6368]'
                                                                        }`}>
                                                                        {idx + 1}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Link href={`/students/${agg.id}`} className="font-medium text-[#1A73E8] hover:underline">
                                                                        {agg.name}
                                                                    </Link>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-bold text-[#202124]">
                                                                    {agg.total} <span className="text-[10px] text-[#9AA0A6] font-normal">/ {maxTotal}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <div className="w-16 bg-[#F1F3F4] rounded-full h-1.5 overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full ${pass ? 'bg-[#1E8E3E]' : 'bg-[#D93025]'}`}
                                                                                style={{ width: `${pct}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[12px] font-medium">{pct}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${pass ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#FCE8E6] text-[#D93025]'
                                                                        }`}>
                                                                        {pass ? 'Pass' : 'Fail'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center card-base bg-white border border-dashed border-[#DADCE0]">
                            <BookOpen size={48} className="mx-auto text-[#DADCE0] mb-4" />
                            <h3 className="text-lg font-medium text-[#202124]">Data under evaluation</h3>
                            <p className="text-sm text-[#5F6368] mt-1">
                                Marks for this specific exam date haven't been finalized yet.
                            </p>
                            <Link
                                href={`/marks/entry/${activeExam?.id}`}
                                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-[#1A73E8] text-white rounded-lg text-sm font-medium hover:bg-[#1557B0] transition-colors"
                            >
                                Start Marks Entry
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
