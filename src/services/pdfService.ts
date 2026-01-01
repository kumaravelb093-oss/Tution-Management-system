import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Payment } from "./feeService";

export const pdfService = {
    generateReceipt: (payment: Payment) => {
        const doc = new jsPDF();

        // 1. Header - Diamond Tuitions Branding
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(32, 33, 36); // Google #202124
        doc.text("DIAMOND TUITIONS", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(95, 99, 104); // Google #5F6368
        doc.text("Academic Excellence & Professional Coaching", 105, 26, { align: "center" });
        doc.text("123, Excellence Street, Knowledge City, Chennai - 600001", 105, 32, { align: "center" });
        doc.text("Phone: +91 98765 43210 | Email: admin@diamond.edu", 105, 37, { align: "center" });

        doc.setDrawColor(218, 220, 224); // Google #DADCE0
        doc.setLineWidth(0.5);
        doc.line(20, 42, 190, 42);

        // 2. Receipt Info
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(66, 133, 244); // Google Blue #4285F4
        doc.text("FEE RECEIPT", 105, 55, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(32, 33, 36);

        const leftX = 20;
        const rightX = 140;
        const startY = 70;
        const gap = 8;

        doc.text(`Receipt No: ${payment.receiptNumber || "N/A"}`, leftX, startY);
        doc.text(`Date: ${payment.paymentDate}`, rightX, startY);

        doc.setFont("helvetica", "bold");
        doc.text(`Student Name: ${payment.studentName}`, leftX, startY + gap);
        doc.setFont("helvetica", "normal");

        doc.text(`Class/Grade: ${payment.grade}`, rightX, startY + gap);

        // 3. Table
        const tableStartY = startY + (gap * 3);

        autoTable(doc, {
            startY: tableStartY,
            head: [['Description', 'Month/Year', 'Amount (INR)']],
            body: [
                ['Tuition Fee', `${payment.feeMonth} ${payment.feeYear}`, `Rs. ${payment.amount.toLocaleString()}`],
            ],
            foot: [['Total Paid', '', `Rs. ${payment.amount.toLocaleString()}`]],
            theme: 'grid',
            headStyles: {
                fillColor: [248, 249, 250], // Light Grey
                textColor: [32, 33, 36], // Dark Text
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [218, 220, 224]
            },
            bodyStyles: {
                textColor: [32, 33, 36],
                lineWidth: 0.1,
                lineColor: [218, 220, 224]
            },
            footStyles: {
                fillColor: [255, 255, 255],
                textColor: [66, 133, 244], // Blue Total
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [218, 220, 224]
            },
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 5,
            }
        });

        // 4. Footer / Signature
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 40;

        doc.setFontSize(10);
        doc.setTextColor(32, 33, 36);
        doc.text("Authorized Signature", 160, finalY, { align: "center" });
        doc.setDrawColor(32, 33, 36);
        doc.line(140, finalY - 5, 180, finalY - 5);

        doc.setFontSize(8);
        doc.setTextColor(154, 160, 166); // #9AA0A6
        doc.text("Diamond Tuitions - Computer Generated Receipt", 105, 280, { align: "center" });

        // Save
        doc.save(`Receipt_${payment.receiptNumber}.pdf`);
    }
};
