export interface Holiday {
    id: string;
    date: string;
    name: string;
    description?: string;
    year: number;
    source: string;
}

export interface HolidayAPIResponse {
    status: string;
    code: number;
    data: { date: string; description: string }[];
    message: string;
}

const WEEKEND_DAYS = [0, 6];

export function getYearRange(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
}

export function getHolidayDates(holidays: Holiday[]): Set<string> {
    return new Set(holidays.map(h => h.date));
}

export function isWeekend(date: Date): boolean {
    return WEEKEND_DAYS.includes(date.getDay());
}

export function isWorkingDay(date: Date, holidayDates: Set<string>): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return !isWeekend(date) && !holidayDates.has(dateStr);
}

export function addWorkingDays(from: Date, n: number, holidayDates: Set<string>): Date {
    const result = new Date(from);
    result.setHours(0, 0, 0, 0);
    let added = 0;
    while (added < n) {
        result.setDate(result.getDate() + 1);
        if (isWorkingDay(result, holidayDates)) {
            added++;
        }
    }
    return result;
}

export function countWorkingDays(from: Date, to: Date, holidayDates: Set<string>): number {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    if (start >= end) return 0;

    let count = 0;
    const current = new Date(start);
    while (current < end) {
        current.setDate(current.getDate() + 1);
        if (isWorkingDay(current, holidayDates)) {
            count++;
        }
    }
    return count;
}

export function getDefaultDeadline(holidayDates: Set<string>): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isWorkingDay(today, holidayDates)) {
        const nextWorkingDay = new Date(today);
        nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
        if (isWorkingDay(nextWorkingDay, holidayDates)) {
            return addWorkingDays(today, 3, holidayDates);
        }
    }

    const next = getNextWorkingDay(today, holidayDates);
    return addWorkingDays(next, 3, holidayDates);
}

export function getNextWorkingDay(date: Date, holidayDates: Set<string>): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + 1);
    while (!isWorkingDay(result, holidayDates)) {
        result.setDate(result.getDate() + 1);
    }
    return result;
}

export function isDateAllowed(date: Date, holidayDates: Set<string>): { allowed: boolean; reason?: string } {
    const dateStr = date.toISOString().split('T')[0];
    if (isWeekend(date)) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        return { allowed: false, reason: `${days[date.getDay()]} adalah hari libur akhir pekan` };
    }
    if (holidayDates.has(dateStr)) {
        return { allowed: false, reason: `${dateStr} adalah hari libur nasional` };
    }
    return { allowed: true };
}
