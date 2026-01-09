import { useEffect, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast'; 
import { 
  Shield, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  HardDrive, 
  Search, 
  LayoutDashboard, 
  ClipboardList, 
  MoreVertical, 
  Monitor, 
  Info,
  ListFilter,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

// --- Interfaces ---
interface USBLog {
  id: number;
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
  total_events: number;
  blocked_events: number;
  authorized_events: number; // Substituindo integridade por Whitelist
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'auditoria' | 'dispositivos' | 'logs'>('dashboard');
  const [logs, setLogs] = useState<USBLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const API_URL = 'http://127.0.0.1:8000/api'; 

  const fetchData = async () => {
    try {
      const logsRes = await axios.get(`${API_URL}/logs/`);
      if (logsRes.data) {
        // Alerta sonoro/visual para novos bloqueios detectados
        if (logs.length > 0 && logsRes.data.length > logs.length && logsRes.data[0].action_taken === 'BLOCKED') {
          toast.error(`BLOQUEIO CRÍTICO: ${logsRes.data[0].device_name}`, {
            duration: 6000,
            style: { background: '#0a0a0f', color: '#ef4444', border: '1px solid #ef444433' },
            icon: <ShieldAlert size={20} className="text-red-500 animate-pulse" />
          });
        }
        setLogs(logsRes.data);
      }
      const statsRes = await axios.get(`${API_URL}/agents/dashboard_stats/`);
      setStats(statsRes.data);
    } catch (e) { 
      console.error("Link SOC Offline");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [logs.length]);

  const filteredLogs = logs.filter(log => 
    log.agent_hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.device_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans bg-[#020617] text-slate-200 flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar - Fixa em Dark Mode */}
      <aside className="w-64 border-r border-slate-800/60 p-6 flex flex-col hidden lg:flex shrink-0 bg-[#030712] shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-12 px-2 group cursor-pointer">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform group-hover:scale-105">
            <Shield size={22} className="text-white" />
          </div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic text-white">SENTINEL</h2>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ShieldAlert size={18}/>} label="Auditoria" active={activeTab === 'auditoria'} onClick={() => setActiveTab('auditoria')} />
          <NavItem icon={<HardDrive size={18}/>} label="Dispositivos" active={activeTab === 'dispositivos'} onClick={() => setActiveTab('dispositivos')} />
          <NavItem icon={<ClipboardList size={18}/>} label="Logs do Sistema" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        </nav>

        <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Proteção Ativa
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-8 md:p-12 max-h-screen overflow-y-auto bg-slate-950/20">
        <header className="flex justify-between items-center mb-10 text-left">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-white">{activeTab.toUpperCase()}</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 border-l border-indigo-500 pl-3">Monitoramento USB em Tempo Real</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" placeholder="Filtrar registros..." 
                className="bg-slate-900/50 border border-slate-800 focus:border-indigo-500 text-white border rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none w-72 transition-all"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={fetchData} className="p-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-xl">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Agentes Ativos" val={stats?.active_agents} trend="+2.4%" icon={<Monitor size={20}/>} color="indigo" />
              <StatCard label="Bloqueios" val={stats?.blocked_events} trend="-15%" icon={<ShieldAlert size={20}/>} color="red" isDown />
              <StatCard label="Eventos (24h)" val={stats?.total_events} trend="+12.1k" icon={<Activity size={20}/>} color="purple" />
              <StatCard label="Whitelist Ativa" val={stats?.authorized_events} trend="+3 novo" icon={<HardDrive size={20}/>} color="emerald" />
            </div>

            {/* Visualizações Operacionais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
              {/* Gráfico de Tendência */}
              <div className="lg:col-span-2 p-8 rounded-[2rem] border bg-[#030712]/60 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-1 text-slate-500">Fluxo de Dados</h3>
                    <p className="text-xl font-black italic tracking-tighter text-white uppercase leading-none mt-1">Histórico de Eventos</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div> OK</div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> BLOCK</div>
                  </div>
                </div>
                
                {/* SVG Area Chart */}
                <div className="h-[200px] w-full relative group">
                  <svg viewBox="0 0 1000 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradIndigo" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'rgb(79, 70, 229)', stopOpacity:0.2}} />
                        <stop offset="100%" style={{stopColor:'rgb(79, 70, 229)', stopOpacity:0}} />
                      </linearGradient>
                    </defs>
                    <path d="M0,180 Q100,140 200,160 T400,120 T600,140 T800,80 T1000,100 L1000,200 L0,200 Z" fill="url(#gradIndigo)" />
                    <path d="M0,180 Q100,140 200,160 T400,120 T600,140 T800,80 T1000,100" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
                    <path d="M0,195 Q150,190 300,180 T600,190 T900,170 T1000,185" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" opacity="0.4" />
                  </svg>
                  <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="border-l border-slate-800/10 h-full"></div>)}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6 text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 font-mono">
                  <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Agora</span>
                </div>
              </div>

              {/* Ranking de Ameaças por Endpoint */}
              <div className="p-8 rounded-[2rem] border bg-slate-900/40 border-slate-800 flex flex-col shadow-xl">
                 <div className="w-full flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Top Terminais em Risco</span>
                    </div>
                    <ListFilter size={16} className="text-slate-600" />
                 </div>
                 
                 <div className="space-y-4 flex-1">
                    {[...new Set(logs.filter(l => l.action_taken === 'BLOCKED').map(l => l.agent_hostname))].slice(0, 5).map((host, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-red-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-600">{idx + 1}</span>
                          <span className="text-xs font-black italic text-white uppercase">{host}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-700" />
                      </div>
                    ))}
                    {logs.filter(l => l.action_taken === 'BLOCKED').length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full opacity-30 italic py-10">
                        <p className="text-[10px] font-black uppercase text-center tracking-widest">Nenhuma ameaça ativa</p>
                      </div>
                    )}
                 </div>

                 <div className="w-full mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-red-500 text-[8px] font-black uppercase mb-0.5 tracking-widest leading-none">Alertas Pendentes</p>
                      <p className="text-white font-black italic text-sm leading-none mt-1">{stats?.blocked_events || 0}</p>
                    </div>
                    <ShieldAlert size={20} className="text-red-500/50" />
                 </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="p-8 rounded-[2rem] border bg-[#030712]/40 border-slate-800 shadow-2xl text-left">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] italic">Análise de Fluxo Recente</h3>
                <button onClick={() => setActiveTab('auditoria')} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">Ver Auditoria Completa</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {logs.slice(0, 4).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between group p-4 bg-slate-900/30 hover:bg-slate-800/50 rounded-2xl transition-all border border-slate-800/50 hover:border-indigo-500/30">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${log.action_taken === 'BLOCKED' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {log.action_taken === 'BLOCKED' ? <ShieldAlert size={18}/> : <Activity size={18}/>}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase italic text-white tracking-tight leading-none">{log.agent_hostname}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[150px] mt-1.5 leading-none">{log.device_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter leading-none">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 block ${log.action_taken === 'BLOCKED' ? 'text-red-400' : 'text-emerald-400'}`}>{log.action_taken === 'BLOCKED' ? 'BLOQUEADO' : 'AUTORIZADO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUDITORIA VIEW (TABELA) */}
        {activeTab === 'auditoria' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="border rounded-[3rem] overflow-hidden shadow-2xl bg-[#030712]/40 border-slate-800">
              <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><ClipboardList size={20}/></div>
                  <div>
                    <h3 className="font-black text-white uppercase text-sm tracking-[0.2em] italic leading-none">Telemetria SOC</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">Base de eventos filtrada em tempo real</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[9px] uppercase font-black border-b bg-slate-900/50 text-slate-500 border-slate-800">
                    <tr>
                      <th className="px-10 py-7 tracking-[0.2em]">Terminal / Identidade</th>
                      <th className="px-10 py-7 tracking-[0.2em]">Operador</th>
                      <th className="px-10 py-7 tracking-[0.2em]">Especificações</th>
                      <th className="px-10 py-7 text-right tracking-[0.2em]">Estado de Rede</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="transition-all hover:bg-slate-800/30 group">
                        <td className="px-10 py-7">
                          <div className="flex flex-col text-left leading-none">
                            <span className="text-base font-black tracking-tight italic uppercase text-white group-hover:text-indigo-400 transition-colors leading-none">{log.agent_hostname}</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-500/80 mt-2 tracking-widest">{log.ip_address}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-left">
                          <span className="text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-tighter bg-slate-800/40 text-slate-300 border-slate-800 leading-none">{log.username}</span>
                        </td>
                        <td className="px-10 py-7 text-left">
                          <div className="flex flex-col max-w-[280px] leading-none">
                            <span className="text-xs font-black italic uppercase truncate text-slate-300 leading-none">{log.device_name}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-600 truncate mt-1.5 tracking-tighter leading-none">{log.device_id}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase border shadow-2xl ${
                            log.action_taken === 'BLOCKED' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                          }`}>
                            {log.action_taken === 'BLOCKED' ? 'BLOQUEADO' : 'AUTORIZADO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DISPOSITIVOS VIEW (GRID) */}
        {activeTab === 'dispositivos' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {logs.slice(0, 9).map((log, i) => (
                 <DeviceCard key={i} log={log} />
               ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER INFO */}
      <div className="fixed bottom-6 right-8 px-5 py-2.5 rounded-2xl border border-slate-800 bg-[#030712]/90 backdrop-blur-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl">
         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
         Proteção de Sistema Ativa
         <Info size={12} className="ml-2 text-indigo-400 opacity-50" />
      </div>
    </div>
  );
}

// --- Componentes Refinados ---

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'}`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ label, val, color, trend, icon, isDown }: { label: string, val: any, color: string, trend: string, icon: any, isDown?: boolean }) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5',
    red: 'text-red-500 border-red-500/20 bg-red-500/5',
    purple: 'text-purple-500 border-purple-500/20 bg-purple-500/5',
    emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  };

  return (
    <div className="p-7 rounded-[2.5rem] border bg-[#030712]/60 border-slate-800 hover:border-slate-700 transition-all relative group overflow-hidden text-left shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${isDown ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic opacity-80 leading-none">{label}</p>
      <h3 className="text-3xl font-black italic tracking-tighter tabular-nums text-white leading-none mt-2">{val ?? '---'}</h3>
      
      <div className="mt-6 h-8 opacity-40">
        <svg viewBox="0 0 100 20" className="w-full h-full fill-none stroke-[3]">
          <path d={isDown ? "M0,5 L20,15 L40,10 L60,18 L80,5 L100,15" : "M0,15 L20,5 L40,10 L60,2 L80,12 L100,5"} stroke={isDown ? '#ef4444' : '#10b981'} />
        </svg>
      </div>
    </div>
  );
}

function DeviceCard({ log }: { log: USBLog }) {
  const isBlocked = log.action_taken === 'BLOCKED';
  return (
    <div className="p-8 rounded-[2.5rem] border bg-[#030712]/60 border-slate-800 hover:border-indigo-500/40 transition-all group shadow-2xl text-left">
      <div className="flex justify-between mb-6">
        <div className={`p-4 rounded-3xl shadow-xl border ${isBlocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
          <HardDrive size={24} />
        </div>
        <button className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors"><MoreVertical size={20} className="text-slate-500" /></button>
      </div>
      <h4 className="text-xl font-black italic uppercase tracking-tight truncate leading-none mb-1 text-white">{log.device_name}</h4>
      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border tracking-tighter ${isBlocked ? 'text-red-400 border-red-500/30 bg-red-900/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20'}`}>
        {isBlocked ? 'BLOQUEADO' : 'AUTORIZADO'}
      </span>
      
      <div className="mt-8 space-y-3 pt-6 border-t border-slate-800">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500 font-black uppercase italic tracking-widest leading-none">Serial ID</span>
          <span className="text-slate-300 font-mono font-bold tracking-widest truncate max-w-[120px] leading-none">{log.device_id}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500 font-black uppercase italic tracking-widest leading-none">Endpoint</span>
          <span className="text-indigo-500 font-black italic tracking-tight leading-none">{log.agent_hostname}</span>
        </div>
      </div>
      
      <button className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${isBlocked ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white'}`}>
        {isBlocked ? 'Autorizar' : 'Revogar Acesso'}
      </button>
    </div>
  );
}

export default App;