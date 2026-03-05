import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReportPDF = async (data: any) => {
    const {
        reportDate,
        avgProgress,
        reports,
        uniqueMembers,
        tickets,
        categoryCount,
        allTickets,
        memberProgress,
        roleLabels,
        summaryText,
        profiles
    } = data;

    // Create A4 portrait PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = margin;

    // --- 1. HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39); // zinc-900
    doc.text("EXECUTIVE SUMMARY", margin, currentY);

    currentY += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128); // zinc-500
    doc.text("Laporan Harian Status Pekerjaan Tim", margin, currentY);

    // Header Right Config
    const generatedAt = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    doc.setFontSize(10);
    doc.text(`Dicetak: ${generatedAt}`, pageWidth - margin - 35, margin);

    currentY += 12;
    doc.setDrawColor(229, 231, 235); // zinc-200
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // --- 2. SUMMARY CARDS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("RINGKASAN EKSEKUTIF", margin, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Quick Stats Row
    const statBoxWidth = (pageWidth - (margin * 2) - 10) / 3;
    const stats = [
        { label: "Tanggal Laporan", value: new Date(reportDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) },
        { label: "Total Tiket Aktif", value: `${tickets.length} Tiket` },
        { label: "Rata-rata Progress", value: `${avgProgress}%` }
    ];

    stats.forEach((stat, idx) => {
        const xPos = margin + (idx * (statBoxWidth + 5));
        doc.setFillColor(249, 250, 251); // zinc-50
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(xPos, currentY, statBoxWidth, 18, 2, 2, "FD");

        doc.setTextColor(107, 114, 128); // zinc-500
        doc.text(stat.label, xPos + 5, currentY + 6);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39); // zinc-900
        doc.text(stat.value, xPos + 5, currentY + 14);
        doc.setFont("helvetica", "normal");
    });

    currentY += 28;

    // Summary Text
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // zinc-600
    const splitText = doc.splitTextToSize(summaryText, pageWidth - (margin * 2));
    doc.text(splitText, margin, currentY);
    currentY += (splitText.length * 5) + 8;

    // --- 3. MEMBER PROGRESS TABLE ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("PROGRESS ANGGOTA TIM", margin, currentY);
    currentY += 6;

    const tableData = memberProgress.map((m: any) => [
        m.name,
        roleLabels[m.role] || m.role,
        m.reports.toString(),
        `${m.avg}%`
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Nama Anggota', 'Role', 'Jumlah Laporan', 'Rata-rata Progress']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [244, 244, 245], textColor: [0, 0, 0], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
        margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- 4. INDIVIDUAL REPORTS TABLE ---
    if (currentY + 40 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`DETAIL LAPORAN HARIAN (${reports.length})`, margin, currentY);
    currentY += 6;

    const reportTableData = reports.map((r: any) => [
        profiles[r.user_id]?.full_name || r.user_id.substring(0, 8),
        new Date(r.report_date).toLocaleDateString('id-ID'),
        `${r.progress_pct}%`,
        r.content || r.working_on || '-',
        r.blockers || '-'
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Anggota', 'Tanggal', 'Progress', 'Deskripsi Pekerjaan', 'Kendala (Blocker)']],
        body: reportTableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
        columnStyles: {
            3: { cellWidth: 80 }, // increase description width
            4: { cellWidth: 30 }
        },
        margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 25;

    // --- 6. SIGNATURE BLOCK ---
    if (currentY + 50 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
    }

    const signatureX = pageWidth - margin - 50;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Disetujui Oleh,`, signatureX, currentY);

    // empty lines for sign
    currentY += 25;

    doc.setFont("helvetica", "bold");
    doc.text(`El`, signatureX + 5, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`Manager`, signatureX + 5, currentY + 5);

    // Finally Save
    doc.save(`Laporan-Summary-${new Date(reportDate).toLocaleDateString('id-ID')}.pdf`);
};
