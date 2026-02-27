"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Layout,
  Code2,
  Database,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BounceCards from "@/components/BounceCards";

export default function LandingPage() {
  const [showcases, setShowcases] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    activeTickets: "0",
    avgCompletion: "0 Hari",
    highestPriority: "P2 (Standar)",
  });

  useEffect(() => {
    async function loadData() {
      // Load Showcases
      const { data: showcaseData } = await supabase
        .from('showcase_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      if (showcaseData) setShowcases(showcaseData);

      // Load Stats
      const { data: woData } = await supabase
        .from('work_orders')
        .select('id, status, priority, created_at, updated_at');

      if (woData) {
        const activeCount = woData.filter(d => d.status !== 'Completed' && d.status !== 'Rejected').length;

        // Calculate average completion time
        const completed = woData.filter(d => d.status === 'Completed');
        let avgDays = "0";
        if (completed.length > 0) {
          const totalMs = completed.reduce((acc, curr) => {
            const end = new Date(curr.updated_at).getTime();
            const start = new Date(curr.created_at).getTime();
            return acc + (end - start);
          }, 0);
          const avgMs = totalMs / completed.length;
          avgDays = (avgMs / (1000 * 60 * 60 * 24)).toFixed(1);
        }

        // Determine highest priority
        const hasP1 = woData.some(d => d.status !== 'Completed' && d.priority === 'P1');
        const priorityStr = hasP1 ? "P1 (Urgent)" : "P2 (Standar)";

        setStatsData({
          activeTickets: activeCount.toString(),
          avgCompletion: `${avgDays} Hari`,
          highestPriority: priorityStr
        });
      }
    }
    loadData();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stats = [
    { label: "Active Tickets", value: statsData.activeTickets, icon: ClipboardList, color: "text-blue-500" },
    { label: "Avg. Completion", value: statsData.avgCompletion, icon: Clock, color: "text-green-500" },
    { label: "Current Priority", value: statsData.highestPriority, icon: AlertCircle, color: "text-red-500" },
  ];

  const workflow = [
    { title: "Input Ticket", desc: "Pemohon mengisi form WO di sistem.", icon: ClipboardList },
    { title: "Triaging", desc: "Verifikasi brief oleh Head of IT.", icon: ShieldCheck },
    { title: "Execution", desc: "Pengerjaan oleh tim Programmer/Designer.", icon: Code2 },
    { title: "Review", desc: "Pengecekan hasil oleh pemohon.", icon: CheckCircle2 },
  ];

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Error logging in with Google:", error.message);
      alert("Failed to login with Google. Please check your Supabase configuration.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <Layout size={20} />
            </div>
            <span>WorkOrder <span className="text-muted-foreground font-normal">System</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#sop" className="hover:text-primary transition-colors">SOP</Link>
            <Link href="#showcase" className="hover:text-primary transition-colors">Showcase</Link>
            <Link href="#workflow" className="hover:text-primary transition-colors">Workflow</Link>
            <Link
              href="/login"
              className="px-5 py-2 bg-white text-black border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <motion.div {...fadeIn}>
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-secondary text-secondary-foreground border border-border">
              IT & Creative Service Management
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Single Entry Point for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                Your Work Orders
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
              Membangun sistem satu pintu untuk mengelola permintaan IT Development,
              Creative Design, & Asset Management secara transparan dan terukur.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group flex items-center gap-3 px-8 py-4 bg-white text-black border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-md hover:shadow-lg"
              >
                Masuk ke Sistem
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#sop" className="px-8 py-4 bg-secondary text-secondary-foreground border border-border rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                Pelajari SOP
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Counters */}
        <div className="container mx-auto px-6 mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`p-3 w-fit rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-4 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOP Section - No Ticket No Work */}
      <section id="sop" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Standar Operasional: <br />
                <span className="text-red-500 italic uppercase">"No Ticket, No Work"</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-justify">
                Seluruh permintaan pekerjaan WAJIB diinput melalui sistem. Tim IT & Kreatif berhak
                menunda pengerjaan jika tiket belum dibuat untuk menghindari instruksi yang terlewat
                dan tumpang tindih prioritas.
              </p>
              <ul className="space-y-4">
                {[
                  "Instruksi lisan/WA hanya bersifat diskusi.",
                  "Waktu pengerjaan dihitung sejak tiket diterbitkan.",
                  "Revisi tercatat dalam history tiket yang sama.",
                  "Auto-closing setelah 1x24 jam tanpa feedback."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 size={18} className="text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 w-full grid grid-cols-1 gap-4">
              <div className="p-8 rounded-2xl bg-primary text-primary-foreground relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 scale-150 opacity-10 group-hover:scale-175 transition-transform">
                  <AlertCircle size={100} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">Urgent Policy (P1)</h3>
                  <p className="opacity-90 leading-relaxed mb-6">
                    Masalah teknis yang menghentikan operasional (system down) atau kebutuhan langsung Owner akan diprioritaskan segera.
                  </p>
                  <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                    <span className="text-sm font-bold uppercase tracking-widest">Priority level: High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">Showcase Karya Kreatif</h2>
              <p className="text-lg text-muted-foreground">
                Hasil pengerjaan tim Creative Design untuk berbagai brand dan kebutuhan media.
              </p>
            </div>
            <Link href="/login" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all z-10 relative">
              Mulai Project Baru <ArrowRight size={20} />
            </Link>
          </div>

          <div className="flex justify-center items-center w-full min-h-[500px]">
            {showcases.length > 0 ? (
              <BounceCards
                className="custom-bounceCards scale-y-110 sm:scale-100"
                images={showcases.slice(0, 5).map(s => s.img_url)}
                containerWidth="100%"
                containerHeight={400}
                animationDelay={0.5}
                animationStagger={0.08}
                easeType="elastic.out(1, 0.5)"
                transformStyles={[
                  "rotate(5deg) translate(-200px)",
                  "rotate(0deg) translate(-100px)",
                  "rotate(-5deg)",
                  "rotate(5deg) translate(100px)",
                  "rotate(-5deg) translate(200px)"
                ]}
                enableHover={true}
              />
            ) : (
              <div className="text-center p-10 border-2 border-dashed border-border rounded-3xl w-full max-w-xl">
                <p className="text-muted-foreground">Belum ada karya showcase yang diunggah.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">Alur Kerja Sistem Satu Pintu</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {workflow.map((step, i) => (
              <div key={i} className="relative">
                <div className="p-6 rounded-2xl border border-border flex flex-col items-center text-center hover:border-primary transition-colors group">
                  <div className="p-4 rounded-full bg-secondary text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <step.icon size={28} />
                  </div>
                  <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 -right-4 translate-x-1/2 text-muted-foreground">
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold opacity-80">
            <Layout size={18} />
            <span>WorkOrder2026</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 IT & Creative Division. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
