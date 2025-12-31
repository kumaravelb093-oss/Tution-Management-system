"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, Search, FileText } from "lucide-react";
import { feeService, Payment } from "@/services/feeService";
import { pdfService } from "@/services/pdfService";

export default function FeesPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            // Load more checks in production
            const data = await feeService.getRecentPayments(100);
            setPayments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(p =>
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Fees & Billing</h1>
                    <p className="text-sm text-[#5F6368] mt-1">Track fee collections and generate receipts</p>
                </div>
                <Link href="/fees/new" className="btn-primary flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Record Payment</span>
                </Link>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-base bg-[#E8F0FE] border-none shadow-none md:col-span-1 p-6 flex flex-col justify-center">
                    <p className="text-[13px] font-medium text-[#1A73E8] uppercase tracking-wide">Total Collection (Visible)</p>
                    <h2 className="text-3xl font-normal text-[#174EA6] mt-1">₹{totalCollected.toLocaleString()}</h2>
                </div>

                <div className="md:col-span-2 flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student, receipt number..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#DADCE0] rounded-lg text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] shadow-sm transition-shadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card-base bg-white p-0 overflow-hidden shadow-sm border border-[#E8EAED] rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-[#5F6368]">
                        Loading transaction history...
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-[#F1F3F4] rounded-full flex items-center justify-center mb-3">
                            <FileText size={24} className="text-[#9AA0A6]" />
                        </div>
                        <h3 className="text-[#202124] font-medium">No transactions found</h3>
                        <p className="text-[#5F6368] text-sm mt-1">Record a new payment to see it here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Date / Receipt</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Student Details</th>
                                    <th className="px-6 py-3.5 text-left text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Fee Period</th>
                                    <th className="px-6 py-3.5 text-right text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3.5 text-center text-[12px] font-medium text-[#5F6368] uppercase tracking-wider">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED] bg-white">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-[#F8F9FA] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-[14px] font-medium text-[#202124]">{payment.paymentDate}</p>
                                            <p className="text-[11px] text-[#5F6368] font-mono">{payment.receiptNumber || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[14px] font-medium text-[#202124]">{payment.studentName}</p>
                                            <p className="text-[11px] text-[#5F6368]">{payment.grade}</p>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#202124]">
                                            {payment.feeMonth} {payment.feeYear}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[14px] font-medium text-[#1E8E3E] bg-[#E6F4EA] px-2.5 py-1 rounded-full">
                                                ₹{payment.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => pdfService.generateReceipt(payment)}
                                                className="p-2 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#E8F0FE] rounded-full transition-colors inline-block"
                                                title="Download Receipt"
                                            >
                                                <Download size={18} />
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
    );
}
