import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Activity, 
  Server, 
  Search, 
  Usb, 
  AlertCircle, 
  CheckCircle2,
  Cpu,
  Zap
} from 'lucide-react';

interface Agent {
  id: number;
  hostname: string;
  ip_address: string;
  os: string;
}

interface USBLog {
  id: number;
  agent: number;
  device_name: string;
  device_id: string;
  action_taken: string;
  timestamp: string;
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<USBLog[]>([]);
  
  const API_URL = 'http://localhost:8000/api';

  const fetchData = async () => {
    try {
      const agentsRes = await axios.get(`${API_URL}/agents/`);
      const logsRes = await axios.get(`${API_URL}/logs/`);
      setAgents(agentsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* --- NAVBAR: Glassmorphism & Sticky --- */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75 blur transition duration-500 group-hover:opacity-100"></div>
            <div className="relative bg-slate-950 p-2 rounded-xl border border-slate-800">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              USB Sentinel <span className="text-indigo-500">PRO</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">DevSecOps Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Status Indicator com Pulse */}
           <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
             <span className="text-xs font-medium text-emerald-400 tracking-wide">SYSTEM ONLINE</span>
           </div>
           
           {/* Profile Avatar */}
           <div className="h-9 w-9 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-inner hover:scale-105 transition-transform cursor-pointer ring-2 ring-transparent hover:ring-indigo-500/50">
             <span className="text-xs font-bold text-slate-200">LZ</span>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* --- KPI CARDS: Hover, Scale & Glow --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/60 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-medium group-hover:text-blue-400 transition-colors">Agentes Ativos</h3>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Server className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:translate-x-1 transition-transform">{agents.length}</p>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-2/3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/60 hover:shadow-xl hover:shadow-purple-900/10 hover:border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-medium group-hover:text-purple-400 transition-colors">Total de Eventos</h3>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:translate-x-1 transition-transform">{logs.length}</p>
             <div className="mt-4 flex gap-1">
               {[1,2,3,4,5].map((i) => (
                 <div key={i} className={`h-1 flex-1 rounded-full ${i < 4 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-slate-800'}`}></div>
               ))}
             </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/60 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-medium group-hover:text-emerald-400 transition-colors">Integridade</h3>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">100%</p>
            <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Rede Segura
            </p>
          </div>
        </div>

        {/* --- GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table: Modern & Clean */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm flex flex-col h-[600px]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Usb className="h-5 w-5 text-indigo-400" />
                Auditoria de Dispositivos
              </h2>
              <div className="relative group">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filtrar logs..." 
                  className="bg-slate-950/50 border border-slate-700 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-300 w-48 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-6 py-4 w-32">Status</th>
                    <th className="px-6 py-4">Detalhes do Hardware</th>
                    <th className="px-6 py-4 text-right">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-800/40 transition-colors duration-200">
                      <td className="px-6 py-4">
                        {log.action_taken === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                             <AlertCircle className="h-3 w-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                             <CheckCircle2 className="h-3 w-3" /> Detected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200 font-medium group-hover:text-white transition-colors">
                          {log.device_name || "Dispositivo Desconhecido"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono group-hover:border-slate-700 transition-colors truncate max-w-[200px]">
                            {log.device_id.split('\\').pop() || log.device_id}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 tabular-nums text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar - Agents: List Style */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-sm h-fit backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                 <Cpu className="h-4 w-4 text-purple-400" />
                 Rede Monitorada
              </h2>
            </div>
            
            <div className="p-4 space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="group relative overflow-hidden bg-slate-950/50 border border-slate-800 rounded-xl p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-900 cursor-pointer">
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{agent.hostname}</p>
                        <p className="text-xs text-slate-500 font-mono">{agent.ip_address}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Online</span>
                      </div>
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-500">{agent.os}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {agents.length === 0 && (
                 <div className="text-center py-8">
                    <div className="inline-block p-3 rounded-full bg-slate-800 mb-2">
                       <Server className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">Nenhum agente conectado.</p>
                 </div>
              )}
            </div>
            
            <div className="bg-slate-950/80 px-6 py-3 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
              SYNC_STATUS: <span className="text-emerald-500">CONNECTED</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;