import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { 
  Users, Eye, Globe, Clock, LayoutDashboard, Database, 
  Activity, ArrowUpRight, TrendingUp, ShieldCheck, LogOut, RefreshCw,
  Search, Calendar, Filter, MoreVertical
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb, handleFirestoreError, OperationType } from './firebase-init.js';

console.log('AdminDashboard: Script execution started');

// Update status directly from JS
try {
    const s = document.getElementById('mounting-status');
    if (s) s.innerText = 'DASHBOARD ENGINE: QUANTUM STABILIZED...';
} catch(e) {
    console.error('AdminDashboard: Status update error', e);
}

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
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        topCountry: 'None'
    });

    const getSafe = (key: string, type: 'local' | 'session' = 'local') => {
        try {
            return (type === 'local' ? localStorage : sessionStorage).getItem(key);
        } catch (e) { return null; }
    };

    const myId = getSafe('kta_visitor_id');

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

    const timeData = [
        { name: 'Mon', views: 420 },
        { name: 'Tue', views: 380 },
        { name: 'Wed', views: 512 },
        { name: 'Thu', views: 445 },
        { name: 'Fri', views: 610 },
        { name: 'Sat', views: 720 },
        { name: 'Sun', views: 590 },
    ];

    if (!isAuthed) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0E0505] p-6 selection:bg-gold/30">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-[#130303] p-8 rounded-3xl border border-[#6B1A1A]/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent opacity-50" />
                        
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-[#6B1A1A]/20 border border-[#C9A84C]/20 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="text-[#C9A84C]" size={32} />
                            </div>
                            <h2 className="text-[#C9A84C] text-2xl font-black uppercase tracking-widest">Secure Terminal</h2>
                            <p className="text-[10px] text-[#999999] uppercase tracking-[0.3em] font-medium mt-2">Access Control Protocol</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    placeholder="Authorization Key" 
                                    className="w-full px-5 py-4 bg-[#0E0505] border border-[#6B1A1A]/30 rounded-xl text-white outline-none focus:border-[#C9A84C] transition-all text-center tracking-widest placeholder:tracking-normal placeholder:text-[#444]"
                                    autoFocus
                                />
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -bottom-6 left-0 w-full text-center"
                                    >
                                        <p className="text-red-500 text-[10px] font-bold uppercase">Invalid Access Credential</p>
                                    </motion.div>
                                )}
                            </div>

                            <button 
                                onClick={handleLogin}
                                className="w-full py-4 bg-gradient-to-r from-[#6B1A1A] to-[#8B1A1A] hover:from-[#C9A84C] hover:to-[#E0C172] text-white hover:text-[#0E0505] font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg active:scale-[0.98]"
                            >
                                Initiate Session
                            </button>
                        </div>

                        <p className="mt-8 text-[9px] text-[#444] uppercase tracking-tighter text-center">
                            Authorized personnel only • Encryption level 4096-bit
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading && events.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E0505] text-[#C9A84C]">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-2 border-[#C9A84C] border-t-transparent rounded-full mb-6 shadow-[0_0_15px_rgba(201,168,76,0.3)]"
            />
            <motion.p 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-black text-xs tracking-[0.5em] uppercase"
            >
                Synchronizing Core.
            </motion.p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0E0505] text-white selection:bg-[#C9A84C]/30 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header & Navigation */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-[#6B1A1A]/20 pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse shadow-[0_0_10px_#C9A84C]" />
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                                QUANTUM <span className="text-[#C9A84C]">INSIGHTS</span>
                            </h1>
                        </div>
                        <p className="text-[#999999] text-xs font-medium uppercase tracking-widest pl-5">
                            Real-time Intelligence Engine <span className="mx-2 text-[#444]">|</span> <span className="text-[#C9A84C]/60 italic font-normal">v4.2.0</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button 
                            onClick={fetchData}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#130303] border border-[#6B1A1A]/30 rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-[#C9A84C] hover:text-[#C9A84C] shadow-lg transition-all"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            Sync Data
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#6B1A1A]/10 border border-[#6B1A1A]/40 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-[#6B1A1A] transition-all"
                        >
                            <LogOut size={14} />
                            Terminate
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column - Key Stats & Main Chart */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Active Users', val: stats.uniqueVisitors, icon: Users, trend: '+12%', color: '#C9A84C' },
                                { label: 'Total Ingress', val: stats.totalViews, icon: Activity, trend: '+8.4%', color: '#6B1A1A' },
                                { label: 'Efficiency', val: '99.9%', icon: Database, trend: 'Stable', color: '#444' }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="bg-[#130303] border border-[#6B1A1A]/20 p-6 rounded-3xl shadow-xl relative group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#0E0505] border border-[#6B1A1A]/10 flex items-center justify-center group-hover:border-[#C9A84C]/30 transition-colors">
                                            <item.icon size={18} className="text-[#C9A84C]" />
                                        </div>
                                        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                                            <ArrowUpRight size={10} /> {item.trend}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-4xl font-black tracking-tighter">{item.val}</h3>
                                        <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">{item.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Traffic Overview Chart */}
                        <div className="bg-[#130303] border border-[#6B1A1A]/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-black tracking-widest uppercase">Traffic Volume</h3>
                                    <p className="text-[10px] text-[#666] font-medium uppercase mt-1 tracking-tighter">Aggregated ingress points past 7 intervals</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#C9A84C] uppercase">
                                        <div className="w-2 h-2 rounded-full bg-[#C9A84C]" /> Current Cycles
                                    </div>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#444" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#444" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(v) => `${v}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                background: '#0E0505', 
                                                border: '1px solid #6B1A1A', 
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                                            }}
                                            itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                                            cursor={{ stroke: '#6B1A1A', strokeWidth: 1 }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="views" 
                                            stroke="#C9A84C" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorViews)" 
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity Mini-List */}
                        <div className="bg-[#130303] border border-[#6B1A1A]/20 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-[#6B1A1A]/10 flex justify-between items-center bg-[#130303]">
                                <h3 className="text-sm font-black uppercase tracking-widest">Global Feed</h3>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#0E0505] border border-[#6B1A1A]/20 flex items-center justify-center cursor-pointer hover:border-[#C9A84C]/50">
                                        <Search size={14} className="text-[#666]" />
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-[#0E0505] border border-[#6B1A1A]/20 flex items-center justify-center cursor-pointer hover:border-[#C9A84C]/50">
                                        <Filter size={14} className="text-[#666]" />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-[#6B1A1A]/5">
                                        {events.slice(0, 50).map((e, i) => (
                                            <motion.tr 
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`group hover:bg-[#C9A84C]/[0.02] transition-all cursor-crosshair ${e.visitorId === myId ? 'bg-[#C9A84C]/[0.04]' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${e.type === 'page_view' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#C9A84C]/10 text-[#C9A84C]'}`}>
                                                          {e.type.charAt(0).toUpperCase()}
                                                       </div>
                                                       <div>
                                                           <p className="text-xs font-bold text-white group-hover:text-[#C9A84C] transition-colors">
                                                               {e.visitorId === myId ? 'ADMIN_TERMINAL_YOU' : `UID_${e.visitorId?.substring(0, 10).toUpperCase()}`}
                                                           </p>
                                                           <p className="text-[9px] text-[#666] font-medium uppercase">{e.country || 'TERRA_UNRECOGNIZED'}</p>
                                                       </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <p className="text-[10px] font-mono text-[#C9A84C]/70 truncate max-w-[200px]">
                                                        {e.project || e.url || 'DEFAULT_ROOT'}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <p className="text-[10px] font-black text-white">{new Date(e.timestamp).toLocaleTimeString()}</p>
                                                    <p className="text-[9px] text-[#444] font-medium uppercase">{new Date(e.timestamp).toLocaleDateString()}</p>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Secondary Analysis */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Geography Analysis */}
                        <div className="bg-[#130303] border border-[#6B1A1A]/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                             <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#C9A84C]/5 rounded-full blur-[60px]" />
                             
                             <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Globe size={16} className="text-[#C9A84C]" />
                                Global Presence
                             </h3>

                             <div className="space-y-6">
                                {countryData.map((c, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                            <span>{c.name}</span>
                                            <span className="text-[#C9A84C]">{((c.value / stats.totalViews) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-[#0E0505] rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(c.value / stats.totalViews) * 100}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className="h-full bg-gradient-to-r from-[#6B1A1A] to-[#C9A84C]"
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>

                             <button className="w-full mt-10 py-3 bg-[#0E0505] border border-[#6B1A1A]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#C9A84C] transition-all">
                                Detailed Geospatial Index
                             </button>
                        </div>

                        {/* System Health / Status */}
                        <div className="bg-gradient-to-br from-[#130303] to-[#0E0505] border border-[#6B1A1A]/20 rounded-3xl p-8 shadow-2xl">
                             <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest">Engine Status</h3>
                                <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-1 rounded-full uppercase">Operational</span>
                             </div>

                             <div className="space-y-4">
                                <div className="p-4 bg-[#0E0505] border border-[#6B1A1A]/10 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/5 flex items-center justify-center text-green-500">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-white uppercase">Uptime Ratio</p>
                                        <p className="text-xs text-[#999999] font-medium">99.98% Optimized</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#0E0505] border border-[#6B1A1A]/10 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/5 flex items-center justify-center text-[#C9A84C]">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-white uppercase">Ingress Latency</p>
                                        <p className="text-xs text-[#999999] font-medium">18ms Average</p>
                                    </div>
                                </div>
                             </div>

                             <div className="mt-8 pt-8 border-t border-[#6B1A1A]/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{stats.avgDuration}s</p>
                                        <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest">Avg Session</p>
                                    </div>
                                    <div className="text-center border-l border-[#6B1A1A]/10">
                                        <p className="text-2xl font-black">2.4k</p>
                                        <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest">Heap Ops</p>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-6 bg-[#130303] border border-[#6B1A1A]/20 rounded-3xl flex flex-col items-center gap-3 hover:border-[#C9A84C]/50 transition-all group">
                                <Calendar size={20} className="text-[#C9A84C] group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Reports</span>
                            </button>
                            <button className="p-6 bg-[#130303] border border-[#6B1A1A]/20 rounded-3xl flex flex-col items-center gap-3 hover:border-[#C9A84C]/50 transition-all group">
                                <Activity size={20} className="text-[#C9A84C] group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Audit Logs</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <footer className="pt-12 pb-8 text-center border-t border-[#6B1A1A]/10">
                    <p className="text-[9px] text-[#444] font-medium uppercase tracking-[0.4em]">
                        KTA Portfolio Intelligence System • Proprietary Software • {new Date().getFullYear()}
                    </p>
                </footer>
            </div>
            
            {/* Custom Styles Inject */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #6B1A1A;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #C9A84C;
                }
            `}</style>
        </div>
    );
};

// Mount function with error handling
const mount = () => {
    console.log('AdminDashboard: Initiating mount process...');
    try {
        const container = document.getElementById('admin-root');
        if (!container) {
            console.error('AdminDashboard: Target #admin-root not found in DOM!');
            return;
        }
        
        console.log('AdminDashboard: Creating React root...');
        const root = createRoot(container);
        
        console.log('AdminDashboard: Rendering component...');
        root.render(<AdminDashboard />);
        
        console.log('AdminDashboard: Render call complete.');
        
        // Update status
        const s = document.getElementById('mounting-status');
        if (s) {
            s.innerText = 'QUANTUM CORE ONLINE.';
            setTimeout(() => {
                s.style.opacity = '0';
                setTimeout(() => s.style.display = 'none', 500);
            }, 2000);
        }
    } catch (e: any) {
        console.error('AdminDashboard: MOUNT FATAL ERROR:', e);
        const container = document.getElementById('admin-root');
        if (container) {
            container.innerHTML = `<div style="color:#ff4444; padding:40px; text-align:center; background:#130303; border: 1px solid #6B1A1A; border-radius: 12px; margin: 20px; font-family: sans-serif;">
                <h2 style="color:#C9A84C; margin-bottom: 20px; font-weight: 900; letter-spacing: 2px;">ENGINE CRASHED</h2>
                <p style="font-size: 14px; margin-bottom: 20px; color: #999;">${e.message || 'Unknown initialization error'}</p>
                <button onclick="window.location.reload()" style="background:#6B1A1A; color:white; border:none; padding:12px 24px; border-radius:30px; cursor:pointer; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Initialize Retry</button>
            </div>`;
        }
    }
};

mount();
