"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Layout,
  Code2,
  ShieldCheck,
  TrendingUp,
  Zap,
  PenTool,
  Palette,
  Monitor,
  Headphones,
  Download,
  MessageSquare,
  History,
  MousePointerClick,
  X
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BounceCards from "@/components/BounceCards";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function LandingPage() {
  const [showcases, setShowcases] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    activeTickets: "0",
    avgCompletion: "0 Hari",
    highestPriority: "P2 (Standar)",
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function loadData() {
      try {
        // Load Showcases (public table, accessible via anon key)
        const { data: showcaseData } = await supabase
          .from('showcase_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (showcaseData && showcaseData.length > 0) {
          setShowcases(showcaseData);
        }

        // Fetch stats from server-side API (bypasses RLS)
        const res = await fetch('/api/landing-stats');
        if (res.ok) {
          const data = await res.json();
          setStatsData(data.stats);
          setChartData(data.chartData);
        }
      } catch (err) {
        console.error("Landing data load error:", err);
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

  const sopPoints = [
    { title: "Discussion Policy", desc: "Instruksi lisan/WA hanya bersifat diskusi, bukan perintah kerja.", icon: MessageSquare, color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-500" },
    { title: "Clocking System", desc: "Waktu pengerjaan resmi dihitung sejak tiket diterbitkan di sistem.", icon: Clock, color: "from-[#00B7FD]/20 to-[#00B7FD]/5", iconColor: "text-[#00B7FD]" },
    { title: "Traceable Revisions", desc: "Seluruh riwayat revisi wajib tercatat dalam history tiket yang sama.", icon: History, color: "from-indigo-500/20 to-indigo-600/5", iconColor: "text-indigo-500" },
    { title: "Auto Closing", desc: "Tiket ditutup otomatis setelah 1x24 jam tanpa feedback tambahan.", icon: MousePointerClick, color: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden text-foreground">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00B7FD]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#05599F]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="fixed top-0 z-50 w-full glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-lg sm:text-xl shrink-0">
            <div className="bg-primary text-primary-foreground p-1 rounded shadow-lg">
              <Layout size={18} />
            </div>
            <span className="whitespace-nowrap">WorkOrder <span className="text-muted-foreground font-normal italic">System</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-8">
            <Link href="/login" className="px-4 sm:px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all flex items-center gap-2 text-[10px] sm:text-xs font-bold whitespace-nowrap">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20">
        <div className="container mx-auto px-6">
          {/* Top: Division Identity */}
          <motion.div {...fadeIn} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 mb-6 sm:mb-8 text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              <Zap size={10} fill="currentColor" /> Digital Technology Division
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 sm:mb-8 leading-[1.1] sm:leading-[0.9]">
              WE BUILD <br /> <span className="relative inline-block">DIGITAL<div className="absolute bottom-1 sm:bottom-2 left-0 w-full h-2 sm:h-3 bg-[#00B7FD]/30 -z-10 rounded-full blur-sm" /></span> THINGS
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-lg md:text-xl text-muted-foreground mb-10 sm:mb-12 leading-relaxed font-medium">
              Tim di balik layar yang merancang, membangun, dan mengelola <br className="hidden md:block" />
              seluruh kebutuhan teknologi & kreatif perusahaan.
            </p>
          </motion.div>

          {/* Three Pillars of Digital Tech */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-8 max-w-5xl mx-auto"
          >
            <div className="group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden text-left hover:border-[#00B7FD]/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B7FD]/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#00B7FD]/10 w-fit mb-5 sm:mb-6">
                <Palette size={28} className="text-[#00B7FD]" />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2">Creative Design</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">
                Visual branding, marketing collateral, UI/UX design, dan seluruh kebutuhan kreatif visual.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#00B7FD]/10 text-[#00B7FD]">Branding</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#00B7FD]/10 text-[#00B7FD]">UI/UX</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#00B7FD]/10 text-[#00B7FD]">Marketing</span>
              </div>
            </div>

            <div className="group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden text-left hover:border-[#05599F]/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#05599F]/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#05599F]/10 w-fit mb-5 sm:mb-6">
                <Monitor size={28} className="text-[#05599F]" />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2">IT Development</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">
                Pengembangan sistem, aplikasi internal, web platform, dan solusi teknologi custom.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#05599F]/10 text-[#05599F]">Web App</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#05599F]/10 text-[#05599F]">System</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#05599F]/10 text-[#05599F]">Automation</span>
              </div>
            </div>

            <div className="group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden text-left hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 w-fit mb-5 sm:mb-6">
                <Headphones size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2">IT Support</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">
                Troubleshooting, manajemen aset digital, infrastruktur jaringan, dan dukungan teknis harian.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500">Helpdesk</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500">Network</span>
                <span className="px-2.5 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500">Asset</span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mt-12 sm:mt-16"
          >
            <Link href="/login" className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/25">
              Launch Work Order <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#sop" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-secondary/50 backdrop-blur-md text-secondary-foreground border border-border rounded-2xl font-bold hover:bg-secondary transition-all">
              System SOP
            </Link>
          </motion.div>
        </div>

        {/* Stats + Chart below hero */}
        <div className="container mx-auto px-4 sm:px-6 mt-20 sm:mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            <div className="lg:col-span-8 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-border bg-white dark:bg-zinc-900 shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp size={20} className="text-primary" /></div> Weekly Volume
                  </h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-2 italic">Live analytics of tickets entering the pipeline.</p>
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full relative z-10">
                {isClient && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                      <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden text-left">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-zinc-50 dark:bg-zinc-800 border ${stat.color} shrink-0`}>
                      <stat.icon size={20} className="sm:w-7 sm:h-7" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl sm:text-3xl md:text-4xl font-black tracking-tighter truncate">{stat.value}</div>
                      <div className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sop" className="py-20 sm:py-32 bg-zinc-50 dark:bg-zinc-900/5 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 uppercase italic">NO TICKET, <span className="text-red-500">NO WORK</span></h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground">Protokol operasional wajib untuk efisiensi divisi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {sopPoints.map((point, i) => (
              <div key={i} className="group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border shadow-xl overflow-hidden text-left">
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800 w-fit mb-4 sm:mb-8 ${point.iconColor}`}>
                  <point.icon size={24} />
                </div>
                <h4 className="text-sm sm:text-lg font-black mb-2 sm:mb-3 uppercase tracking-tight">{point.title}</h4>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION */}
      <section id="showcase" className="py-20 sm:py-32 overflow-hidden text-center md:text-left bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-12 sm:mb-20 mx-auto md:mx-0">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Creative Portfolio</span>
            <h2 className="text-4xl sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] sm:leading-[0.8]">DESIGN <br />SHOWCASE</h2>
            <p className="mt-6 text-muted-foreground text-sm sm:text-lg">Kumpulan karya visual terbaik dari tim Creative.</p>
          </div>
          <div className="flex justify-center items-center w-full min-h-[300px] sm:min-h-[500px] relative">
            {showcases.length > 0 ? (
              <div className="w-full flex justify-center py-10">
                <BounceCards
                  className="custom-bounceCards scale-90 sm:scale-100"
                  images={showcases.map(s => s.img_url)}
                  containerWidth="100%"
                  containerHeight={500}
                  animationDelay={0.1}
                  enableHover={true}
                  onImageClick={(src: string) => setSelectedImage(src)}
                />
              </div>
            ) : (
              <div className="w-full max-w-2xl p-20 border-2 border-dashed border-border rounded-[3rem] text-center opacity-50">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Waiting for design input...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SYSTEM PIPELINE SECTION */}
      <section id="workflow" className="py-20 sm:py-32 bg-[#031b33] text-white relative">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-16 tracking-tighter uppercase">SYSTEM PIPELINE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {workflow.map((step, i) => (
              <div key={i} className="relative group">
                <div className="flex flex-col items-center">
                  <div className="p-6 sm:p-8 rounded-[2rem] bg-white/5 border border-white/10 mb-6 group-hover:bg-primary transition-all relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#05599F] rounded-full flex items-center justify-center text-[10px] font-black text-white">0{i + 1}</div>
                    <step.icon size={32} className="text-primary group-hover:text-white" />
                  </div>
                  <h4 className="text-lg font-black mb-2 uppercase tracking-tight">{step.title}</h4>
                  <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed max-w-[150px]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 sm:py-20 border-t border-border bg-zinc-50 dark:bg-black/20 text-center">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 font-black text-2xl sm:text-3xl mb-4 text-primary">
            <Layout size={24} /> <span>WO.2026</span>
          </div>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.3em]">© 2026 SRT CORPORATION INDONESIA</p>
        </div>
      </footer>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
            <motion.button className="absolute top-8 right-8 p-3 text-white" onClick={() => setSelectedImage(null)}>
              <X size={32} />
            </motion.button>
            <motion.img src={selectedImage} alt="Full Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
