"use client";
import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { feeService } from "@/services/feeService";
import { studentService } from "@/services/studentService";
import { marksService } from "@/services/marksService";
import { ArrowUpRight, TrendingUp, PieChart as PieIcon } from "lucide-react";

export default function AnalyticsPage() {
    const [feesData, setFeesData] = useState<any[]>([]);
    const [studentStats, setStudentStats] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [payments, students, exams] = await Promise.all([
                feeService.getRecentPayments(1000), // Get all recent to aggregate
                studentService.getStudents(),
                marksService.getExams()
            ]);

            // 1. Monthly Fee Collection
            const feesByMonth = payments.reduce((acc: any, curr) => {
                const key = `${curr.feeMonth.substring(0, 3)}`;
                acc[key] = (acc[key] || 0) + Number(curr.amount);
                return acc;
            }, {});

            const feesChartData = Object.keys(feesByMonth).map(key => ({
                name: key,
                amount: feesByMonth[key]
            }));
            setFeesData(feesChartData);

            // 2. Student Distribution by Grade
            const studentsByGrade = students.reduce((acc: any, curr) => {
                acc[curr.grade] = (acc[curr.grade] || 0) + 1;
                return acc;
            }, {});

            const gradeChartData = Object.keys(studentsByGrade).map(key => ({
                name: key,
                count: studentsByGrade[key]
            }));
            setStudentStats(gradeChartData);

            // 3. Status Distribution
            const active = students.filter(s => s.status === 'Active').length;
            const inactive = students.length - active;
            setStatusData([
                { name: 'Active', value: active, color: '#1E8E3E' },
                { name: 'Inactive', value: inactive, color: '#D93025' },
            ]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#5F6368] font-medium text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Analytics & Reports</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Key performance indicators and insights</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Fee Collection Chart */}
                <div className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-normal text-[#202124]">Revenue Trends</h3>
                            <p className="text-xs text-[#5F6368]">Monthly fee collection</p>
                        </div>
                        <div className="p-2 bg-[#E8F0FE] rounded-lg">
                            <TrendingUp size={20} className="text-[#1A73E8]" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#5F6368', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#5F6368', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F8F9FA' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E8EAED', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#1A73E8"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Student Status Pie Chart */}
                <div className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-normal text-[#202124]">Student Distribution</h3>
                            <p className="text-xs text-[#5F6368]">Active vs Inactive students</p>
                        </div>
                        <div className="p-2 bg-[#E6F4EA] rounded-lg">
                            <PieIcon size={20} className="text-[#1E8E3E]" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grade Distribution */}
                <div className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm p-6 lg:col-span-2">
                    <h3 className="text-lg font-normal text-[#202124] mb-6">Students by Grade</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {studentStats.map((stat, index) => (
                            <div key={index} className="bg-[#F8F9FA] p-4 rounded-lg text-center border border-[#E8EAED]">
                                <p className="text-2xl font-normal text-[#1A73E8]">{stat.count}</p>
                                <p className="text-sm text-[#5F6368] mt-1">{stat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
