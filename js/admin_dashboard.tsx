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
                            { label: 'Total Ingress', val: stats.totalViews.toLocaleString(), icon: Eye, sub: 'Page Actions' },
                            { label: 'Active Users', val: stats.uniqueVisitors.toLocaleString(), icon: Users, sub: 'Visitors' },
                            { label: 'Top Region', val: stats.topCountry, icon: Globe, sub: 'Origin' },
                            { label: 'Latency', val: '14ms', icon: Clock, sub: 'Avg Response' }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#0D0D0D] p-8 rounded-[2rem] border border-white/5 hover:border-[#C9A84C]/20 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-[#C9A84C]/10 transition-colors">
                                        <stat.icon size={20} className="text-[#C9A84C]" />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                                        <TrendingUp size={10} /> +4%
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter mb-2 group-hover:text-[#C9A84C] transition-colors">{stat.val}</h3>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{stat.label}</span>
                                    <span className="text-[9px] text-white/20 uppercase font-medium">{stat.sub}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Render Views Based on Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Traffic Area Chart (Recipe 1 Style) */}
                            <div className="lg:col-span-2 bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative">
                                 <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Traffic Volume</h3>
                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">Aggregated Ingress Points Past 7 Intervals</p>
                                    </div>
                                    <div className="flex gap-4">
                                         <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#C9A84C]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                                            Current Cycles
                                         </div>
                                    </div>
                                 </div>

                                 <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="rgba(255,255,255,0.2)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                dy={15}
                                                fontFamily="monospace"
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.2)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                fontFamily="monospace"
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    background: '#0D0D0D', 
                                                    border: '1px solid rgba(255,255,255,0.1)', 
                                                    borderRadius: '16px',
                                                    fontSize: '12px',
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                                    fontFamily: 'sans-serif'
                                                }}
                                                itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                            />
                                            <Area 
                                                type="step" 
                                                dataKey="views" 
                                                stroke="#C9A84C" 
                                                strokeWidth={2} 
                                                fillOpacity={1} 
                                                fill="url(#primaryGradient)" 
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                            </div>

                            {/* Recent Terminal Logs (Recipe 1 Hover Invert) */}
                            <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] flex flex-col h-full max-h-[500px] lg:max-h-none">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0D0D0D]">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Global Feed</h3>
                                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-[0.3em]">Temporal Ingress Stream</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Search size={14} className="text-white/20" />
                                        <Filter size={14} className="text-white/20" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                    <div className="space-y-1">
                                        {filteredEvents.slice(0, 50).map((e, i) => (
                                            <motion.div 
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="px-6 py-4 rounded-2xl transition-all cursor-pointer group hover:bg-[#C9A84C] hover:text-black"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-mono tracking-tight font-black uppercase transition-colors group-hover:text-black">
                                                        {e.visitorId?.substring(0, 8).toUpperCase()}
                                                    </span>
                                                    <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 group-hover:font-bold">
                                                        {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${e.type === 'page_view' ? 'bg-blue-400 group-hover:bg-black' : 'bg-[#C9A84C] group-hover:bg-black'}`} />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 italic serif">
                                                        {e.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <section className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-2xl font-black italic serif tracking-tight">Database Index</h2>
                                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mt-1 font-bold">Unfiltered Ingress Records</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-72">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="SEARCH BY NODE OR ID..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#C9A84C]/30 transition-all placeholder:text-white/10"
                                        />
                                    </div>
                                    <select 
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase outline-none"
                                    >
                                        <option value="all">ALL TYPES</option>
                                        <option value="page_view">VIEWS</option>
                                        <option value="click">CLICKS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                 <table className="w-full text-left font-mono">
                                    <thead className="bg-white/[0.02] border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic serif">Origin</th>
                                            <th className="p-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic serif">Coordinate</th>
                                            <th className="p-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic serif">Action</th>
                                            <th className="p-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic serif text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredEvents.slice(0, 100).map((e, i) => (
                                        <tr 
                                            key={i} 
                                            className={`transition-all hover:bg-white/[0.02] cursor-cell group ${e.visitorId === 'KTA_ADMIN' ? 'bg-[#C9A84C]/5' : ''}`}
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-black border border-white/5 flex items-center justify-center text-[10px] font-black tracking-tighter text-white/40 group-hover:text-[#C9A84C] group-hover:border-[#C9A84C]/30 transition-all">
                                                        {e.visitorId?.substring(0, 2).toUpperCase() || 'AN'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black tracking-tight group-hover:text-[#C9A84C] transition-colors uppercase">
                                                            {e.visitorId?.substring(0, 16) || 'ANONYMOUS_NODE'}
                                                        </p>
                                                        <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{e.country || 'TERRA_NULLIS'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-[11px] text-white/40 group-hover:text-white/60 transition-colors uppercase">
                                                {e.project || e.url || '/ROOT/VOID'}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic serif ${e.type === 'page_view' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#C9A84C]/10 text-[#C9A84C]'}`}>
                                                    {e.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="text-xs font-bold font-mono tracking-tighter">{new Date(e.timestamp).toLocaleTimeString()}</p>
                                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.1em]">{new Date(e.timestamp).toLocaleDateString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                 </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'geo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-10">
                                <h3 className="text-xl font-bold italic serif tracking-tight mb-8">Regional Ingress</h3>
                                <div className="space-y-6">
                                    {countryData.map((item, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                                <span>{item.name}</span>
                                                <span className="text-[#C9A84C]">{item.value} Units</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.value as number / (events.length || 1)) * 100}%` }}
                                                    className="h-full bg-[#C9A84C]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-10 flex items-center justify-center text-center">
                                <div>
                                    <Globe size={48} className="text-white/10 mb-4 mx-auto" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Satellite Link Active</h3>
                                    <p className="text-[10px] text-white/20 mt-2 font-medium">Tracking Global Coordinates in Real-time</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <ShieldCheck size={24} className="text-[#C9A84C]" />
                                <h2 className="text-xl font-bold italic serif tracking-tight">Security Audit Logs</h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { msg: 'Admin authentication successful', time: '2m ago', type: 'security' },
                                    { msg: 'Database handshake complete', time: '5m ago', type: 'system' },
                                    { msg: 'New node connection from UK', time: '12m ago', type: 'network' },
                                    { msg: 'Auto-sync completed', time: '1h ago', type: 'sync' }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between py-4 border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-[#C9A84C]/50" />
                                            <span className="text-[11px] font-mono uppercase tracking-tight text-white/60">{log.msg}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-white/20 uppercase">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
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
