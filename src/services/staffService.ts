import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    getDoc,
    writeBatch
} from "firebase/firestore";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Staff {
    id?: string;
    staffCode?: string; // Auto-generated: DT-S-XXXX
    fullName: string;
    gender: "Male" | "Female" | "Other";
    phone: string;
    email?: string;
    address: string;
    role: string; // Teacher, Admin, Accountant, etc.
    qualification?: string;
    joiningDate: string;
    salaryType: "Monthly" | "Daily" | "Hourly";
    basicSalary: number;
    status: "Active" | "Inactive";
    createdAt?: any;
}

export interface StaffAttendance {
    id?: string;
    staffId: string;
    staffName?: string;
    date: string; // YYYY-MM-DD
    status: "Present" | "Absent" | "Half Day";
    createdAt?: any;
}

export interface StaffSalary {
    id?: string;
    staffId: string;
    staffName?: string;
    month: string; // e.g., "January"
    year: number;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    basicSalary: number;
    deductions: number;
    netSalary: number;
    paymentStatus: "Paid" | "Unpaid";
    paidAt?: any;
    createdAt?: any;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

const STAFF_COLLECTION = "staff";
const ATTENDANCE_COLLECTION = "staff_attendance";
const SALARY_COLLECTION = "staff_salary";

export const staffService = {

    // --- STAFF CRUD ---

    getStaff: async (): Promise<Staff[]> => {
        try {
            // Simple query without orderBy to avoid Firestore index requirements
            const snapshot = await getDocs(collection(db, STAFF_COLLECTION));
            const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
            // Sort client-side by createdAt (newest first)
            return staffList.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });
        } catch (error) {
            console.error("Error fetching staff:", error);
            // Return empty array instead of throwing to prevent page crash
            return [];
        }
    },

    getStaffById: async (id: string): Promise<Staff | null> => {
        try {
            const docRef = doc(db, STAFF_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Staff;
            }
            return null;
        } catch (error) {
            console.error("Error fetching staff by ID:", error);
            throw error;
        }
    },

    addStaff: async (data: Omit<Staff, "id" | "staffCode" | "createdAt">): Promise<Staff> => {
        try {
            // Generate Staff Code: DT-S-XXXX
            const random = Math.floor(1000 + Math.random() * 9000);
            const staffCode = `DT-S-${random}`;

            const docRef = await addDoc(collection(db, STAFF_COLLECTION), {
                ...data,
                staffCode,
                createdAt: Timestamp.now()
            });
            return { id: docRef.id, staffCode, ...data };
        } catch (error) {
            console.error("Error adding staff:", error);
            throw error;
        }
    },

    updateStaff: async (id: string, data: Partial<Staff>): Promise<void> => {
        try {
            const docRef = doc(db, STAFF_COLLECTION, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating staff:", error);
            throw error;
        }
    },

    deleteStaff: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, STAFF_COLLECTION, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting staff:", error);
            throw error;
        }
    },

    // --- ATTENDANCE ---

    markAttendance: async (entries: Omit<StaffAttendance, "id" | "createdAt">[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            entries.forEach(entry => {
                const docRef = doc(collection(db, ATTENDANCE_COLLECTION));
                batch.set(docRef, { ...entry, createdAt: Timestamp.now() });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking attendance:", error);
            throw error;
        }
    },

    getAttendanceForDate: async (date: string): Promise<StaffAttendance[]> => {
        try {
            const q = query(collection(db, ATTENDANCE_COLLECTION), where("date", "==", date));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffAttendance[];
        } catch (error) {
            console.error("Error fetching attendance for date:", error);
            throw error;
        }
    },

    getFullAttendance: async (staffId: string): Promise<StaffAttendance[]> => {
        try {
            const q = query(
                collection(db, ATTENDANCE_COLLECTION),
                where("staffId", "==", staffId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffAttendance[];
        } catch (error) {
            console.error("Error fetching full attendance:", error);
            throw error;
        }
    },

    getAllAttendanceForMonth: async (month: number, year: number): Promise<StaffAttendance[]> => {
        try {
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

            const q = query(
                collection(db, ATTENDANCE_COLLECTION),
                where("date", ">=", startDate),
                where("date", "<=", endDate)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffAttendance[];
        } catch (error) {
            console.error("Error fetching all attendance for month:", error);
            // Return empty if index missing (fallback)
            return [];
        }
    },

    getMonthlyAttendance: async (staffId: string, month: number, year: number): Promise<StaffAttendance[]> => {
        try {
            // Simpler query to avoid Firestore composite index requirements
            // Fetch all attendance for this staff and filter by date client-side
            const q = query(
                collection(db, ATTENDANCE_COLLECTION),
                where("staffId", "==", staffId)
            );
            const snapshot = await getDocs(q);
            const allAttendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffAttendance[];

            // Filter by month/year client-side
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

            return allAttendance.filter(a => a.date >= startDate && a.date <= endDate);
        } catch (error) {
            console.error("Error fetching monthly attendance:", error);
            throw error;
        }
    },

    getPresentTodayCount: async (): Promise<number> => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const q = query(
                collection(db, ATTENDANCE_COLLECTION),
                where("date", "==", today),
                where("status", "==", "Present")
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error("Error counting present today:", error);
            return 0;
        }
    },

    // --- SALARY ---

    generateSalary: async (data: Omit<StaffSalary, "id" | "createdAt">): Promise<StaffSalary> => {
        try {
            const docRef = await addDoc(collection(db, SALARY_COLLECTION), {
                ...data,
                createdAt: Timestamp.now()
            });
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error("Error generating salary:", error);
            throw error;
        }
    },

    updateSalary: async (id: string, data: Partial<StaffSalary>): Promise<void> => {
        try {
            const docRef = doc(db, SALARY_COLLECTION, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating salary:", error);
            throw error;
        }
    },

    getSalaryHistory: async (staffId: string): Promise<StaffSalary[]> => {
        try {
            const q = query(
                collection(db, SALARY_COLLECTION),
                where("staffId", "==", staffId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffSalary[];
        } catch (error) {
            console.error("Error fetching salary history:", error);
            throw error;
        }
    },

    getMonthlySalaries: async (month: string, year: number): Promise<StaffSalary[]> => {
        try {
            // Simple query to avoid Firestore index requirements
            // Fetch all salaries and filter client-side
            const snapshot = await getDocs(collection(db, SALARY_COLLECTION));
            const allSalaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffSalary[];
            // Filter by month and year client-side
            return allSalaries.filter(s => s.month === month && s.year === year);
        } catch (error) {
            console.error("Error fetching monthly salaries:", error);
            // Return empty array instead of throwing to prevent page crash
            return [];
        }
    },

    calculateNetSalary: (basicSalary: number, salaryType: string | undefined, presentDays: number, halfDays: number, totalWorkingDays: number): { deductions: number, netSalary: number } => {
        // Ensure we have valid numbers
        const salary = basicSalary || 0;
        const present = presentDays || 0;
        const half = halfDays || 0;
        const workDays = totalWorkingDays || 26;
        const type = salaryType || "Monthly"; // Default to Monthly if not specified

        // Per user request: "Remove deductions from salary tab... input as actual up time".
        // We will calculate Net Salary based on actual attendance (Pro-rata), but set explicit "Deductions" field to 0.

        if (type === "Monthly") {
            const perDaySalary = salary / workDays;
            const effectiveDays = present + (half * 0.5);
            // Pro-rata calculation: Pay only for days worked
            const netSalary = Math.round(perDaySalary * effectiveDays);
            return { deductions: 0, netSalary };
        } else if (type === "Daily") {
            const effectiveDays = present + (half * 0.5);
            const netSalary = Math.round(salary * effectiveDays);
            return { deductions: 0, netSalary };
        } else { // Hourly - simplified
            const effectiveDays = present + (half * 0.5);
            const netSalary = Math.round(salary * 8 * effectiveDays);
            return { deductions: 0, netSalary };
        }
    }
};
