import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Users, Eye, Globe, Clock, LayoutDashboard, Database } from 'lucide-react';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        topCountry: 'None'
    });

    // Mock data for initial preview / fallback
    const mockEvents = [
        { type: 'page_view', country: 'Pakistan', timestamp: new Date().toISOString() },
        { type: 'page_view', country: 'United States', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { type: 'project_click', project: 'ABYSSAL', country: 'Pakistan', timestamp: new Date().toISOString() },
        { type: 'page_view', country: 'United Kingdom', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Initialize Firebase
                const { db: getFirebaseDb } = await import('./firebase-init.js');
                const { db } = await getFirebaseDb();
                
                if (db) {
                    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
                    const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(1000));
                    const snapshot = await getDocs(q);
                    const cloudEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    setEvents(cloudEvents);
                    processStats(cloudEvents);
                } else {
                    // Fallback to local if no Firebase
                    const localData = localStorage.getItem('kta_analytics_local');
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        setEvents(parsed);
                        processStats(parsed);
                    }
                }
                setLoading(false);
            } catch (e) {
                console.warn('Dashboard fetch error:', e);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const processStats = (data) => {
        const uniqueIps = new Set(data.map(e => e.visitorId || 'anon'));
        const countries = {};
        data.forEach(e => {
            if (e.country) countries[e.country] = (countries[e.country] || 0) + 1;
        });
        
        const top = Object.entries(countries).sort((a,b) => b[1] - a[1])[0];

        setStats({
            totalViews: data.filter(e => e.type === 'page_view').length,
            uniqueVisitors: uniqueIps.size,
            avgDuration: 42, // Mock average
            topCountry: top ? top[0] : 'None'
        });
    };

    const countryData = Object.entries(
        events.reduce((acc, e) => {
            if (e.country) acc[e.country] = (acc[e.country] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const timeData = [
        { name: 'Mon', views: 40 },
        { name: 'Tue', views: 30 },
        { name: 'Wed', views: 20 },
        { name: 'Thu', views: 27 },
        { name: 'Fri', views: 18 },
        { name: 'Sat', views: 23 },
        { name: 'Sun', views: 34 },
    ];

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Analytics Data...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center border-b border-maroon-light pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white">AUDIENCE <span className="text-gold">INSIGHTS</span></h1>
                    <p className="text-text-muted mt-2">Private tracking for KTA. Studio</p>
                </div>
                <button 
                  onClick={() => { sessionStorage.clear(); window.location.reload(); }}
                  className="px-4 py-2 border border-maroon rounded-full text-xs font-bold hover:border-gold transition-all"
                >
                  LOGOUT
                </button>
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
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Location</th>
                                <th className="p-4 font-black">Info / Project</th>
                                <th className="p-4 font-black">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-maroon-light/50">
                            {events.map((e, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
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

// Mount the app
const container = document.getElementById('admin-root');
const root = createRoot(container);
root.render(<AdminDashboard />);
