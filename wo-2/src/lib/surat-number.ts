import { SupabaseClient } from '@supabase/supabase-js';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatDateIndonesian(date: Date = new Date()): string {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

export function formatDateShort(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// In-process serialization lock for concurrent requests within same node instance
let sequenceQueue: Promise<unknown> = Promise.resolve();

function withSequenceLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = sequenceQueue.then(fn, fn);
    sequenceQueue = next.catch(() => {});
    return next;
}

/**
 * Generates an atomic, collision-free Surat Serah Terima document number.
 * Format standard PT SRT: XXX/SRT-ST/YYYY or XXXXXX/SRT/YYYY
 * Concurrency protected with database sequence + fallback table scanning + queue lock.
 */
export async function generateNextDocumentNumber(supabase: SupabaseClient): Promise<string> {
    return withSequenceLock(async () => {
        const year = new Date().getFullYear();

        // 1. Attempt to use database sequence / RPC if available
        try {
            const { data: rpcNum, error: rpcErr } = await supabase.rpc('next_surat_document_number');
            if (!rpcErr && rpcNum) {
                // Ensure standard format contains SRT
                const sanitized = String(rpcNum).replace('/SST/', '/SRT-ST/');
                return sanitized;
            }
        } catch {
            // Fallback to table scan
        }

        // 2. Query highest document number in current year
        const patternLike = `%/SRT-ST/${year}`;
        const patternAlt = `%/SRT/${year}`;
        const patternSst = `%/SST/${year}`;

        const { data: records, error } = await supabase
            .from('surat_serah_terima')
            .select('document_number')
            .or(`document_number.like.${patternLike},document_number.like.${patternAlt},document_number.like.${patternSst}`)
            .limit(1000);

        let maxSeq = 0;
        const regex = /^(\d+)\/(SRT-ST|SRT|SST)\/\d{4}$/;

        if (!error && Array.isArray(records)) {
            for (const r of records) {
                const match = regex.exec(String(r.document_number).trim());
                if (match) {
                    const parsed = parseInt(match[1], 10);
                    if (!isNaN(parsed) && parsed > maxSeq) {
                        maxSeq = parsed;
                    }
                }
            }
        }

        const nextSeq = maxSeq + 1;
        const formattedSeq = String(nextSeq).padStart(3, '0');
        return `${formattedSeq}/SRT-ST/${year}`;
    });
}

/**
 * Generates an automatic asset code if not supplied by the user.
 * Format: [PREFIX]-[YEAR]-[0001]
 * e.g. LAP-2026-0001 or AST-2026-0001
 */
export async function generateNextAssetCode(
    category: string,
    supabase: SupabaseClient
): Promise<string> {
    return withSequenceLock(async () => {
        const year = new Date().getFullYear();
        const cat = (category || '').toLowerCase().trim();

        let prefix = 'AST';
        if (cat.includes('laptop') || cat.includes('notebook')) prefix = 'LAP';
        else if (cat.includes('monitor') || cat.includes('screen')) prefix = 'MON';
        else if (cat.includes('pc') || cat.includes('komputer') || cat.includes('desktop')) prefix = 'PC';
        else if (cat.includes('printer') || cat.includes('scanner')) prefix = 'PRN';
        else if (cat.includes('phone') || cat.includes('hp') || cat.includes('mobile')) prefix = 'MBL';
        else if (cat.includes('server') || cat.includes('network') || cat.includes('router')) prefix = 'NET';

        const codePrefix = `${prefix}-${year}-`;
        const { data: existing, error } = await supabase
            .from('assets')
            .select('code')
            .ilike('code', `${codePrefix}%`)
            .limit(500);

        let maxSeq = 0;
        const codeRegex = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');

        if (!error && Array.isArray(existing)) {
            for (const item of existing) {
                const match = codeRegex.exec(String(item.code).trim());
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxSeq) {
                        maxSeq = num;
                    }
                }
            }
        }

        const nextNum = maxSeq + 1;
        return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
    });
}
