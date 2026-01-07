import { useEffect, useState } from 'react';
import axios from 'axios';
import type { AxiosResponse } from 'axios'; // Correção crítica aqui
import { 
  Shield, 
  ShieldAlert, 
  Activity, 
  Unlock, 
  BarChart3,
  Terminal,
  Monitor,
  Settings,
  Database,
  UserCheck,
  Cpu,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// --- Tipagens (Interfaces) ---
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
  risk_level?: 'LOW' | 'HIGH' | 'CRITICAL';
}

interface Stats {
  active_agents: number;
  total_agents: number;
  total_events: number;
  blocked_events: number;
  authorized_events: number;
  integrity_score: number;
}

interface WhitelistItem {
  id: number;
  device_id: string;
  device_name: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');
  const [logs, setLogs] = useState<USBLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [whitelistIds, setWhitelistIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const API_URL = 'http://127.0.0.1:8000/api'; 

  const fetchData = async () => {
    try {
      // 1. Busca os Logs
      const logsRes: AxiosResponse<USBLog[]> = await axios.get(`${API_URL}/logs/`);
      if (logsRes.data) setLogs(logsRes.data);

      // 2. Busca as Estatísticas (KPIs)
      try {
        const statsRes: AxiosResponse<Stats> = await axios.get(`${API_URL}/agents/dashboard_stats/`);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.warn("Aviso: Falha nas estatísticas. Verifique o endpoint dashboard_stats.");
      }

      // 3. Busca a Whitelist
      try {
        const whitelistRes: AxiosResponse<WhitelistItem[]> = await axios.get(`${API_URL}/whitelist/`);
        if (whitelistRes.data) {
          setWhitelistIds(whitelistRes.data.map((item) => item.device_id));
        }
      } catch (err) {
        console.warn("Aviso: Falha na Whitelist.");
      }
      
      setConnectionError(null);
    } catch (error: any) {
      const specificError = error.response 
        ? `Erro API ${error.response.status}: ${error.message}`
        : "Servidor Offline. Verifique o terminal do Django.";
      
      setConnectionError(specificError);
    }
  };

  const authorizeDevice = async (deviceId: string, deviceName: string) => {
    try {
      await axios.post(`${API_URL}/whitelist/`, {
        device_id: deviceId,
        device_name: deviceName,
        description: "Autorizado via Dashboard Sentinel PRO"
      });
      fetchData(); 
    } catch (error: any) {
      console.error("Erro ao autorizar hardware:", error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const refreshManually = () => {
    setIsRefreshing(true);
    fetchData().finally(() => setTimeout(() => setIsRefreshing(false), 600));
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString();
    } catch {
      return "--:--:--";
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 border-r border-slate-800/60 p-6 flex flex-col gap-8 bg-[#020617] hidden md:flex">
        <div className="flex items-center gap-3 px-2 group cursor-pointer transition-transform duration-300 active:scale-95">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:rotate-[360deg] transition-all duration-700">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-tight tracking-[0.2em] transition-all group-hover:text-indigo-400 uppercase">SENTINEL</h2>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'overview' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 hover:pl-6'}`}
          >
            <BarChart3 size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Visão Geral</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'logs' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 hover:pl-6'}`}
          >
            <Database size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Auditoria</span>
          </button>
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 mb-2">Segurança</p>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 text-xs font-bold transition-all text-left"><Monitor size={14} className="inline mr-2"/> AGENTES</button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 text-xs font-bold transition-all text-left"><Settings size={14} className="inline mr-2"/> POLÍTICAS</button>
          </div>
        </nav>

        <div className="mt-auto p-4 bg-slate-900/40 border border-slate-800 rounded-2xl group cursor-pointer hover:bg-slate-800/60 transition-all border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-500 border border-indigo-600/30">
              <UserCheck size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">LzzAG Admin</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter italic">Root Authority</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto scrollbar-hide">
        
        {connectionError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={20} />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">Falha de Link SOC</span>
                <span className="text-[10px] font-mono opacity-80">{connectionError}</span>
              </div>
            </div>
            <button 
              onClick={refreshManually}
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-500 text-[10px] font-black uppercase rounded-lg transition-all"
            >
              Reconectar
            </button>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic drop-shadow-sm">
              {activeTab === 'logs' ? 'Centro de Auditoria' : 'Sentinel SOC Dashboard'}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium border-l-2 border-indigo-600 pl-3">Monitoramento em tempo real.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={refreshManually} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-indigo-400 transition-all active:scale-90 group shadow-lg">
              <RefreshCw size={20} className={`text-slate-400 group-hover:text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-10 w-[1px] bg-slate-800"></div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
              <Download size={16} /> GERAR PDF
            </button>
          </div>
        </header>

        {/* --- CARDS KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl group hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg text-indigo-400 group-hover:rotate-12 transition-transform shadow-inner"><Monitor size={20}/></div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Link</span>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Agentes</p>
              <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter">{stats?.active_agents ?? '---'}</h3>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl group hover:border-red-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg text-red-500"><ShieldAlert size={20}/></div>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Bloqueios</p>
              <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter">{stats?.blocked_events ?? '---'}</h3>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl group hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg text-purple-500"><Activity size={20}/></div>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Requisições</p>
              <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter">{stats?.total_events ?? '---'}</h3>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl group hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-500"><Cpu size={20}/></div>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Integridade</p>
              <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter">{stats?.integrity_score ?? '---'}%</h3>
          </div>
        </div>

        {/* --- TABELA --- */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all hover:shadow-indigo-500/5">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/10 rounded-lg"><Terminal size={18} className="text-indigo-500" /></div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs italic">Logs de Telemetria</h3>
            </div>
          </div>

          <div className="overflow-x-auto h-[500px] scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-800/50">
                <tr>
                  <th className="px-6 py-5">Endpoint (IP)</th>
                  <th className="px-6 py-5">Usuário Ativo</th>
                  <th className="px-6 py-5">Dispositivo</th>
                  <th className="px-6 py-5">Ação</th>
                  <th className="px-6 py-5 text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {!logs || logs.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw size={32} className="text-indigo-500/20 animate-spin mx-auto" />
                          <p className="text-slate-600 font-mono text-[10px] uppercase italic tracking-widest">Aguardando telemetria...</p>
                        </div>
                     </td>
                   </tr>
                ) : logs.map((log) => {
                  const isWhitelisted = log?.device_id && whitelistIds.includes(log.device_id);
                  return (
                    <tr key={log.id} className="hover:bg-indigo-600/[0.04] transition-all group border-l-2 border-transparent hover:border-indigo-500">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">{log.agent_hostname || "Desconhecido"}</span>
                          <span className="text-[10px] font-mono text-slate-500 tracking-widest">{log.ip_address || '0.0.0.0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700/50">
                            <UserCheck size={14} className="text-slate-500 group-hover:text-indigo-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{log.username || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="text-[11px] font-black text-white uppercase truncate italic">{log.device_name || "Hardware USB"}</span>
                          <span className="text-[9px] font-mono text-slate-600 tracking-tighter truncate opacity-60">{log.device_id || "ID-MISSING"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                          log.action_taken === 'BLOCKED' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                        }`}>
                          {log.action_taken || "PENDENTE"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {log.action_taken === 'BLOCKED' && !isWhitelisted ? (
                          <button 
                            onClick={() => authorizeDevice(log.device_id, log.device_name)}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
                          >
                            <Unlock size={14} /> Liberar
                          </button>
                        ) : isWhitelisted ? (
                          <span className="text-indigo-400 text-[10px] font-black italic tracking-[0.2em] border border-indigo-400/20 px-3 py-1.5 rounded-xl bg-indigo-400/5 shadow-inner">
                            AUTHORIZED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono uppercase font-bold tracking-tighter">
                            {formatTime(log.timestamp)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Indicador Global */}
      <div className="fixed bottom-6 right-6 px-6 py-3 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl backdrop-blur-2xl flex items-center gap-3 shadow-2xl transition-all hover:border-indigo-500/50 group cursor-default">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]"></div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] group-hover:tracking-[0.35em] transition-all">SOC Operational</span>
      </div>
    </div>
  );
}

export default App;