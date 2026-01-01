"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { studentService, Student } from "@/services/studentService";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AddStudentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Omit<Student, "id" | "createdAt">>({
        fullName: "",
        grade: "", // Class/Standard
        gender: "Male",
        dob: "",
        address: "",
        phone: "",
        email: "",
        parentName: "",
        joiningDate: new Date().toISOString().split("T")[0],
        status: "Active",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await studentService.addStudent(formData);
            router.push("/students");
        } catch (error) {
            console.error(error);
            alert("Failed to add student");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <Link
                    href="/students"
                    className="p-2 rounded-full hover:bg-[#E8EAED] text-[#5F6368] transition-colors"
                >
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-2xl font-normal text-[#202124]">Add New Student</h1>
                    <p className="text-sm text-[#5F6368]">Enter student admission details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card-base bg-white border border-[#E8EAED] rounded-lg shadow-sm p-8">

                <h3 className="text-[16px] font-medium text-[#202124] mb-6 border-b border-[#E8EAED] pb-2">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            placeholder="e.g. Rahul Sharma"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-shadow placeholder-[#9AA0A6]"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            name="dob"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow"
                            value={formData.dob}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Gender *
                        </label>
                        <select
                            name="gender"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow"
                            value={formData.gender}
                            onChange={handleChange}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Class / Grade *
                        </label>
                        <input
                            type="text"
                            name="grade"
                            required
                            placeholder="e.g. 10th Standard"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow placeholder-[#9AA0A6]"
                            value={formData.grade}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <h3 className="text-[16px] font-medium text-[#202124] mb-6 border-b border-[#E8EAED] pb-2">Parent & Contact Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Parent / Guardian Name *
                        </label>
                        <input
                            type="text"
                            name="parentName"
                            required
                            placeholder="Father or Mother's Name"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow placeholder-[#9AA0A6]"
                            value={formData.parentName}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            placeholder="10-digit mobile number"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow placeholder-[#9AA0A6]"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[14px] font-medium text-[#202124] mb-2">
                            Address
                        </label>
                        <textarea
                            name="address"
                            rows={3}
                            placeholder="Full residential address"
                            className="w-full px-4 py-2.5 text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-shadow placeholder-[#9AA0A6]"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8EAED]">
                    <Link
                        href="/students"
                        className="px-6 py-2.5 rounded-md text-[#4285F4] font-medium hover:bg-[#E8F0FE] transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary min-w-[120px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Student</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
