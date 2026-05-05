import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Users, Eye, Globe, Clock, LayoutDashboard, Database } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb } from './firebase-init.js';

console.log('AdminDashboard: Script execution started');

// Update status directly from JS
try {
    const s = document.getElementById('mounting-status');
    if (s) s.innerText = 'REACT ENGINE ACTIVATED...';
    console.log('AdminDashboard: Pre-mount status updated to ACTIVATED');
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
    console.log('AdminDashboard: Component Render Loop Started');
    // Safe storage helper
    const getSafe = (key: string, type: 'local' | 'session' = 'local') => {
        try {
            return (type === 'local' ? localStorage : sessionStorage).getItem(key);
        } catch (e) { return null; }
    };

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

    const myId = getSafe('kta_visitor_id');

    const handleLogin = () => {
        if (password === '1a2s3d_komal') {
            try {
                sessionStorage.setItem('kta_admin_authed', 'true');
            } catch (e) {}
            setIsAuthed(true);
        } else {
            setError(true);
        }
    };

    useEffect(() => {
        if (!isAuthed) {
            setLoading(false);
            return;
        }
        
    const fetchData = async () => {
        console.log('Dashboard: Fetching data...');
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
            console.error('Dashboard: Fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();

        const timer = setTimeout(() => {
            console.warn('Dashboard: Safety timeout reached');
            setLoading(false);
        }, 8000);
        return () => clearTimeout(timer);
    }, [isAuthed]);

    const handleLogout = () => {
        try {
            sessionStorage.removeItem('kta_admin_authed');
            setIsAuthed(false);
        } catch (e) {}
    };

    if (!isAuthed) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0E0505]">
                <div className="bg-[#130303] p-10 rounded-2xl border border-maroon-light w-full max-w-sm text-center shadow-2xl">
                    <h2 className="text-gold text-2xl font-black mb-6 uppercase tracking-widest">Admin Access</h2>
                    <p className="text-xs text-gold/40 mb-4 uppercase">KTA. STUDIO INSIGHTS</p>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Enter Password" 
                        className="w-full p-3 bg-[#0E0505] border border-maroon-light rounded-lg text-white mb-4 outline-none focus:border-gold transition-colors text-center"
                        autoFocus
                    />
                    <button 
                        onClick={handleLogin}
                        className="w-full py-3 bg-maroon hover:bg-gold text-white hover:text-black font-bold rounded-lg transition-all"
                    >
                        LOGIN
                    </button>
                    {error && <p className="text-red-500 mt-4 text-sm font-bold animate-shake">INVALID ACCESS KEY</p>}
                </div>
            </div>
        );
    }

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
            avgDuration: 42, 
            topCountry: top ? top[0] : 'None'
        });
    };

    const countryMap = events.reduce((acc: Record<string, number>, e) => {
        if (e.country) acc[e.country] = (acc[e.country] || 0) + 1;
        return acc;
    }, {});

    const countryData = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => (b.value as number) - (a.value as number));

    const timeData = [
        { name: 'Mon', views: 40 },
        { name: 'Tue', views: 30 },
        { name: 'Wed', views: 20 },
        { name: 'Thu', views: 27 },
        { name: 'Fri', views: 18 },
        { name: 'Sat', views: 23 },
        { name: 'Sun', views: 34 },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E0505] text-gold">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black tracking-widest animate-pulse">SYNCHRONIZING ANALYTICS...</p>
        </div>
    );

    if (!myId) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E0505] text-gold text-center p-8">
            <Database size={48} className="mb-4 opacity-50" />
            <h2 className="text-2xl font-black mb-2">VISITOR ID MISSING</h2>
            <p className="text-text-muted mb-6">You must visit the <a href="/" className="text-gold underline">home page</a> first to initialize your tracking ID.</p>
            <button onClick={() => window.location.href = '/'} className="px-6 py-2 border border-gold rounded-full font-bold hover:bg-gold hover:text-black transition-all">
                GO HOME
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 admin-view">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-maroon-light pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">AUDIENCE <span className="text-gold">INSIGHTS</span></h1>
                    <p className="text-text-muted mt-2">Private tracking for KTA. Studio | <span className="text-gold/60 text-[10px] bg-black/40 px-2 py-1 rounded">YOUR ID: {myId}</span></p>
                </div>
                <div className="flex gap-4">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-maroon-light/20 border border-maroon-light rounded-full text-xs font-bold hover:border-gold transition-all"
                    >
                      REFRESH
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 border border-maroon rounded-full text-xs font-bold hover:border-gold transition-all"
                    >
                      LOGOUT
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-bg-card border border-maroon-light p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Users size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Visitors</span>
                    </div>
                    <div className="text-4xl font-black">{stats.uniqueVisitors}</div>
                    <div className="text-xs text-text-muted mt-2">Unique users this week</div>
                </div>
                <div className="bg-bg-card border border-maroon-light p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Eye size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Views</span>
                    </div>
                    <div className="text-4xl font-black">{stats.totalViews}</div>
                    <div className="text-xs text-text-muted mt-2">Total page impressions</div>
                </div>
                <div className="bg-bg-card border border-maroon-light p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Globe size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Top Market</span>
                    </div>
                    <div className="text-4xl font-black">{stats.topCountry}</div>
                    <div className="text-xs text-text-muted mt-2">Highest reach region</div>
                </div>
                <div className="bg-bg-card border border-maroon-light p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Clock size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Avg. Stay</span>
                    </div>
                    <div className="text-4xl font-black">{stats.avgDuration}s</div>
                    <div className="text-xs text-text-muted mt-2">Mean session length</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-bg-card border border-maroon-light p-8 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Database size={18} className="text-gold" />
                        WEEKLY TRAFFIC
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip 
                                  contentStyle={{ background: '#130303', border: '1px solid #6B1A1A' }}
                                  itemStyle={{ color: '#C9A84C' }}
                                />
                                <Line type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: '#C9A84C' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-bg-card border border-maroon-light p-8 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Globe size={18} className="text-gold" />
                        GLOBAL REACH
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip 
                                  contentStyle={{ background: '#130303', border: '1px solid #6B1A1A' }}
                                  itemStyle={{ color: '#C9A84C' }}
                                />
                                <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-bg-card border border-maroon-light rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-maroon-light bg-bg-secondary/50">
                    <h3 className="text-lg font-bold">RECENT ACTIVITY</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-tighter text-text-muted bg-black/20">
                                <th className="p-4 font-black">Visitor ID</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Location</th>
                                <th className="p-4 font-black">Info / Project</th>
                                <th className="p-4 font-black">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-maroon-light/50">
                            {events.map((e, i) => (
                                <tr key={i} className={`hover:bg-white/5 transition-colors ${e.visitorId === myId ? 'bg-gold/5' : ''}`}>
                                    <td className="p-4">
                                        <code className="text-[10px] text-gold/80">{e.visitorId === myId ? 'YOU (Admin)' : e.visitorId?.substring(0, 8) + '...'}</code>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${e.type === 'page_view' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold/10 text-gold'}`}>
                                            {e.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium">{e.country}</td>
                                    <td className="p-4 text-sm text-text-light">{e.project || e.url}</td>
                                    <td className="p-4 text-xs text-text-muted">{new Date(e.timestamp).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Mount function with error handling
const mount = () => {
    console.log('Attempting to mount dashboard...');
    try {
        const container = document.getElementById('admin-root');
        if (!container) return;
        const root = createRoot(container);
        root.render(<AdminDashboard />);
    } catch (e: any) {
        console.error('Mounting error:', e);
        const container = document.getElementById('admin-root');
        if (container) {
            container.innerHTML = `<div style="color:red; padding:40px; text-align:center;">
                <h2 style="color:var(--gold)">DASHBOARD ERROR</h2>
                <p>${e.message}</p>
                <button onclick="window.location.reload()" style="background:#6B1A1A; color:white; border:none; padding:10px 20px; border-radius:8px; margin-top:20px; cursor:pointer;">RETRY</button>
            </div>`;
        }
    }
};

mount();
