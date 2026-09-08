import ExcelJS from 'exceljs';
import { SuratSerahTerima } from '../types/assets';
import { formatDateIndonesian, formatDateShort } from './surat-number';

export const EXCEL_COLUMNS = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nomor Surat', key: 'nomor', width: 22 },
    { header: 'Tanggal', key: 'tanggal', width: 18 },
    { header: 'Tanggal Singkat', key: 'tanggalSingkat', width: 14 },
    { header: 'Kategori', key: 'kategori', width: 16 },
    { header: 'Nama Penyerah', key: 'namaPenyerah', width: 24 },
    { header: 'Dept. Penyerah', key: 'deptPenyerah', width: 18 },
    { header: 'Nama Penerima', key: 'namaPenerima', width: 24 },
    { header: 'Dept. Penerima', key: 'deptPenerima', width: 18 },
    { header: 'Keterangan', key: 'keterangan', width: 36 },
    { header: 'Nama HRD', key: 'namaHrd', width: 20 },
    { header: 'Aset', key: 'aset', width: 42 },
];

const BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
};

const HEADER_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' },
};

const STRIPE_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F7FB' },
};

/**
 * Generates an Excel (.xlsx) workbook buffer containing the Surat Serah Terima history
 * conforming to PT SRT reporting standards.
 */
export async function generateSuratExcel(suratList: SuratSerahTerima[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PT SRT Digital Team';
    wb.created = new Date();

    const ws = wb.addWorksheet('Riwayat', {
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = EXCEL_COLUMNS.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width,
    }));

    // Header styling
    const headerRow = ws.getRow(1);
    headerRow.height = 24;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    headerRow.fill = HEADER_FILL;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.eachCell(cell => {
        cell.border = BORDER;
    });

    // Populate data
    suratList.forEach((s, idx) => {
        const rowNum = idx + 1;
        const docDate = s.document_date ? new Date(s.document_date) : new Date();
        const tgl = formatDateIndonesian(docDate);
        const tglSingkat = formatDateShort(docDate);
        const kat = s.document_type === 'handover' ? 'Penyerahan' : 'Pengembalian';

        const assetText = Array.isArray(s.items) && s.items.length > 0
            ? s.items.map(item => `${item.asset_code || ''} - ${item.asset_name || ''}`).filter(Boolean).join('; ')
            : '-';

        const row = ws.addRow([
            rowNum,
            s.document_number,
            tgl,
            tglSingkat,
            kat,
            s.giver_name || '-',
            s.giver_department || '-',
            s.receiver_name || '-',
            s.receiver_department || '-',
            s.notes || '-',
            s.hrd_name || '-',
            assetText,
        ]);

        row.height = 26;
        row.font = { size: 9.5, name: 'Calibri' };

        const isEven = rowNum % 2 === 0;
        row.eachCell((cell, colIndex) => {
            cell.border = BORDER;
            if (isEven) {
                cell.fill = STRIPE_FILL;
            }

            // Centers for No, Nomor, Tanggal, Tanggal Singkat, Kategori
            if (colIndex <= 5) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colIndex === 10 || colIndex === 12) {
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    });

    // Enable AutoFilter
    const totalRows = ws.rowCount;
    if (totalRows > 1) {
        ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: totalRows, column: EXCEL_COLUMNS.length },
        };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
