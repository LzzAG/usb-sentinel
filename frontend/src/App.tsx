import { useEffect, useState } from 'react';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Shield, 
  ShieldAlert, 
  Activity, 
  Terminal,
  Monitor,
  Cpu,
  RefreshCw,
  HardDrive,
  Search,
  LayoutDashboard,
  ClipboardList,
  ArrowRight
} from 'lucide-react';

// --- Interfaces ---
interface USBLog {
  id: number;
  agent: number;
  agent_hostname: string;
  device_name: string;
  device_id: string;
  action_taken: string;
  username: string;
  ip_address: string;
  timestamp: string;
}

interface Stats {
  active_agents: number;
  total_agents: number;
  total_events: number;
  blocked_events: number;
  authorized_events: number;
  integrity_score: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'auditoria' | 'dispositivos' | 'logs'>('dashboard');
  const [logs, setLogs] = useState<USBLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const API_URL = 'http://127.0.0.1:8000/api'; 

  const fetchData = async () => {
    try {
      const logsRes: AxiosResponse<USBLog[]> = await axios.get(`${API_URL}/logs/`);
      if (logsRes.data) {
        if (logs.length > 0 && logsRes.data.length > logs.length) {
          const latestLog = logsRes.data[0]; 
          if (latestLog.action_taken === 'BLOCKED') {
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'} max-w-md w-full bg-[#030712] border border-red-900/50 border-l-4 border-l-red-600 shadow-2xl pointer-events-auto flex p-4 rounded-xl`}>
                <div className="flex-1">
                  <div className="flex items-start">
                    <ShieldAlert className="h-10 w-10 text-red-600 animate-pulse flex-shrink-0" />
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-black text-white tracking-widest uppercase italic">Invasão Detectada</p>
                      <p className="mt-1 text-xs font-bold text-red-400 uppercase">{latestLog.device_name}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <Monitor size={12} /> {latestLog.agent_hostname} <ArrowRight size={10} /> BLOQUEIO ATIVO
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => toast.dismiss(t.id)} className="flex border-l border-white/5 pl-4 ml-4 items-center text-[10px] font-black text-slate-600 hover:text-white uppercase">Fechar</button>
              </div>
            ), { duration: 5000 });
          }
        }
        setLogs(logsRes.data);
      }
      const statsRes = await axios.get(`${API_URL}/agents/dashboard_stats/`);
      setStats(statsRes.data);
    } catch (error) { console.error("SOC link offline"); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [logs.length]);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString();
    } catch { return "--:--:--"; }
  };

  const filteredLogs = logs.filter(log => 
    log.agent_hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip_address.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar - Fixa nas 4 abas solicitadas */}
      <aside className="w-72 border-r border-slate-800/40 p-6 flex flex-col gap-10 bg-[#030712] hidden lg:flex shadow-2xl">
        <div className="flex items-center gap-4 px-2">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[0_0_25px_rgba(79,70,229,0.3)]">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter leading-none">SENTINEL</h2>
        </div>

        <nav className="flex flex-col gap-3">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ShieldAlert size={20}/>} label="Auditoria" active={activeTab === 'auditoria'} onClick={() => setActiveTab('auditoria')} />
          <NavItem icon={<HardDrive size={20}/>} label="Dispositivos" active={activeTab === 'dispositivos'} onClick={() => setActiveTab('dispositivos')} />
          <NavItem icon={<ClipboardList size={20}/>} label="Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        </nav>

        <div className="mt-auto p-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SOC Ativo</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 max-h-screen overflow-y-auto bg-slate-950">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
              {activeTab}
            </h1>
            <p className="text-slate-400 text-lg border-l-4 border-indigo-600 pl-4 mt-2 font-semibold uppercase opacity-80">SOC Terminal Control</p>
          </div>
          <button onClick={() => fetchData()} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl hover:border-indigo-500 transition-all">
            <RefreshCw size={24} className="text-slate-400" />
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard label="Agentes" val={stats?.active_agents} icon={<Monitor size={22}/>} color="text-indigo-400" />
            <StatCard label="Bloqueios" val={stats?.blocked_events} icon={<ShieldAlert size={22}/>} color="text-red-400" />
            <StatCard label="Eventos" val={stats?.total_events} icon={<Activity size={22}/>} color="text-purple-400" />
            <StatCard label="Integridade" val={`${stats?.integrity_score}%`} icon={<Cpu size={22}/>} color="text-emerald-400" />
          </div>
        )}

        {/* Tabela de Telemetria SOC */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-4 text-indigo-400">
              <Terminal size={24} />
              <h3 className="font-black text-white uppercase text-sm tracking-[0.3em] italic leading-none">Telemetria SOC</h3>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar registro..." 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-indigo-500 outline-none transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] scrollbar-hide">
            <table className="w-full text-left">
              <thead className="bg-[#020617] text-slate-500 text-xs uppercase font-black border-b border-slate-800">
                <tr>
                  <th className="px-10 py-7">ENDPOINT / IP</th>
                  <th className="px-10 py-7">USUÁRIO</th>
                  <th className="px-10 py-7">DISPOSITIVO</th>
                  <th className="px-10 py-7">HORÁRIO</th>
                  <th className="px-10 py-7 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-600/[0.08] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">{log.agent_hostname}</span>
                        <span className="text-lg font-mono font-bold text-indigo-500 mt-2 tracking-widest">{log.ip_address}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="text-sm font-black text-slate-300 uppercase tracking-wider">{log.username}</span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col max-w-[280px]">
                        <span className="text-base font-black text-white uppercase truncate italic leading-none">{log.device_name}</span>
                        <span className="text-[11px] font-mono font-bold text-slate-600 truncate mt-1">{log.device_id}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-sm text-slate-400 font-mono font-bold italic tracking-widest">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase border shadow-2xl ${
                        log.action_taken === 'BLOCKED' ? 'text-red-400 border-red-500/40 bg-red-900/30 shadow-red-900/20' : 'text-emerald-400 border-emerald-500/40 bg-emerald-900/30 shadow-emerald-900/20'
                      }`}>
                        {log.action_taken}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponente NavItem
function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
      {icon} {label}
    </button>
  );
}

// Subcomponente StatCard
function StatCard({ label, val, icon, color }: { label: string, val: any, icon: any, color: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] shadow-2xl transition-all group">
      <div className={`p-4 w-fit bg-slate-800/60 rounded-2xl mb-4 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter tabular-nums">{val ?? '---'}</h3>
    </div>
  );
}

export default App;