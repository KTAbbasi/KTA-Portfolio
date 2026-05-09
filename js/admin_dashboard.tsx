import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  Users, Eye, Globe, Clock, LayoutDashboard, Database, 
  Activity, ArrowUpRight, TrendingUp, ShieldCheck, LogOut, RefreshCw,
  Search, Calendar, Filter, MoreVertical, Menu, ChevronRight,
  Shield, Zap, BarChart3, PieChart
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb, handleFirestoreError, OperationType } from './firebase-init.js';

console.log('AdminDashboard: Initiating System Overhaul...');

interface AnalyticsEvent {
    id?: string;
    type: string;
    visitorId?: string;
    country?: string;
    project?: string;
    url?: string;
    timestamp: string;
}

const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
    <motion.div 
        whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
        className={`bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_30px_60px_-15px_rgba(0,0,0,0.7)] p-8 relative overflow-hidden ${className}`}
    >
        {/* Subtle Inner Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {children}
    </motion.div>
);

const AdminDashboard = () => {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(() => {
        try {
            return sessionStorage.getItem('kta_admin_authed') === 'true';
        } catch (e) { return false; }
    });
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        topCountry: 'None'
    });
    const [chartData, setChartData] = useState<{name: string, views: number}[]>([]);

    // Reset body style for admin
    useEffect(() => {
        document.body.style.cursor = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'auto';
        return () => {
            document.body.style.cursor = '';
        };
    }, []);

    const handleLogin = () => {
        if (password === '1a2s3d_komal') {
            try {
                sessionStorage.setItem('kta_admin_authed', 'true');
            } catch (e) {}
            setIsAuthed(true);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const db = await getFirebaseDb();
            if (db) {
                const q = query(
                    collection(db, 'analytics_events'), 
                    orderBy('timestamp', 'desc'), 
                    limit(500)
                );
                const snapshot = await getDocs(q);
                const cloudEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AnalyticsEvent[];
                setEvents(cloudEvents);
                processStats(cloudEvents);
            }
        } catch (e: any) {
            handleFirestoreError(e, OperationType.LIST, 'analytics_events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthed) {
            fetchData();
        }
    }, [isAuthed]);

    const handleLogout = () => {
        try {
            sessionStorage.removeItem('kta_admin_authed');
            setIsAuthed(false);
        } catch (e) {}
    };

    const processStats = (data: AnalyticsEvent[]) => {
        const uniqueIps = new Set(data.map(e => e.visitorId || 'anon'));
        const countries: Record<string, number> = {};
        data.forEach(e => {
            if (e.country) countries[e.country] = (countries[e.country] || 0) + 1;
        });
        
        const sorted = Object.entries(countries).sort((a: any, b: any) => b[1] - a[1]);
        const top = sorted[0];

        // Process Chart Data (Last 7 days)
        const dayCounts: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
            dayCounts[dateStr] = 0;
        }

        data.forEach(e => {
            if (e.type === 'page_view') {
                const date = new Date(e.timestamp);
                const dateStr = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                if (dayCounts[dateStr] !== undefined) {
                    dayCounts[dateStr]++;
                }
            }
        });

        const newChartData = Object.entries(dayCounts).map(([name, views]) => ({ name, views }));
        setChartData(newChartData);

        setStats({
            totalViews: data.filter(e => e.type === 'page_view').length,
            uniqueVisitors: uniqueIps.size,
            avgDuration: 124, 
            topCountry: top ? top[0] : 'None'
        });
    };

    const countryData = Object.entries(
        events.reduce((acc: Record<string, number>, e) => {
            if (e.country) acc[e.country] = (acc[e.country] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

    const filteredEvents = events.filter(e => {
        const matchesSearch = !searchQuery || 
            (e.visitorId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (e.country?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (e.url?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (e.project?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesType = filterType === 'all' || e.type === filterType;
        
        return matchesSearch && matchesType;
    });

    if (!isAuthed) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505] p-6 selection:bg-[#C9A84C]/30 font-sans">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm"
                >
                    <div className="bg-[#0D0D0D] p-10 rounded-[2rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-center">
                        <div className="mb-10 inline-flex p-4 bg-white/5 rounded-2xl border border-white/10">
                            <Shield className="text-[#C9A84C]" size={32} />
                        </div>
                        
                        <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Portfolio Access</h2>
                        <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-medium mb-10">Restricted Admin Environment</p>

                        <div className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    placeholder="Access Code" 
                                    className="w-full px-6 py-4 bg-black border border-white/5 rounded-2xl text-white outline-none focus:border-[#C9A84C]/50 transition-all text-center tracking-[1em] placeholder:tracking-normal placeholder:text-white/20 font-mono"
                                    autoFocus
                                />
                                {error && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-8 left-0 w-full text-red-500 text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Access Denied
                                    </motion.p>
                                )}
                            </div>

                            <button 
                                onClick={handleLogin}
                                className="w-full py-4 bg-[#C9A84C] text-black font-bold rounded-2xl transition-all uppercase tracking-widest text-xs hover:bg-[#E0C172] active:scale-[0.98] mt-4"
                            >
                                Unlock Terminal
                            </button>
                        </div>

                        <p className="mt-12 text-[9px] text-white/20 uppercase tracking-widest">
                            Secure Handshake Required
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading && events.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-[#C9A84C]">
            <div className="relative">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border border-white/10 border-t-[#C9A84C] rounded-full shadow-[0_0_20px_rgba(201,168,76,0.1)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={20} className="animate-pulse" />
                </div>
            </div>
            <motion.p 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-bold text-[10px] tracking-[0.6em] uppercase mt-10 text-white/40"
            >
                Authenticating
            </motion.p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-[#C9A84C]/30">
            
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-[#080808] p-8">
                <div className="mb-12">
                   <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center text-black">
                            <Shield size={18} />
                        </div>
                        <span className="font-extrabold text-xl tracking-tighter">KTN<span className="text-[#C9A84C]">OS</span></span>
                   </div>
                   <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Admin Control Unit</p>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Systems' },
                        { id: 'events', icon: Activity, label: 'Live Feed' },
                        { id: 'geo', icon: Globe, label: 'Geography' },
                        { id: 'audit', icon: Shield, label: 'Audit Log' }
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} />
                                <span className="text-sm font-bold">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight size={14} />}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        <LogOut size={18} />
                        Exit Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-12">
                    
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Server Matrix Online</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tight leading-none uppercase">
                                QUANTUM <span className="text-white/20">INSIGHTS</span>
                            </h1>
                            <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">Real-time Intelligence Engine | v4.2.0</p>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-[#151515] flex items-center justify-center text-[10px] font-bold text-white/40">
                                        V0{i}
                                    </div>
                                ))}
                             </div>
                             <div className="h-8 w-px bg-white/10 hidden md:block" />
                             <button 
                                onClick={fetchData}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                             >
                                <RefreshCw size={18} className={`text-white/60 group-hover:text-white ${loading ? 'animate-spin' : ''}`} />
                             </button>
                        </div>
                    </header>

                    {/* Bento Grid Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Ingress', val: stats.totalViews.toLocaleString(), icon: Eye, sub: 'Page Actions', color: 'text-blue-400' },
                            { label: 'Active Users', val: stats.uniqueVisitors.toLocaleString(), icon: Users, sub: 'Visitors', color: 'text-[#C9A84C]' },
                            { label: 'Top Region', val: stats.topCountry, icon: Globe, sub: 'Origin', color: 'text-emerald-400' },
                            { label: 'Latency', val: '14ms', icon: Clock, sub: 'Avg Response', color: 'text-orange-400' }
                        ].map((stat, i) => (
                            <GlassCard key={i} className="group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 bg-white/5 rounded-3xl group-hover:bg-white/10 transition-colors shadow-lg border border-white/5`}>
                                        <stat.icon size={24} className={stat.color} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-tighter bg-green-500/10 px-2 py-1 rounded-full">
                                        <TrendingUp size={10} /> +4.2%
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black tracking-tight group-hover:text-[#C9A84C] transition-colors">{stat.val}</h3>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{stat.label}</span>
                                        <span className="text-[9px] text-white/10 uppercase font-black tracking-widest">{stat.sub}</span>
                                    </div>
                                </div>
                                
                                {/* Decorator Dot */}
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/5 blur-2xl rounded-full" />
                            </GlassCard>
                        ))}
                    </div>

                    {/* Render Views Based on Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            
                            {/* Traffic Area Chart (Recipe 1 Style) */}
                            <GlassCard className="lg:col-span-2 min-h-[550px] flex flex-col" hover={false}>
                                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-1.5 h-6 bg-[#C9A84C] rounded-full" />
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">Traffic <span className="text-white/20">Volume</span></h3>
                                        </div>
                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black ml-4">Temporal Handshake Analysis</p>
                                    </div>
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                         <button className="px-4 py-2 bg-[#C9A84C] text-black text-[10px] font-black rounded-xl uppercase tracking-widest">Live</button>
                                         <button className="px-4 py-2 text-white/20 text-[10px] font-black rounded-xl uppercase tracking-widest hover:text-white/40">History</button>
                                    </div>
                                 </div>

                                 <div className="flex-1 w-full min-h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="rgba(255,255,255,0.1)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                dy={15}
                                                fontFamily="monospace"
                                                fontWeight="bold"
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.1)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                fontFamily="monospace"
                                                fontWeight="bold"
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    background: '#0D0D0D', 
                                                    border: '1px solid rgba(255,255,255,0.1)', 
                                                    borderRadius: '24px',
                                                    fontSize: '10px',
                                                    boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                                                    padding: '16px'
                                                }}
                                                itemStyle={{ color: '#C9A84C', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                                cursor={{ stroke: 'rgba(201,168,76,0.2)', strokeWidth: 2 }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="views" 
                                                stroke="#C9A84C" 
                                                strokeWidth={4} 
                                                fillOpacity={1} 
                                                fill="url(#primaryGradient)" 
                                                animationDuration={2500}
                                                activeDot={{ r: 8, fill: '#C9A84C', stroke: '#000', strokeWidth: 4 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                                 
                                 {/* Paper Curl Aesthetic (CSS simulation) */}
                                 <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none overflow-hidden">
                                    <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/5 rotate-45 blur-3xl" />
                                 </div>
                            </GlassCard>

                            {/* Recent Terminal Logs */}
                            <GlassCard className="flex flex-col h-full min-h-[550px]" hover={false}>
                                <div className="mb-8 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Global Feed</h3>
                                        <span className="text-[9px] text-[#C9A84C] font-black uppercase tracking-[0.3em]">Live Ingress</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        <div className="w-2 h-2 rounded-full bg-[#C9A84C] shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                    <div className="space-y-3">
                                        {filteredEvents.slice(0, 30).map((e, i) => (
                                            <motion.div 
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-crosshair group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-mono font-black text-white/20 group-hover:text-[#C9A84C] transition-colors">
                                                        ID::{e.visitorId?.substring(0, 8).toUpperCase()}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-white/10 font-bold">
                                                        {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {e.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[9px] font-black text-white/30 uppercase italic">{e.country || 'Global'}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <GlassCard className="!p-0 overflow-hidden" hover={false}>
                            <div className="p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-white/[0.01]">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-4 bg-[#C9A84C]/10 rounded-2xl">
                                            <Database size={24} className="text-[#C9A84C]" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black uppercase tracking-tighter">Database <span className="text-white/20">Index</span></h2>
                                            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-bold">Comprehensive Ingress Records</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                    <div className="relative group flex-1 md:w-80">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C9A84C] transition-colors" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="FILTER NODES..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#C9A84C]/30 focus:bg-black/60 transition-all placeholder:text-white/10"
                                        />
                                    </div>
                                    <select 
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-[#C9A84C]/30 transition-all text-[10px] font-black uppercase outline-none cursor-pointer"
                                    >
                                        <option value="all">ALL PROTOCOLS</option>
                                        <option value="page_view">VIEWS</option>
                                        <option value="click">INTERACTIONS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                 <table className="w-full text-left font-mono">
                                    <thead className="bg-white/[0.02] border-b border-white/5">
                                        <tr>
                                            <th className="px-10 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Signature</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Coordinate</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Status</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredEvents.slice(0, 100).map((e, i) => (
                                        <tr 
                                            key={i} 
                                            className={`transition-all hover:bg-white/[0.03] cursor-help group ${e.visitorId === 'KTA_ADMIN' ? 'bg-[#C9A84C]/5' : ''}`}
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-[12px] font-black tracking-tighter text-white/30 group-hover:text-[#C9A84C] group-hover:border-[#C9A84C]/40 transition-all shadow-inner">
                                                        {e.visitorId?.substring(0, 2).toUpperCase() || 'AN'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black tracking-tighter group-hover:text-[#C9A84C] transition-colors uppercase">
                                                            {e.visitorId?.substring(0, 16) || 'ANONYMOUS_NODE'}
                                                        </p>
                                                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{e.country || 'TERRA_NULLIS'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[11px] font-black text-white/40 group-hover:text-white/60 transition-colors bg-white/5 px-4 py-2 rounded-xl">
                                                    {e.project || e.url || '/ROOT/SECURE'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${e.type === 'page_view' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' : 'bg-[#C9A84C]/5 text-[#C9A84C] border-[#C9A84C]/10'}`}>
                                                    {e.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <p className="text-sm font-black text-white tracking-widest">{new Date(e.timestamp).toLocaleTimeString()}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{new Date(e.timestamp).toLocaleDateString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                 </table>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'geo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <GlassCard hover={false}>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="p-4 bg-[#C9A84C]/10 rounded-2xl">
                                        <Globe size={24} className="text-[#C9A84C]" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Regional <span className="text-white/20">Ingress</span></h3>
                                </div>
                                <div className="space-y-8">
                                    {countryData.map((item, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                                <span>{item.name}</span>
                                                <span className="text-[#C9A84C]">{item.value} UNITS</span>
                                            </div>
                                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.value as number / (events.length || 1)) * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E0C172] rounded-full shadow-[0_0_10px_rgba(201,168,76,0.3)]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                            <GlassCard className="flex flex-col items-center justify-center text-center py-20" hover={false}>
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotateY: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="mb-8"
                                    >
                                        <Globe size={120} className="text-[#C9A84C]/20" strokeWidth={0.5} />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap size={32} className="text-[#C9A84C] animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Satellite Uplink</h3>
                                <p className="text-[10px] text-white/20 mt-4 font-black uppercase tracking-widest max-w-[200px] leading-relaxed">Tracking Global Node Coordinates in Real-time</p>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <GlassCard hover={false}>
                            <div className="flex items-center gap-6 mb-12">
                                <div className="p-5 bg-[#C9A84C]/10 rounded-3xl">
                                    <ShieldCheck size={32} className="text-[#C9A84C]" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">Security <span className="text-white/20">Protocol</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">Temporal Integrity Records</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { msg: 'System integrity handshake verified', time: '1m ago', type: 'security', status: 'verified' },
                                    { msg: 'Admin session token revalidated', time: '4m ago', type: 'system', status: 'secure' },
                                    { msg: 'Heuristic anomaly scan clear', time: '15m ago', type: 'network', status: 'active' },
                                    { msg: 'Database bridge auto-synced', time: '2h ago', type: 'sync', status: 'success' }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-3xl hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                                            <div>
                                                <span className="text-sm font-black text-white/60 tracking-tight uppercase">{log.msg}</span>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Type::{log.type}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/40">Status::{log.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-white/10 font-black uppercase tracking-widest">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Footer */}
                    <footer className="pt-20 pb-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 opacity-30">
                        <div className="flex items-center gap-2">
                            <Shield size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">KTA PORTFOLIO OS v4.2.0</span>
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} ALL SYSTEMS OPERATIONAL</p>
                    </footer>
                </div>
            </main>

            {/* Global Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
                
                .serif {
                    font-family: 'Libre Baskerville', serif;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(201, 168, 76, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(201, 168, 76, 0.4);
                }

                /* Text Shadows */
                .text-glow {
                    text-shadow: 0 0 20px rgba(201, 168, 76, 0.3);
                }
            `}</style>
        </div>
    );
};

// Mount 
const mount = () => {
    try {
        const container = document.getElementById('admin-root');
        if (container) {
            const root = createRoot(container);
            root.render(<AdminDashboard />);
        }
    } catch (e) {
        console.error('Mount Error:', e);
    }
};

mount();
