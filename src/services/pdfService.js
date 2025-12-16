import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateVehicleReport = (vehicle, maintenanceHistory) => {
    const doc = new jsPDF();

    // -- COLORS --
    const primaryColor = [79, 70, 229]; // Indigo 600
    const secondaryColor = [100, 116, 139]; // Slate 500

    // -- HEADER --
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("OterCar", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text("Reporte de Hoja de Vida Vehicular", 14, 26);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 31);

    // -- VEHICLE INFO GRID --
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})`, 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    // Column 1
    doc.text(`Placa: ${vehicle.placa}`, 14, 56);
    doc.text(`Color: ${vehicle.color}`, 14, 62);

    // Column 2
    doc.text(`Kilometraje: ${vehicle.kilometraje?.toLocaleString()} km`, 80, 56);
    doc.text(`VIN: ${vehicle.vin || 'N/A'}`, 80, 62);

    // -- MAINTENANCE TABLE --
    const tableColumn = ["Fecha", "Tipo", "Descripción", "Km", "Costo"];
    const tableRows = [];

    maintenanceHistory.forEach(record => {
        const rowData = [
            new Date(record.fecha).toLocaleDateString(),
            record.tipo,
            record.descripcion,
            record.kilometraje ? record.kilometraje.toLocaleString() + ' km' : '-',
            record.costo_total ? `$${record.costo_total}` : '-'
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 'auto' }, // Description gets auto width
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
        }
    });

    // -- TOTALS --
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalCost = maintenanceHistory.reduce((sum, m) => sum + (parseFloat(m.costo_total) || 0), 0);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Invertido en Mantenimientos: $${totalCost.toLocaleString()}`, 14, finalY);

    // -- FOOTER --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        doc.text("Este documento es un reporte generado automáticamente por OterCar Software.", 105, 285, { align: 'center' });
    }

    doc.save(`Hoja_Vida_${vehicle.placa}.pdf`);
};
