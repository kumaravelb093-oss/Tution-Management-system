"use client";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F8F9FA] flex text-[#202124]">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </div>
        </div>
    );
}
