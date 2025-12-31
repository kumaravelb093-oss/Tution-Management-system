"use client";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu, GraduationCap } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row text-[#202124]">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-[#E8EAED] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1A73E8] rounded-md flex items-center justify-center">
                        <GraduationCap size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-[#202124]">Diamond Tuitions</span>
                </div>
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-[#5F6368] hover:bg-[#F8F9FA] rounded-md transition-colors"
                    aria-label="Open Menu"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </div>
        </div>
    );
}
