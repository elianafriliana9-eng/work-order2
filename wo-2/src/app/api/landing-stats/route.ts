import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server configuration missing' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: woData, error } = await supabase
    .from('work_orders')
    .select('status, priority, created_at, deadline');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }

  // Active tickets count
  const activeCount = woData.filter(
    (d) => d.status !== 'Completed' && d.status !== 'Rejected'
  ).length;

  // Average completion days
  const completed = woData.filter((d) => d.status === 'Completed');
  let avgDays = '0';
  if (completed.length > 0) {
    const totalMs = completed.reduce((acc, curr) => {
      const end = new Date(curr.deadline || curr.created_at).getTime();
      const start = new Date(curr.created_at).getTime();
      return acc + (end - start);
    }, 0);
    avgDays = (totalMs / completed.length / (1000 * 60 * 60 * 24)).toFixed(1);
  }

  // Highest priority check
  const hasP1 = woData.some(
    (d) => d.status !== 'Completed' && d.priority === 'P1'
  );

  // Weekly chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      total: 0,
    };
  });

  woData.forEach((wo) => {
    const woDate = new Date(wo.created_at).toISOString().split('T')[0];
    const found = chartData.find((d) => d.date === woDate);
    if (found) found.total += 1;
  });

  return NextResponse.json({
    stats: {
      activeTickets: activeCount.toString(),
      avgCompletion: `${avgDays} Hari`,
      highestPriority: hasP1 ? 'P1 (Urgent)' : 'P2 (Standar)',
    },
    chartData,
  });
}
