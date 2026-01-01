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
    writeBatch,
    getDoc,
    setDoc
} from "firebase/firestore";

export interface MarksEntry {
    id?: string;
    examId?: string; // Optional to handle page usage
    studentId: string;
    studentName: string;
    subject: string;
    marksObtained: number;
    maxMarks: number;
    examDate: string; // The day the subject exam was conducted
    createdAt?: any;
}

export interface Exam {
    id?: string;
    name: string; // e.g. "Unit Test 1", "Quarterly", "Half-Yearly", "Annual"
    date: string;
    grade: string; // Class for which this exam is conducted
    subjects: string[];
    maxMarks: number;
    createdAt?: any;
    entries?: MarksEntry[]; // Added to match usage in page
}

const EXAMS_COLLECTION = "exams";
const MARKS_COLLECTION = "marks";

export const marksService = {
    // Exam CRUD
    addExam: async (exam: Omit<Exam, "id">) => {
        try {
            const docRef = await addDoc(collection(db, EXAMS_COLLECTION), {
                ...exam,
                createdAt: Timestamp.now(),
            });
            return { id: docRef.id, ...exam };
        } catch (error) {
            console.error("Error adding exam:", error);
            throw error;
        }
    },

    // Alias for addExam used in new-exam/page.tsx
    createExam: async (exam: Omit<Exam, "id">) => {
        return marksService.addExam(exam);
    },

    getExam: async (id: string) => {
        try {
            const docRef = doc(db, EXAMS_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const examData = { id: docSnap.id, ...docSnap.data() } as Exam;
                // Fetch entries for this exam
                const entries = await marksService.getMarksByExam(id);
                return { ...examData, entries };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting exam:", error);
            throw error;
        }
    },

    getExams: async () => {
        try {
            const q = query(collection(db, EXAMS_COLLECTION), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Exam[];
        } catch (error) {
            console.error("Error getting exams:", error);
            throw error;
        }
    },

    getExamsByGrade: async (grade: string) => {
        try {
            const q = query(
                collection(db, EXAMS_COLLECTION),
                where("grade", "==", grade),
                orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Exam[];
        } catch (error) {
            console.error("Error getting exams by grade:", error);
            throw error;
        }
    },

    // Marks CRUD
    saveMarks: async (entries: Omit<MarksEntry, "id">[]) => {
        try {
            const batch = writeBatch(db);
            entries.forEach(entry => {
                // Ensure examId is present or handle gracefully
                if (!entry.examId) {
                    return;
                }
                const docId = `${entry.examId}_${entry.studentId}_${entry.subject}`;
                const docRef = doc(db, MARKS_COLLECTION, docId);
                batch.set(docRef, {
                    ...entry,
                    createdAt: Timestamp.now(),
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error saving marks:", error);
            throw error;
        }
    },

    updateExamEntries: async (examId: string, entries: MarksEntry[]) => {
        try {
            // Inject examId into entries
            const enrichedEntries = entries.map(e => ({
                ...e,
                examId: examId
            }));
            await marksService.saveMarks(enrichedEntries);
        } catch (error) {
            console.error("Error updating exam entries:", error);
            throw error;
        }
    },

    getMarksByExam: async (examId: string) => {
        try {
            const q = query(
                collection(db, MARKS_COLLECTION),
                where("examId", "==", examId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as MarksEntry[];
        } catch (error) {
            console.error("Error getting marks by exam:", error);
            throw error;
        }
    },

    getMarksByStudent: async (studentId: string) => {
        try {
            const q = query(
                collection(db, MARKS_COLLECTION),
                where("studentId", "==", studentId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as MarksEntry[];
        } catch (error) {
            console.error("Error getting marks by student:", error);
            throw error;
        }
    },

    // Analytics helpers
    calculatePercentage: (obtained: number, max: number) => {
        if (max === 0) return 0;
        return Math.round((obtained / max) * 100);
    },

    getGrade: (percentage: number) => {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 35) return "D";
        return "F";
    },

    // Alias for getGrade
    calculateGrade: (percentage: number) => {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 35) return "D";
        return "F";
    },

    getPassStatus: (percentage: number, passingPercentage = 35) => {
        return percentage >= passingPercentage ? "Pass" : "Fail";
    }
};
