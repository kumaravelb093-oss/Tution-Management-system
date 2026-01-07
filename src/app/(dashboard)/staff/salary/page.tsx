"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Calculator, Check, Loader2, Download } from "lucide-react";
import { staffService, Staff, StaffSalary } from "@/services/staffService";
import { pdfService } from "@/services/pdfService";

export default function StaffSalaryPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [salaries, setSalaries] = useState<StaffSalary[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [totalWorkingDays, setTotalWorkingDays] = useState(26);

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffData, salaryData] = await Promise.all([
                staffService.getStaff(),
                staffService.getMonthlySalaries(selectedMonth, selectedYear)
            ]);
            // Include all staff (don't filter by status - staff may not have status field)
            setStaff(staffData);
            setSalaries(salaryData);
            console.log("Loaded staff:", staffData.length, "Loaded salaries:", salaryData.length);
        } catch (error) {
            console.error("Error loading data:", error);
            // Set empty arrays on error to prevent crash
            setStaff([]);
            setSalaries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSalary = async (member: Staff) => {
        setGenerating(true);
        try {
            // Validate staff member has required fields
            if (!member.id) {
                throw new Error("Staff ID is missing");
            }
            if (!member.fullName) {
                throw new Error("Staff name is missing");
            }

            // Safe defaults for all values
            const staffBasicSalary = member.basicSalary || 0;
            const staffSalaryType = member.salaryType || "Monthly";
            const staffName = member.fullName || "Unknown";
            const staffCode = member.staffCode || "N/A";

            // Use default working days if not set
            const workDays = totalWorkingDays || 26;

            // For simplicity, assume full attendance (no deductions)
            // This makes salary generation work even without attendance records
            const presentDays = workDays;
            const halfDays = 0;
            const absentDays = 0;

            // Calculate net salary
            let netSalary = staffBasicSalary;
            // Per user request: Deductions removed.

            if (staffSalaryType === "Monthly") {
                // Pro-rata: Pay for effective working days only
                const perDaySalary = staffBasicSalary / workDays;
                const effectiveDays = presentDays + (halfDays * 0.5);
                netSalary = Math.round(perDaySalary * effectiveDays);
            } else if (staffSalaryType === "Daily") {
                netSalary = staffBasicSalary * presentDays;
            } else {
                // Hourly - 8 hours per day
                netSalary = staffBasicSalary * 8 * presentDays;
            }

            // Create salary record
            const salaryData = {
                staffId: member.id,
                staffName: staffName,
                month: selectedMonth,
                year: selectedYear,
                totalWorkingDays: workDays,
                presentDays: presentDays,
                absentDays: absentDays,
                halfDays: halfDays,
                basicSalary: staffBasicSalary,
                deductions: 0, // Explicitly 0
                netSalary: netSalary,
                paymentStatus: "Unpaid" as const
            };

            console.log("Generating salary with data:", salaryData);

            const salaryRecord = await staffService.generateSalary(salaryData);

            setSalaries(prev => [...prev, salaryRecord]);

            // Auto-download PDF
            pdfService.generateSalarySlip(salaryRecord);

            alert(`✅ Salary generated successfully!\n\nStaff: ${staffName} (${staffCode})\nMonth: ${selectedMonth} ${selectedYear}\nNet Salary: ₹${netSalary.toLocaleString()}`);
        } catch (error: any) {
            console.error("Salary generation error:", error);
            const errorMessage = error?.message || error?.code || "Unknown error occurred";
            alert(`❌ Failed to generate salary.\n\nError: ${errorMessage}\n\nPlease check that:\n1. Staff has a valid ID\n2. Basic salary is set\n3. You have internet connection`);
        } finally {
            setGenerating(false);
        }
    };


    const handleMarkPaid = async (salaryId: string) => {
        try {
            await staffService.updateSalary(salaryId, { paymentStatus: "Paid", paidAt: new Date().toISOString() });
            setSalaries(prev => prev.map(s => s.id === salaryId ? { ...s, paymentStatus: "Paid" } : s));
        } catch (error) {
            console.error(error);
            alert("Failed to mark as paid.");
        }
    };

    const getSalaryForStaff = (staffId: string) => {
        return salaries.find(s => s.staffId === staffId && s.month === selectedMonth && s.year === selectedYear);
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/staff" className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal text-[#202124]">Staff Salary</h1>
                        <p className="text-sm text-[#5F6368] mt-1">Generate and manage monthly payroll</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="card-base bg-white border border-[#E8EAED] p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[#5F6368]">Month:</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-[#DADCE0] rounded-md text-[#202124] focus:outline-none focus:border-[#4285F4]"
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[#5F6368]">Year:</label>
                    <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-[#DADCE0] rounded-md text-[#202124] focus:outline-none focus:border-[#4285F4]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[#5F6368]">Working Days:</label>
                    <input
                        type="number"
                        value={totalWorkingDays}
                        onChange={(e) => setTotalWorkingDays(Number(e.target.value))}
                        className="w-20 px-3 py-2 border border-[#DADCE0] rounded-md text-[#202124] focus:outline-none focus:border-[#4285F4]"
                    />
                </div>
            </div>

            {/* Salary Table */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-[#5F6368]">Loading salary data...</div>
                ) : staff.length === 0 ? (
                    <div className="p-12 text-center text-[#5F6368]">No active staff members found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Staff</th>
                                    <th className="px-6 py-4 text-right text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Basic</th>
                                    <th className="px-6 py-4 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Present</th>

                                    <th className="px-6 py-4 text-right text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Net Salary</th>
                                    <th className="px-6 py-4 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {staff.map((member) => {
                                    const salary = getSalaryForStaff(member.id!);
                                    return (
                                        <tr key={member.id} className="hover:bg-[#F8F9FA] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[14px] font-medium text-[#202124]">{member.fullName}</p>
                                                <p className="text-[11px] text-[#9AA0A6]">{member.role}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[14px] text-[#202124]">₹{(member.basicSalary || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center text-[14px] text-[#5F6368]">
                                                {salary ? `${salary.presentDays} / ${salary.totalWorkingDays}` : "-"}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {salary ? (
                                                    <span className="text-[14px] font-bold text-[#1E8E3E]">₹{salary.netSalary.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-[14px] text-[#9AA0A6]">Not Generated</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {salary ? (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${salary.paymentStatus === 'Paid'
                                                        ? 'bg-[#E6F4EA] text-[#1E8E3E]'
                                                        : 'bg-[#FEF7E0] text-[#F9AB00]'
                                                        }`}>
                                                        {salary.paymentStatus}
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-[#9AA0A6]">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {!salary ? (
                                                    <button
                                                        onClick={() => handleGenerateSalary(member)}
                                                        disabled={generating}
                                                        className="px-3 py-1.5 text-xs font-medium bg-[#4285F4] text-white rounded-md hover:bg-[#3367D6] transition-colors flex items-center gap-1 mx-auto"
                                                    >
                                                        <Calculator size={14} /> Generate
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {salary.paymentStatus === "Unpaid" ? (
                                                            <button
                                                                onClick={() => handleMarkPaid(salary.id!)}
                                                                className="px-3 py-1.5 text-xs font-medium bg-[#1E8E3E] text-white rounded-md hover:bg-[#166c2e] transition-colors flex items-center gap-1"
                                                            >
                                                                <Check size={14} /> Paid
                                                            </button>
                                                        ) : (
                                                            <span className="text-[12px] text-[#9AA0A6] px-2">Completed</span>
                                                        )}
                                                        <button
                                                            onClick={() => pdfService.generateSalarySlip(salary)}
                                                            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-gray-100 rounded-md transition-colors"
                                                            title="Download Salary Slip"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                )}
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
    );
}
