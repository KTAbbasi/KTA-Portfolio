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

const GlassCard = ({ children, className = '', hover = true, curl = false }: { children: React.ReactNode, className?: string, hover?: boolean, curl?: boolean }) => (
    <motion.div 
        whileHover={hover ? { y: -8, scale: 1.01, transition: { duration: 0.3, ease: "easeOut" } } : {}}
        className={`bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] shadow-[10px_10px_30px_rgba(0,0,0,0.5),-5px_-5px_20px_rgba(255,255,255,0.02)] p-8 relative overflow-hidden group ${className}`}
    >
        {/* Paper Curl Effect Component */}
        {curl && (
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-10">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#C9A84C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-[-2px] right-[-2px] w-8 h-8 bg-[#151515] border-l border-b border-white/10 rounded-bl-[1.5rem] shadow-[2px_2px_10px_rgba(0,0,0,0.5)] transform origin-top-right group-hover:scale-150 group-hover:rotate-12 transition-transform duration-500" />
            </div>
        )}
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
    const [activeTab, setActiveTab] = useState('dashboard');
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
        document.body.style.background = '#080808';
        document.body.style.cursor = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'auto';
        return () => {
            document.body.style.cursor = '';
            document.body.style.background = '';
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
        <div className="flex min-h-screen bg-[#080808] text-white font-sans selection:bg-[#C9A84C]/30 p-4 md:p-6 lg:p-8 gap-6">
            
            {/* Sidebar - Neumorphic Style */}
            <aside className="hidden xl:flex flex-col w-80 bg-[#0D0D0D] rounded-[3rem] border border-white/5 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] p-10">
                <div className="mb-14">
                   <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#E0C172] flex items-center justify-center text-black shadow-lg">
                            <Shield size={20} />
                        </div>
                        <span className="font-black text-2xl tracking-tighter">Dash<span className="text-[#C9A84C]">Burd</span></span>
                   </div>
                   <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] ml-1">Creative OS v4.2</p>
                </div>

                <div className="space-y-10 flex-1">
                    <div>
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mb-6 ml-4">Main Menu</p>
                        <nav className="space-y-3">
                            {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                { id: 'events', icon: Database, label: 'Inbox', count: '12' },
                                { id: 'feed', icon: Activity, label: 'Feed' },
                                { id: 'staff', icon: Users, label: 'Staff' },
                                { id: 'geo', icon: PieChart, label: 'Statistics' },
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-white font-black text-black shadow-xl scale-[1.02]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon size={20} className={activeTab === item.id ? 'text-[#C9A84C]' : ''} />
                                        <span className="text-sm tracking-tight">{item.label}</span>
                                    </div>
                                    {item.count && (
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-[#C9A84C] text-black' : 'bg-white/5 text-white/30'}`}>
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mb-6 ml-4">Organization</p>
                        <nav className="space-y-3">
                            {[
                                { id: 'mentoring', label: 'Mentoring', color: '#C9A84C' },
                                { id: 'gaming', label: 'Gaming', color: '#44DDFF' },
                                { id: 'celebrating', label: 'Celebrating', color: '#FF44DD' },
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all group"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>



                <div className="mt-8 pt-8 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-3 text-white/20 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
                    >
                        <LogOut size={16} />
                        Terminate Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <div className="max-w-[1600px] mx-auto space-y-16">
                    
                    {/* Header: Hello Creative! */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-black tracking-tighter">Hello Creative! 👋</h1>
                            </div>
                            <nav className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                                <button className="text-[#C9A84C] border-b-2 border-[#C9A84C] pb-2">Overview</button>
                                <button className="hover:text-white transition-colors">Team Details</button>
                                <button className="hover:text-white transition-colors">Tasks Statistic</button>
                                <button className="hover:text-white transition-colors">My Plans</button>
                                <button className="hover:text-white transition-colors">Notifications</button>
                                <button className="hover:text-white transition-colors">Integrations</button>
                            </nav>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden lg:flex items-center gap-3 bg-[#0D0D0D] border border-white/5 rounded-full px-6 py-2.5 shadow-inner group focus-within:border-[#C9A84C]/30 transition-all">
                                <Search size={18} className="text-white/20 group-focus-within:text-[#C9A84C] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-white/10 w-32 focus:w-48 transition-all"
                                />
                            </div>

                            <div className="bg-[#0D0D0D] p-1.5 rounded-full border border-white/5 shadow-inner flex items-center">
                                <button className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl">General</button>
                                <button className="px-6 py-2.5 text-white/30 text-[10px] font-black rounded-full uppercase tracking-widest hover:text-white/60 transition-colors">Workspace</button>
                            </div>
                            
                            <div className="h-10 w-px bg-white/10" />

                            <div className="flex items-center gap-3 bg-[#0D0D0D] border border-white/5 rounded-full pl-2 pr-6 py-2 hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E0C172] p-1">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-[10px]">KTA</div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black">Nathan KTA</p>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest group-hover:text-[#C9A84C] transition-colors">Lead Designer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid: Dashboard Layout */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            
                            {/* Projects Stats Bar Chart */}
                            <GlassCard className="md:col-span-2 lg:col-span-2 h-[450px] flex flex-col" curl={true}>
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-xl font-black mb-1">Projects Stats</h3>
                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Temporal Handshake Metrics</p>
                                    </div>
                                    <MoreVertical className="text-white/20" size={18} />
                                </div>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="rgba(255,255,255,0.1)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                dy={10}
                                                fontFamily="Arial"
                                            />
                                            <Tooltip 
                                                contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px' }}
                                                itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={3} fill="url(#barGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                <div className="mt-6 flex justify-around p-4 bg-white/5 rounded-3xl border border-white/5">
                                    {[
                                        { l: 'Completed', v: '84%', c: 'bg-[#C9A84C]' },
                                        { l: 'In Progress', v: '12%', c: 'bg-white/20' }
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${s.c}`} />
                                            <div>
                                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{s.l}</p>
                                                <p className="text-xs font-black">{s.v}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Tasks Donut Chart */}
                            <GlassCard className="h-[450px] flex flex-col items-center justify-center relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]" curl={true}>
                                <div className="absolute top-8 left-8">
                                    <h3 className="text-xl font-black mb-1">Tasks Chart</h3>
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Core Distribution</p>
                                </div>
                                
                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 transform">
                                        <circle 
                                            cx="112" cy="112" r="100" 
                                            stroke="rgba(255,255,255,0.05)" strokeWidth="24" fill="transparent"
                                        />
                                        <motion.circle 
                                            initial={{ strokeDasharray: "0, 628" }}
                                            animate={{ strokeDasharray: "460, 628" }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            cx="112" cy="112" r="100" 
                                            stroke="#C9A84C" strokeWidth="24" fill="transparent"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black tracking-tighter">73%</span>
                                        <span className="text-[10px] text-white/20 font-black uppercase tracking-tighter">Total Tasks</span>
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Done</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Process</span>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Right Column Stack */}
                            <div className="space-y-8 h-[450px]">
                                <GlassCard className="h-[210px] bg-gradient-to-br from-[#C9A84C] to-[#E0C172] text-black" hover={true}>
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 bg-black/10 rounded-2xl">
                                                <Zap size={24} />
                                            </div>
                                            <ArrowUpRight size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tighter">Projects Report</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">We done 17 project this month</p>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard className="h-[210px] bg-[#151515] border-[#C9A84C]/10" hover={true}>
                                    <div className="flex flex-col h-full justify-between text-center items-center">
                                         <div className="flex -space-x-4 mb-4">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-full bg-[#0D0D0D] border-2 border-[#151515] flex items-center justify-center font-black text-[#C9A84C] text-[10px]">
                                                    {i === 4 ? '+5' : `P${i}`}
                                                </div>
                                            ))}
                                         </div>
                                         <div>
                                            <h4 className="text-sm font-black mb-1">Matrix Talk</h4>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Join live intelligence feed</p>
                                         </div>
                                         <button className="w-full py-2.5 bg-[#C9A84C] text-black text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg mt-4">Join Meeting</button>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Bottom Row: Recent Activities & Tasks Comparison */}
                            <GlassCard className="md:col-span-2 lg:col-span-1 min-h-[400px] flex flex-col" curl={true}>
                                <div className="mb-8">
                                    <h3 className="text-xl font-black tracking-tight">Recent Activities</h3>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Latest Signal Pulse</p>
                                </div>
                                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                    {filteredEvents.slice(0, 5).map((e, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                                            <div className="w-10 h-10 rounded-2xl bg-black border border-white/5 flex items-center justify-center font-black text-[#C9A84C] text-[10px]">
                                                {e.visitorId?.substring(0, 1).toUpperCase() || 'A'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black truncate">{e.visitorId || 'Anonymous User'}</p>
                                                <p className="text-[9px] text-[#C9A84C] font-black uppercase tracking-widest">{e.type.replace('_', ' ')}</p>
                                            </div>
                                            <button className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/20 group-hover:text-white/60 transition-colors">Details</button>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>

                            <GlassCard className="md:col-span-2 lg:col-span-3 min-h-[400px] flex flex-col" curl={true}>
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Tasks Comparison</h3>
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Temporal Delta Analytics</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-0.5 bg-[#C9A84C]" />
                                            <span className="text-[10px] text-white/40 font-black uppercase">Now</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-0.5 bg-white/10" />
                                            <span className="text-[10px] text-white/20 font-black uppercase font-medium">Prev</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip 
                                                contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px' }}
                                                itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={4} fill="url(#barGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-8 flex justify-between items-center text-[11px] font-black uppercase tracking-[0.4em] text-white/20 px-4">
                                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                </div>
                            </GlassCard>

                        </div>
                    )}
                    
                    {/* Render Other Tabs if needed */}
                    {activeTab !== 'dashboard' && (
                        <div className="animate-in fade-in duration-500">
                             {/* Re-use existing components for table results if needed */}
                             <GlassCard className="p-10">
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-10">{activeTab} VIEW</h2>
                                <p className="text-white/40">This section is currently under development to match the new UI architecture.</p>
                             </GlassCard>
                        </div>
                    )}

                    {/* Footer */}
                    <footer className="pt-20 pb-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 opacity-20">
                        <div className="flex items-center gap-2">
                            <Shield size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">KTA PORTFOLIO OS v4.2.0</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} ALL SYSTEMS ACTIVE</p>
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
