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

const StatCard = ({ title, value, growth, icon: Icon }: any) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="bg-[#1f1f28] border border-white/10 rounded-xl p-6 shadow-lg relative overflow-hidden"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-[#4f46e5]/10 rounded-lg text-[#4f46e5]">
                <Icon size={20} />
            </div>
            {growth && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${growth >= 0 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                    {growth >= 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                    {growth}%
                </div>
            )}
        </div>
        <div>
            <p className="text-[#c7c4d8] text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold text-[#e4e1ee] tabular-nums">{value}</p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Icon size={64} />
        </div>
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
            <div className="flex items-center justify-center min-h-screen p-6 bg-[#0e0d16]">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-[#1f1f28] border border-white/10 rounded-2xl p-10 shadow-2xl"
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
        <div className="flex h-screen bg-[#13121b] text-[#e4e1ee] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 bg-[#0e0d16] border-r border-white/5 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center text-white">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Analytics</span>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'events', icon: Database, label: 'Event Log' },
                        { id: 'audience', icon: Users, label: 'Audience' },
                        { id: 'reports', icon: BarChart3, label: 'Reports' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-[#4f46e5]/10 text-[#4f46e5] border border-[#4f46e5]/20' : 'text-[#c7c4d8] hover:bg-white/5'}`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#c7c4d8] hover:bg-white/5 transition-all">
                        <Settings size={18} /> Settings
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="h-20 flex-shrink-0 border-b border-white/5 px-10 flex items-center justify-between sticky top-0 bg-[#13121b]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 bg-[#1f1f28] border border-white/5 rounded-xl px-4 py-2 w-96 group focus-within:border-[#4f46e5]/30 transition-all">
                        <Search size={16} className="text-[#c7c4d8]" />
                        <input 
                            type="text" 
                            placeholder="Search parameters..." 
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/10"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-[#c7c4d8] hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#10b981] rounded-full ring-2 ring-[#13121b]" />
                        </button>
                        <div className="h-6 w-px bg-white/5" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold">Admin</p>
                                <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-widest">Active</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#2a2933] border border-white/10 flex items-center justify-center font-bold text-xs">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-10 max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Intelligence Dashboard</h1>
                            <p className="text-[#c7c4d8] mt-1">Global monitoring of portfolio interactive points.</p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#1f1f28] border border-white/5 rounded-lg text-xs font-bold text-[#c7c4d8] hover:text-white hover:border-white/20 transition-all"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH DATA
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Impressions" value={stats.totalViews.toLocaleString()} growth={12.4} icon={Eye} />
                        <StatCard title="Unique Visitors" value={stats.uniqueVisitors.toLocaleString()} growth={8.2} icon={Users} />
                        <StatCard title="Avg. Retension" value={`${stats.avgDuration}s`} growth={-2.1} icon={Clock} />
                        <StatCard title="Live Systems" value="99.9%" growth={0} icon={Activity} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 bg-[#1f1f28] border border-white/5 rounded-xl p-8 shadow-xl">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-xl font-bold">Traffic Resonance</h2>
                                    <p className="text-xs text-[#c7c4d8] mt-1 uppercase tracking-widest font-medium">Weekly throughput audit</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-[#4f46e5]" />
                                        <span className="text-[10px] font-bold text-[#c7c4d8] uppercase">Active Load</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="rgba(255,255,255,0.2)" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="rgba(255,255,255,0.2)" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false}
                                        />
                                        <Tooltip 
                                            contentStyle={{ background: '#1f1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="views" 
                                            stroke="#4f46e5" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorViews)" 
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#1f1f28] border border-white/5 rounded-xl p-8 flex flex-col shadow-xl">
                            <h2 className="text-xl font-bold mb-8">Real-time Pulse</h2>
                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {events.slice(0, 10).map((event, i) => (
                                    <div key={i} className="flex items-start gap-4 group">
                                        <div className="w-2 h-10 bg-gradient-to-b from-[#4f46e5] to-transparent rounded-full opacity-20 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-bold text-[#e4e1ee] truncate">{event.type.replace('_', ' ').toUpperCase()}</p>
                                                <span className="text-[9px] text-[#c7c4d8] tabular-nums">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-[#c7c4d8] truncate">{event.visitorId || 'Anonymous'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-[#c7c4d8]">{event.country || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-10 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-all border border-white/5">
                                VIEW LOG ARCHIVE
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
                    background: rgba(79, 70, 229, 0.5);
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
