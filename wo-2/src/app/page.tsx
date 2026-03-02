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
  Database,
  ShieldCheck,
  ChevronRight,
  X,
  TrendingUp,
  Zap,
  Globe,
  PenTool,
  Download,
  MessageSquare,
  History,
  MousePointerClick
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

        // Calculate Last 7 Days Chart Data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
            total: 0
          };
        });

        woData.forEach(wo => {
          const woDate = new Date(wo.created_at).toISOString().split('T')[0];
          const found = last7Days.find(d => d.date === woDate);
          if (found) found.total += 1;
        });

        setChartData(last7Days);
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
    { 
      title: "Discussion Policy", 
      desc: "Instruksi lisan/WA hanya bersifat diskusi, bukan perintah kerja.", 
      icon: MessageSquare, 
      color: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-500" 
    },
    { 
      title: "Clocking System", 
      desc: "Waktu pengerjaan resmi dihitung sejak tiket diterbitkan di sistem.", 
      icon: Clock, 
      color: "from-[#49FFB8]/20 to-[#49FFB8]/5",
      iconColor: "text-[#49FFB8]" 
    },
    { 
      title: "Traceable Revisions", 
      desc: "Seluruh riwayat revisi wajib tercatat dalam history tiket yang sama.", 
      icon: History, 
      color: "from-indigo-500/20 to-indigo-600/5",
      iconColor: "text-indigo-500" 
    },
    { 
      title: "Auto Closing", 
      desc: "Tiket ditutup otomatis setelah 1x24 jam tanpa feedback tambahan.", 
      icon: MousePointerClick, 
      color: "from-rose-500/20 to-rose-600/5",
      iconColor: "text-rose-500" 
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden text-foreground">
      {/* --- BACKGROUND DECOR --- */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#49FFB8]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1C3ECA]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[10%] p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hidden lg:block"
        >
          <Code2 size={24} className="text-[#49FFB8]/40 mb-2" />
          <div className="space-y-1.5">
            <div className="h-1 w-12 bg-white/20 rounded-full" />
            <div className="h-1 w-20 bg-white/10 rounded-full" />
            <div className="h-1 w-16 bg-[#49FFB8]/20 rounded-full" />
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[30%] left-[5%] p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hidden lg:block"
        >
          <PenTool size={24} className="text-[#1C3ECA]/40 mb-2" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-4 w-4 bg-white/10 rounded-sm" />
            <div className="h-4 w-4 bg-[#1C3ECA]/20 rounded-sm" />
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary text-primary-foreground p-1 rounded shadow-lg shadow-primary/20">
              <Layout size={20} />
            </div>
            <span>WorkOrder <span className="text-muted-foreground font-normal italic">System</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
            <Link href="#sop" className="hover:text-primary transition-colors">SOP</Link>
            <Link href="#showcase" className="hover:text-primary transition-colors">Showcase</Link>
            <Link href="#workflow" className="hover:text-primary transition-colors">Workflow</Link>
            <Link
              href="/login"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all flex items-center gap-2 text-xs font-bold shadow-md shadow-primary/10"
            >
              Login Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden text-center">
        <div className="container mx-auto px-6">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              <Zap size={12} fill="currentColor" />
              Digital Technology Division
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              CRAFTING THE <br />
              <span className="relative inline-block">
                FUTURE
                <div className="absolute bottom-2 left-0 w-full h-3 bg-[#49FFB8]/30 -z-10 rounded-full blur-sm" />
              </span>
              {" "}OF TECH
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
              Satu pintu untuk seluruh ekosistem layanan teknologi. <br className="hidden md:block" />
              <span className="text-foreground font-bold underline decoration-[#49FFB8]/50 decoration-4 underline-offset-4">Graphic Design</span> • 
              <span className="text-foreground font-bold underline decoration-[#1C3ECA]/50 decoration-4 underline-offset-4"> IT Development</span> • 
              <span className="text-foreground font-bold underline decoration-zinc-400/50 decoration-4 underline-offset-4"> IT Support</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/login"
                className="group flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/25"
              >
                Launch Work Order
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#sop" className="px-10 py-5 bg-secondary/50 backdrop-blur-md text-secondary-foreground border border-border rounded-2xl font-bold hover:bg-secondary transition-all">
                System SOP
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Analytics Section */}
        <div className="container mx-auto px-6 mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-8 p-10 rounded-[3rem] border border-border bg-white dark:bg-zinc-900 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="text-left">
                  <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp size={24} className="text-primary" /></div>
                    Weekly Volume
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 font-medium italic">
                    Live analytics of tickets entering the pipeline.
                  </p>
                </div>
              </div>
              <div className="h-[300px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888', fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.2)', padding: '12px' }} cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }} />
                    <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="lg:col-span-4 grid grid-cols-1 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-8 rounded-[2.5rem] border border-border bg-white dark:bg-zinc-900 shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  <div className={`absolute -bottom-6 -right-6 opacity-[0.03] dark:opacity-5 group-hover:scale-[1.4] transition-transform duration-700 ease-out ${stat.color}`}>
                    <stat.icon size={160} />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border border-border shadow-inner group-hover:scale-110 transition-transform duration-500 ${stat.color}`}>
                      <stat.icon size={28} />
                    </div>
                    <div className="text-left">
                      <div className="text-4xl font-black tracking-tighter leading-none mb-1">{stat.value}</div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOP Section - Refined Design */}
      <section id="sop" className="py-32 bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 uppercase italic">
              NO TICKET, <span className="text-red-500">NO WORK</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-medium">
              Protokol operasional wajib untuk efisiensi dan transparansi alur kerja divisi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {sopPoints.map((point, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border shadow-xl hover:shadow-2xl transition-all overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${point.color} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border w-fit mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${point.iconColor}`}>
                    <point.icon size={28} />
                  </div>
                  <h4 className="text-lg font-black mb-3 tracking-tight uppercase">{point.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {point.desc}
                  </p>
                </div>
                <div className="absolute bottom-6 right-8 text-4xl font-black opacity-[0.03] italic pointer-events-none group-hover:opacity-10 transition-opacity">
                  0{i+1}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="p-10 rounded-[3.5rem] bg-zinc-900 text-white relative overflow-hidden group shadow-2xl border border-white/5"
            >
              <div className="absolute top-0 right-0 p-10 scale-150 opacity-10 group-hover:scale-175 transition-transform duration-1000">
                <AlertCircle size={200} className="text-red-500" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                <div className="flex-1">
                  <div className="inline-block px-4 py-1 mb-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest">
                    Critical Protocol
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight uppercase leading-none">Urgent Policy (P1)</h3>
                  <p className="text-zinc-400 leading-relaxed text-lg font-medium italic">
                    Hanya permintaan Owner atau kendala teknis yang bersifat "System Down" yang mendapatkan jalur prioritas utama.
                  </p>
                </div>
                <a
                  href="/files/SOP_WorkOrder_IT_Creative.pdf"
                  className="flex items-center gap-4 px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#49FFB8] hover:text-black transition-all shadow-xl active:scale-95 shrink-0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={20} />
                  Download SOP
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-32 overflow-hidden relative">
        <div className="container mx-auto px-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 block">Creative Portfolio</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.8]">DESIGN <br />SHOWCASE</h2>
              <p className="text-lg text-muted-foreground mt-6 font-medium italic">
                Eksplorasi karya visual tim Creative Design kami.
              </p>
            </div>
            <Link href="/login" className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:shadow-2xl shadow-primary/30 transition-all z-10">
              Start Project <ArrowRight size={20} />
            </Link>
          </div>

          <div className="flex justify-center items-center w-full min-h-[500px] relative">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-50" />
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
                  "rotate(5deg) translate(-250px)",
                  "rotate(0deg) translate(-125px)",
                  "rotate(-5deg)",
                  "rotate(5deg) translate(125px)",
                  "rotate(-5deg) translate(250px)"
                ]}
                enableHover={true}
                onImageClick={(src: string) => setSelectedImage(src)}
              />
            ) : (
              <div className="text-center p-20 border-2 border-dashed border-border rounded-[3rem] w-full max-w-2xl backdrop-blur-sm opacity-50">
                <p className="text-muted-foreground font-black tracking-widest uppercase">Waiting for design input...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 bg-zinc-950 text-white relative">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-24 tracking-tighter uppercase">SYSTEM PIPELINE</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {workflow.map((step, i) => (
              <div key={i} className="relative z-10 group">
                <div className="flex flex-col items-center text-center">
                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 mb-8 group-hover:bg-primary group-hover:border-primary transition-all duration-500 shadow-2xl relative">
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-black border border-white/10">0{i+1}</div>
                    <step.icon size={42} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-2xl font-black mb-4 tracking-tight uppercase">{step.title}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">{step.desc}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-[40px] -right-1/2 w-full h-[1px] bg-gradient-to-r from-primary/50 to-transparent -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-zinc-50 dark:bg-black/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2 font-black text-3xl tracking-tighter">
                <Layout size={28} className="text-primary" />
                <span>WO.2026</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-50 leading-relaxed">
                Managed by IT & Creative Division <br />
                SRT CORPORATION INDONESIA
              </p>
            </div>
            <div className="flex gap-12 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Docs</Link>
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
            <span>© 2026 IT & Creative Division. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#49FFB8] animate-pulse" />
              <span>System Operational</span>
            </div>
          </div>
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
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors border border-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              src={selectedImage}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 object-contain bg-zinc-900/50"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
