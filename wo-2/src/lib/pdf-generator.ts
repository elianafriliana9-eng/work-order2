import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { SuratSerahTerima } from '../types/assets';
import { formatDateIndonesian } from './surat-number';

const TINTA = '#1A1A1A';
const BORDER_COLOR = '#333333';

export function formatRupiah(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
        return '-';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function parseImageBuffer(dataUriOrBase64?: string | null): Buffer | null {
    if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') return null;
    const trimmed = dataUriOrBase64.trim();
    if (!trimmed) return null;

    try {
        if (trimmed.startsWith('data:')) {
            const base64Data = trimmed.split(',')[1];
            if (base64Data) {
                return Buffer.from(base64Data, 'base64');
            }
        } else if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
            return Buffer.from(trimmed, 'base64');
        }
    } catch {
        return null;
    }
    return null;
}

export interface GeneratePdfOptions {
    verificationBaseUrl?: string;
    city?: string;
}

/**
 * Generates an official 1-page PDF document for PT SRT Surat Serah Terima
 * conforming strictly to the company visual layout.
 */
export async function generateSuratPdf(
    surat: SuratSerahTerima,
    options: GeneratePdfOptions = {}
): Promise<Buffer> {
    const {
        verificationBaseUrl = 'https://digitalteamsrt.com/surat/verify',
        city = 'Jakarta',
    } = options;

    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                autoFirstPage: true,
                info: {
                    Title: `Surat Serah Terima - ${surat.document_number}`,
                    Author: 'PT SRT Digital Team',
                    Subject: 'Dokumen Resmi Surat Serah Terima Aset',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            const L = 42; // left margin
            const W = doc.page.width - L * 2; // content width: ~511 pt

            // 1. JUDUL RESMI PT SRT
            doc.fillColor(TINTA)
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('SURAT SERAH TERIMA', L, 36, {
                    width: W,
                    align: 'center',
                    characterSpacing: 2.2,
                });

            // Garis pembatas horizontal tunggal tegas
            doc.lineWidth(1.5)
                .strokeColor(TINTA)
                .moveTo(L, 62)
                .lineTo(L + W, 62)
                .stroke();

            // 2. Baris Nomor (kiri) & Tanggal (kanan)
            let y = 74;
            const docDate = surat.document_date ? new Date(surat.document_date) : new Date();
            const tanggalFormatted = formatDateIndonesian(docDate);

            doc.fillColor(TINTA).font('Helvetica').fontSize(9.5);
            doc.text(`Nomor     : ${surat.document_number}`, L, y, { width: 280 });
            doc.text(`${city}, ${tanggalFormatted}`, L + W - 220, y, { width: 220, align: 'right' });
            y += 20;

            doc.text('Telah diterima dari :', L, y, { width: W });
            y += 14;

            // 3. TABEL IDENTITAS (2 Kolom: Field Name, Nilai)
            const identitasRows: [string, string][] = [
                ['Nama yang Menyerahkan', surat.giver_name || '-'],
                ['Departemen Penyerah', surat.giver_department || '-'],
                ['Nama yang Menerima', surat.receiver_name || '-'],
                ['Departemen Penerima', surat.receiver_department || '-'],
            ];

            const colW1 = 150;
            const colW2 = W - colW1;
            const idRowH = 18;

            doc.lineWidth(0.7).strokeColor(BORDER_COLOR);
            for (const [label, val] of identitasRows) {
                doc.rect(L, y, colW1, idRowH).stroke();
                doc.rect(L + colW1, y, colW2, idRowH).stroke();

                doc.font('Helvetica-Bold').fontSize(9).text(label, L + 6, y + 4.5, { width: colW1 - 12 });
                doc.font('Helvetica').fontSize(9).text(val, L + colW1 + 6, y + 4.5, { width: colW2 - 12 });
                y += idRowH;
            }
            y += 8;

            // 4. KOTAK KETERANGAN
            const notesText = surat.notes && surat.notes.trim() ? surat.notes.trim() : '-';
            const notesPad = 8;
            const notesTitleH = 12;
            const notesBoxH = 38;

            doc.rect(L, y, W, notesBoxH).strokeColor(BORDER_COLOR).stroke();
            doc.font('Helvetica-Bold').fontSize(9).text('Keterangan', L + notesPad, y + 6);
            doc.font('Helvetica').fontSize(8.5).text(notesText, L + notesPad, y + 6 + notesTitleH, {
                width: W - notesPad * 2,
                height: notesBoxH - notesTitleH - 10,
                ellipsis: true,
            });
            y += notesBoxH + 8;

            // 5. KOTAK & TABEL ASET
            const items = surat.items || [];
            const assetHeaderH = 16;
            const assetRowH = 18;
            const assetTableH = 18 + assetHeaderH + Math.max(items.length, 1) * assetRowH;

            doc.rect(L, y, W, assetTableH).strokeColor(BORDER_COLOR).stroke();
            doc.font('Helvetica-Bold').fontSize(9.5).text('Aset', L + 8, y + 5);

            const tyAsset = y + 18;
            const cw = [80, 200, 110, W - (80 + 200 + 110)]; // col widths: Kode, Nama, Nilai, Kondisi
            const assetHeaders = ['Kode', 'Nama Aset', 'Nilai', 'Kondisi'];

            // Header Tabel Aset
            let curX = L + 8;
            doc.font('Helvetica-Bold').fontSize(8.5);
            assetHeaders.forEach((th, idx) => {
                const wCol = cw[idx] - (idx === 0 || idx === 3 ? 8 : 4);
                doc.rect(curX, tyAsset, wCol, assetHeaderH).strokeColor(BORDER_COLOR).stroke();
                doc.text(th, curX + 4, tyAsset + 4, { width: wCol - 8 });
                curX += wCol;
            });

            // Baris Data Aset
            let rowY = tyAsset + assetHeaderH;
            if (items.length === 0) {
                doc.font('Helvetica-Oblique').fontSize(8.5);
                doc.text('Tidak ada rincian aset terlampir', L + 16, rowY + 4, { width: W - 32 });
                rowY += assetRowH;
            } else {
                doc.font('Helvetica').fontSize(8);
                for (const it of items) {
                    curX = L + 8;
                    const rowVals = [
                        it.asset_code || '-',
                        it.asset_name || '-',
                        formatRupiah(it.asset_value),
                        it.handover_condition || 'Baik',
                    ];
                    rowVals.forEach((val, idx) => {
                        const wCol = cw[idx] - (idx === 0 || idx === 3 ? 8 : 4);
                        doc.rect(curX, rowY, wCol, assetRowH).strokeColor(BORDER_COLOR).stroke();
                        doc.text(val, curX + 4, rowY + 4.5, {
                            width: wCol - 8,
                            ellipsis: true,
                        });
                        curX += wCol;
                    });
                    rowY += assetRowH;
                }
            }
            y += assetTableH + 8;

            // 6. PERNYATAAN RESMI
            const isHandover = surat.document_type === 'handover';
            const kataKunci = isHandover ? 'TELAH DISERAHKAN' : 'TELAH DIKEMBALIKAN';
            doc.fillColor(TINTA).font('Helvetica').fontSize(8.5);
            doc.text(
                'Demikian surat serah terima ini dibuat dan ditandatangani oleh kedua belah pihak sebagai bukti bahwa barang/aset tersebut di atas ',
                L,
                y,
                { width: W, continued: true }
            );
            doc.font('Helvetica-Bold').text(kataKunci, { continued: true });
            doc.font('Helvetica').text(' dalam keadaan baik dan lengkap untuk dipergunakan sebagaimana mestinya.');
            y = doc.y + 8;

            // 7. KOTAK KATEGORI (Checkbox)
            const catBoxH = 26;
            doc.rect(L, y, W, catBoxH).strokeColor(BORDER_COLOR).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).text('Kategori', L + 8, y + 7, { width: 60 });

            // Checkbox Penyerahan
            const checkY = y + 7;
            const cbSize = 10;
            const cb1X = L + 80;
            doc.rect(cb1X, checkY, cbSize, cbSize).strokeColor(BORDER_COLOR).stroke();
            if (isHandover) {
                doc.moveTo(cb1X + 2, checkY + 2).lineTo(cb1X + cbSize - 2, checkY + cbSize - 2).stroke();
                doc.moveTo(cb1X + cbSize - 2, checkY + 2).lineTo(cb1X + 2, checkY + cbSize - 2).stroke();
            }
            doc.font('Helvetica').fontSize(8.5).text('Penyerahan', cb1X + cbSize + 6, checkY + 1);

            // Checkbox Pengembalian
            const cb2X = L + 200;
            doc.rect(cb2X, checkY, cbSize, cbSize).strokeColor(BORDER_COLOR).stroke();
            if (!isHandover) {
                doc.moveTo(cb2X + 2, checkY + 2).lineTo(cb2X + cbSize - 2, checkY + cbSize - 2).stroke();
                doc.moveTo(cb2X + cbSize - 2, checkY + 2).lineTo(cb2X + 2, checkY + cbSize - 2).stroke();
            }
            doc.font('Helvetica').fontSize(8.5).text('Pengembalian', cb2X + cbSize + 6, checkY + 1);
            y += catBoxH + 16;

            // 8. TANDA TANGAN 3 KOLOM DENGAN GAMBAR TTD
            const colTtdW = W / 3;
            const labelsTtd = ['Yang Menyerahkan,', 'Yang Menerima,', 'HRD,'];
            const namaTtd = [
                surat.giver_name ? `(${surat.giver_name})` : '(............................)',
                surat.receiver_name ? `(${surat.receiver_name})` : '(............................)',
                surat.hrd_name ? `(${surat.hrd_name})` : '(............................)',
            ];

            const ttdBuffers = [
                parseImageBuffer(surat.giver_signature_path),
                parseImageBuffer(surat.receiver_signature_path),
                parseImageBuffer(surat.hrd_signature_path),
            ];

            const yGarisTtd = y + 62;

            // Gambar Header Label & Garis
            labelsTtd.forEach((label, i) => {
                doc.font('Helvetica').fontSize(9).fillColor(TINTA).text(label, L + i * colTtdW, y, {
                    width: colTtdW,
                    align: 'center',
                });

                const cx = L + i * colTtdW + colTtdW / 2;
                doc.lineWidth(0.8)
                    .strokeColor(BORDER_COLOR)
                    .moveTo(cx - 50, yGarisTtd)
                    .lineTo(cx + 50, yGarisTtd)
                    .stroke();

                // Tanda tangan image jika ada
                const buf = ttdBuffers[i];
                if (buf) {
                    try {
                        const imgW = 75;
                        const imgH = 28;
                        doc.image(buf, cx - imgW / 2, yGarisTtd - imgH - 2, {
                            width: imgW,
                            height: imgH,
                            fit: [imgW, imgH],
                            align: 'center',
                            valign: 'bottom',
                        });
                    } catch {
                        // Jika format image rusak, abaikan gambar
                    }
                }

                // Nama Penandatangan
                doc.font('Helvetica-Bold').fontSize(8.5).text(namaTtd[i], L + i * colTtdW, yGarisTtd + 6, {
                    width: colTtdW,
                    align: 'center',
                });
            });

            // 9. QR CODE VERIFIKASI DOKUMEN (Sudut kanan/kiri bawah)
            const verifyPayload = `${verificationBaseUrl}/${surat.id}?no=${encodeURIComponent(surat.document_number)}`;
            try {
                const qrBuffer = await QRCode.toBuffer(verifyPayload, {
                    width: 64,
                    margin: 1,
                    color: {
                        dark: '#1A1A1AFF',
                        light: '#FFFFFFFF',
                    },
                });

                const qrSize = 44;
                const qrX = L + W - qrSize;
                const qrY = doc.page.height - 70;

                doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
                doc.font('Helvetica').fontSize(6.5).fillColor('#666666');
                doc.text('Pindai QR untuk verifikasi keaslian dokumen resmi PT SRT', L, qrY + 28, {
                    width: W - qrSize - 10,
                    align: 'left',
                });
            } catch {
                // QR code generation failed, skip silently
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
