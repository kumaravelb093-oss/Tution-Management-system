"use client";
import { useEffect, useState } from "react";
import { Users, CreditCard, BookOpen, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { studentService, Student } from "@/services/studentService";
import { feeService, Payment } from "@/services/feeService";
import { marksService, Exam } from "@/services/marksService";
import Link from "next/link";

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsData, paymentsData, examsData] = await Promise.all([
        studentService.getStudents(),
        feeService.getRecentPayments(50),
        marksService.getExams(),
      ]);
      setStudents(studentsData);
      setPayments(paymentsData);
      setExams(examsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "Active").length;
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExams = exams.length;

  // Current month fees
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const currentMonthPayments = payments.filter(
    p => p.feeMonth === currentMonth && p.feeYear === currentYear
  );
  const currentMonthCollection = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const recentPayments = payments.slice(0, 5);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#5F6368] font-medium text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-normal text-[#202124]">Dashboard Overview</h1>
          <p className="text-sm text-[#5F6368] mt-1">Diamond Tuitions Management</p>
        </div>
        <div>
          <span className="text-xs font-medium bg-[#E8F0FE] text-[#1A73E8] px-3 py-1 rounded-full">
            {currentMonth} {currentYear}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-base bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Total Students</p>
              <h3 className="text-3xl font-normal text-[#202124] mt-2">{totalStudents}</h3>
            </div>
            <div className="p-2 bg-[#E8F0FE] rounded-lg">
              <Users size={20} className="text-[#1A73E8]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-medium text-[#1E8E3E] bg-[#E6F4EA] px-2 py-0.5 rounded-full">
              {activeStudents} Active
            </span>
          </div>
        </div>

        <div className="card-base bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Total Collection</p>
              <h3 className="text-3xl font-normal text-[#202124] mt-2">₹{totalCollected.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-[#E6F4EA] rounded-lg">
              <CreditCard size={20} className="text-[#1E8E3E]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#5F6368]">{payments.length} total transactions</p>
          </div>
        </div>

        <div className="card-base bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Monthly Revenue</p>
              <h3 className="text-3xl font-normal text-[#202124] mt-2">₹{currentMonthCollection.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-[#FEF7E0] rounded-lg">
              <TrendingUp size={20} className="text-[#F9AB00]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#5F6368]">{currentMonthPayments.length} payments this month</p>
          </div>
        </div>

        <div className="card-base bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#5F6368] uppercase tracking-wide">Exams</p>
              <h3 className="text-3xl font-normal text-[#202124] mt-2">{totalExams}</h3>
            </div>
            <div className="p-2 bg-[#F3E8FD] rounded-lg">
              <BookOpen size={20} className="text-[#9333EA]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#5F6368]">Conducted total</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Payments Table */}
        <div className="lg:col-span-2 card-base bg-white p-0 overflow-hidden">
          <div className="p-5 border-b border-[#E8EAED] flex justify-between items-center bg-white">
            <h3 className="font-medium text-[#202124]">Recent Payments</h3>
            <Link href="/fees" className="text-sm text-[#1A73E8] hover:underline font-medium flex items-center gap-1">
              View All
            </Link>
          </div>
          <table className="w-full">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">Student</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">Details</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-[#9AA0A6]">
                    No payments found.
                  </td>
                </tr>
              ) : (
                recentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-medium text-[#202124]">{p.studentName}</p>
                      <p className="text-[11px] text-[#5F6368]">{p.grade}</p>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#5F6368]">{p.feeMonth} {p.feeYear}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[13px] font-medium text-[#1E8E3E]">₹{p.amount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="card-base bg-white p-5 h-fit">
          <h3 className="font-medium text-[#202124] mb-4">Quick Actions</h3>

          <div className="space-y-3">
            <Link href="/students/add" className="w-full flex items-center justify-between p-3 border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA] hover:border-[#DADCE0] transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-[#E8F0FE] p-2 rounded-md">
                  <Users size={18} className="text-[#1A73E8]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#202124]">Add Student</p>
                  <p className="text-[11px] text-[#5F6368]">New admission</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#9AA0A6] group-hover:text-[#1A73E8]" />
            </Link>

            <Link href="/fees/new" className="w-full flex items-center justify-between p-3 border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA] hover:border-[#DADCE0] transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-[#E6F4EA] p-2 rounded-md">
                  <CreditCard size={18} className="text-[#1E8E3E]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#202124]">Collect Fees</p>
                  <p className="text-[11px] text-[#5F6368]">Record payment</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#9AA0A6] group-hover:text-[#1A73E8]" />
            </Link>

            <Link href="/marks/new-exam" className="w-full flex items-center justify-between p-3 border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA] hover:border-[#DADCE0] transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-[#F3E8FD] p-2 rounded-md">
                  <BookOpen size={18} className="text-[#9333EA]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#202124]">Create Exam</p>
                  <p className="text-[11px] text-[#5F6368]">New test schedule</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#9AA0A6] group-hover:text-[#1A73E8]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
