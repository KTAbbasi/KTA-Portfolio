// KTA Admin Intelligence System - Professional Analytics Edition
// Re-imagined with Midnight Navy & Indigo Glassmorphism
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
  Shield, Zap, BarChart3, PieChart, Settings, Bell, HelpCircle
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb, handleFirestoreError, OperationType } from './firebase-init.js';

interface AnalyticsEvent {
    id?: string;
    type: string;
    visitorId?: string;
    country?: string;
    project?: string;
    url?: string;
    timestamp: string;
}

// Design Constants
const COLORS = {
    background: '#13121b',
    surface: '#1f1f28',
    surfaceLighter: '#2a2933',
    primary: '#4f46e5',
    secondary: '#10b981',
    textPrimary: '#e4e1ee',
    textSecondary: '#c7c4d8',
    outline: 'rgba(255, 255, 255, 0.1)',
};

const StatCard = ({ title, value, growth, icon: Icon, color }: any) => (
    <motion.div 
        whileHover={{ y: -6, shadow: '0 20px 25px -5px rgba(79, 70, 229, 0.15)' }}
        className="bg-[#1f1f28] border border-white/10 rounded-xl p-7 shadow-lg relative overflow-hidden group transition-all duration-300"
    >
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div 
                className="p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${color || '#4f46e5'}20`, color: color || '#4f46e5' }}
            >
                <Icon size={24} />
            </div>
            {growth !== undefined && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight ${growth >= 0 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                    {growth >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                    {Math.abs(growth)}%
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-[#c7c4d8] text-[11px] font-bold uppercase tracking-[0.15em] mb-2 opacity-80">{title}</p>
            <p className="text-3xl sm:text-4xl font-black text-[#e4e1ee] tabular-nums tracking-tight">{value}</p>
        </div>
        
        {/* Subtle background glow */}
        <div 
            className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-colors opacity-20"
            style={{ backgroundColor: color || '#4f46e5' }}
        />
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        growth: 12.5
    });
    const [chartData, setChartData] = useState<{name: string, views: number}[]>([]);

    useEffect(() => {
        document.body.style.background = COLORS.background;
        document.body.style.color = COLORS.textPrimary;
        document.body.style.fontFamily = "'Inter', sans-serif";
        return () => {
            document.body.style.background = '';
            document.body.style.color = '';
        };
    }, []);

    const handleLogin = () => {
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
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
                    limit(200)
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

    const processStats = (data: AnalyticsEvent[]) => {
        const uniqueIps = new Set(data.map(e => e.visitorId || 'anon'));
        const dayCounts: Record<string, number> = {};
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            dayCounts[dateStr] = 0;
        }

        data.forEach(e => {
            const date = new Date(e.timestamp);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayCounts[dateStr] !== undefined) {
                dayCounts[dateStr]++;
            }
        });

        setChartData(Object.entries(dayCounts).map(([name, views]) => ({ name, views })));
        setStats({
            totalViews: data.filter(e => e.type === 'page_view').length,
            uniqueVisitors: uniqueIps.size,
            avgDuration: 142,
            growth: 18.2
        });
    };

    useEffect(() => {
        if (isAuthed) fetchData();
    }, [isAuthed]);

    const handleLogout = () => {
        sessionStorage.removeItem('kta_admin_authed');
        setIsAuthed(false);
    };

    if (!isAuthed) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-[#0e0d16]">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-[#1f1f28] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl"
                >
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-[#4f46e5] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-[#4f46e5]/20">
                            <Shield size={32} />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">KTA Intelligence</h2>
                        <p className="text-[#c7c4d8] text-sm mt-2">Restricted Access Portal</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d8] ml-1">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-[#13121b] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all"
                                placeholder="Enter secure key"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-[#ef4444] text-[10px] font-bold uppercase tracking-widest text-center mt-2">Access Denied</p>}
                        <button 
                            onClick={handleLogin}
                            className="w-full py-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            AUTHENTICATE
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#13121b] text-[#e4e1ee] overflow-hidden relative font-['Inter']">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 w-72 bg-[#0e0d16] border-r border-white/5 p-8 flex flex-col z-50
                transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#4f46e5] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#4f46e5]/30">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#c7c4d8]">Analytics</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-[#c7c4d8] hover:text-white bg-white/5 rounded-lg border border-white/5">
                        <XAxis size={18} />
                    </button>
                </div>

                <nav className="space-y-1.5 flex-1">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Performance' },
                        { id: 'events', icon: Database, label: 'Event Flow' },
                        { id: 'audience', icon: Users, label: 'Demographics' },
                        { id: 'reports', icon: BarChart3, label: 'Intelligence' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${activeTab === item.id ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-lg shadow-[#4f46e5]/20' : 'text-[#c7c4d8] hover:bg-white/5 border-transparent'}`}
                        >
                            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium text-[#c7c4d8] hover:bg-white/5 transition-all">
                        <Settings size={18} /> Configuration
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                    >
                        <LogOut size={18} /> Terminate
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#13121b]">
                <header className="h-20 flex-shrink-0 border-b border-white/5 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 bg-[#13121b]/80 backdrop-blur-xl z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 text-[#e4e1ee] bg-[#1f1f28] border border-white/10 rounded-xl shadow-lg">
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex items-center gap-4 bg-[#1f1f28] border border-white/10 rounded-xl px-5 py-2.5 w-64 xl:w-[480px] group focus-within:border-[#4f46e5]/40 transition-all duration-300 shadow-inner">
                            <Search size={18} className="text-[#c7c4d8] group-focus-within:text-[#4f46e5] transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Audit system logs..." 
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/10 text-[#e4e1ee]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-8">
                        <button className="relative p-2.5 text-[#c7c4d8] hover:text-white transition-all hover:bg-white/5 rounded-xl">
                            <Bell size={22} />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#4f46e5] rounded-full ring-4 ring-[#13121b]" />
                        </button>
                        <div className="hidden sm:block h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-[#e4e1ee]">Admin Alpha</p>
                                <p className="text-[10px] text-[#10b981] font-black uppercase tracking-[0.2em] mt-0.5">Verified</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1f1f28] to-[#0e0d16] border border-white/15 flex items-center justify-center font-bold text-sm text-[#4f46e5] shadow-xl">
                                KTA
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-8 lg:p-12 space-y-10 lg:space-y-16 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-[#4f46e5]" />
                                <span className="text-[10px] font-black text-[#4f46e5] uppercase tracking-[0.3em]">System Overview</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-[#e4e1ee]">Pulse Monitor</h1>
                            <p className="text-[#c7c4d8] text-sm sm:text-lg mt-3 max-w-2xl font-medium opacity-70">Unified intelligence dashboard for real-time traffic resonance and interaction analysis.</p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#1f1f28] hover:bg-[#2a2933] border border-white/10 rounded-2xl text-[11px] font-black text-[#e4e1ee] shadow-2xl transition-all duration-300 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Neural Link
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        <StatCard title="Total Resonance" value={stats.totalViews.toLocaleString()} growth={12.4} icon={Eye} />
                        <StatCard title="Active Nodes" value={stats.uniqueVisitors.toLocaleString()} growth={8.2} icon={Users} />
                        <StatCard title="Latency Audit" value={`${stats.avgDuration}ms`} growth={-2.1} icon={Clock} color="#ffb695" />
                        <StatCard title="System Stability" value="100%" growth={0} icon={Activity} color="#10b981" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Chart */}
                        <div className="lg:col-span-8 bg-[#1f1f28] border border-white/10 rounded-3xl p-6 sm:p-12 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4f46e5]/5 rounded-full blur-[100px] -mr-64 -mt-64" />
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-[#e4e1ee] tracking-tight">Traffic Flux</h2>
                                    <p className="text-[10px] text-[#c7c4d8] mt-2 uppercase tracking-[0.2em] font-black opacity-60">Temporal resonance analysis (Unified)</p>
                                </div>
                                <div className="flex items-center gap-4 bg-[#13121b] border border-white/10 p-2 rounded-xl">
                                    <button className="px-4 py-2 bg-[#4f46e5] text-white text-[10px] font-black rounded-lg shadow-lg shadow-[#4f46e5]/30">LIVE</button>
                                    <button className="px-4 py-2 text-[#c7c4d8] text-[10px] font-black hover:text-white transition-colors">HISTORY</button>
                                </div>
                            </div>
                            <div className="h-[300px] sm:h-[450px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorViewsPro" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#35343e" 
                                            fontSize={10} 
                                            fontWeight={800}
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={20}
                                        />
                                        <YAxis 
                                            stroke="#35343e" 
                                            fontSize={10} 
                                            fontWeight={800}
                                            tickLine={false} 
                                            axisLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
                                            contentStyle={{ 
                                                background: 'rgba(31, 31, 40, 0.95)', 
                                                backdropFilter: 'blur(20px)',
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '20px', 
                                                fontSize: '11px',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                            }}
                                            itemStyle={{ color: '#4f46e5', fontWeight: '900' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="views" 
                                            stroke="#4f46e5" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorViewsPro)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="lg:col-span-4 bg-[#0e0d16] border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4f46e5]/5 rounded-full blur-3xl" />
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <h2 className="text-xl font-black text-[#e4e1ee]">Neural Log</h2>
                                <div className="p-2 bg-[#4f46e5]/10 rounded-lg text-[#4f46e5]">
                                    <Activity size={18} />
                                </div>
                            </div>
                            <div className="space-y-6 flex-1 overflow-y-auto pr-3 custom-scrollbar max-h-[600px] relative z-10">
                                {events.slice(0, 20).map((event, i) => (
                                    <div key={i} className="flex items-start gap-5 p-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all duration-300 group">
                                        <div className="w-2 h-12 bg-[#4f46e5] rounded-full opacity-10 group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <p className="text-[11px] font-black text-[#e4e1ee] uppercase tracking-[0.1em] truncate">{event.type.replace('_', ' ')}</p>
                                                <span className="text-[9px] font-bold text-[#4f46e5] bg-[#4f46e5]/10 px-2 py-0.5 rounded-md tabular-nums">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[10px] text-[#c7c4d8] font-bold truncate opacity-50 mb-3">{event.visitorId || 'SYSTEM_NODE'}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] px-2 py-1 bg-white/5 rounded-full text-[#c7c4d8] font-bold uppercase tracking-wider">{event.country || 'Global'}</span>
                                                {event.project && <span className="text-[8px] px-2 py-1 bg-[#10b981]/20 rounded-full text-[#10b981] font-bold uppercase tracking-wider border border-[#10b981]/30">{event.project}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-10 py-4 bg-[#1f1f28] hover:bg-[#2a2933] text-[10px] font-black rounded-2xl transition-all border border-white/10 uppercase tracking-[0.3em] text-[#c7c4d8] hover:text-white relative z-10">
                                AUDIT FULL STACK
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(79, 70, 229, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(79, 70, 229, 0.4);
                }
                canvas {
                    filter: drop-shadow(0 10px 10px rgba(79, 70, 229, 0.1));
                }
            `}</style>
        </div>
    );
};

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
