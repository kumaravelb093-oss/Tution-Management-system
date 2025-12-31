"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  BarChart3,
  LogOut,
  GraduationCap
} from "lucide-react";
import { auth } from "@/lib/firebase";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Fees & Billing", href: "/fees", icon: CreditCard },
  { name: "Marks & Exams", href: "/marks", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={`h-screen w-64 bg-white border-r border-[#DADCE0] flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A73E8] rounded-lg flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-[#202124]">Diamond Tuitions</h1>
              <p className="text-[11px] text-[#5F6368]">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()} // Close sidebar on mobile when link clicked
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-colors ${isActive
                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                    : "text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]"
                    }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-[#E8EAED]">
          <div className="px-4 py-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1A73E8] rounded-full flex items-center justify-center text-white font-medium text-sm">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#202124] truncate">Administrator</p>
                <p className="text-[11px] text-[#5F6368] truncate">admin@diamond.edu</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 px-4 py-2.5 text-[#5F6368] hover:text-[#D93025] w-full hover:bg-[#FCE8E6] rounded-lg transition-colors text-[14px] font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
