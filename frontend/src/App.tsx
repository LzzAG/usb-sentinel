import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, Usb, AlertCircle, CheckCircle2, PlusCircle 
} from 'lucide-react';

interface USBLog {
  id: number;
  agent: number;
  device_name: string;
  device_id: string;
  action_taken: string;
  timestamp: string;
}

function App() {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState<USBLog[]>([]);
  const [whitelistIds, setWhitelistIds] = useState<string[]>([]);
  
  // Alterado para 127.0.0.1 para evitar problemas de resolução de nome
  const API_URL = 'http://127.0.0.1:8000/api'; 

  const fetchData = async () => {
    try {
      // 1. Busca os Agentes
      const agentsRes = await axios.get(`${API_URL}/agents/`);
      setAgents(agentsRes.data);

      // 2. Busca os Logs e ordena pelo mais recente (ID decrescente)
      const logsRes = await axios.get(`${API_URL}/logs/`);
      const sortedLogs = logsRes.data.sort((a: any, b: any) => b.id - a.id);
      setLogs(sortedLogs);

      // 3. Busca a Whitelist
      const whitelistRes = await axios.get(`${API_URL}/whitelist/`);
      setWhitelistIds(whitelistRes.data.map((item: any) => item.device_id));
      
    } catch (error) {
      console.error("SOC_ERROR: Falha na conexão com a API central.");
    }
  };

  const authorizeDevice = async (deviceId: string, deviceName: string) => {
    try {
      await axios.post(`${API_URL}/whitelist/`, {
        device_id: deviceId,
        device_name: deviceName,
        description: "Autorizado via Dashboard PRO"
      });
      fetchData();
    } catch (error) {
      alert("Erro ao autorizar. Verifique se o dispositivo já está na lista.");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll de 2 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-indigo-500" />
          <h1 className="font-bold text-xl text-white tracking-tighter">USB SENTINEL <span className="text-indigo-500 font-black">PRO</span></h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-emerald-500 uppercase">SISTEMA ATIVO</span>
           </div>
           <div className="bg-slate-800 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border border-slate-700">LZ</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 transition-all hover:border-indigo-500/30">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Agentes Ativos</h3>
            <p className="text-4xl font-black text-white italic tracking-tighter">{agents.length}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-indigo-500/5 shadow-lg transition-all hover:border-indigo-500/30">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Total de Eventos</h3>
            <p className="text-4xl font-black text-white italic tracking-tighter">{logs.length}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 transition-all hover:border-emerald-500/30">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Integridade</h3>
            <p className="text-4xl font-black text-emerald-500 italic tracking-tighter">100%</p>
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2 text-white italic tracking-tighter uppercase text-sm"><Usb className="h-4 w-4 text-indigo-400" /> Auditoria de Dispositivos</h2>
          </div>
          
          <div className="overflow-auto h-[450px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-500 border-b border-slate-800 sticky top-0 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Detalhes do Hardware</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-slate-600 font-mono text-xs animate-pulse">
                      AGUARDANDO CONEXÃO COM AGENTES...
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isWhitelisted = whitelistIds.includes(log.device_id);
                    return (
                      <tr key={log.id} className="group hover:bg-slate-800/20 transition-all border-l-2 border-transparent hover:border-indigo-500">
                        <td className="px-6 py-4">
                          {log.action_taken === 'BLOCKED' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                               <AlertCircle className="h-3 w-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                               <CheckCircle2 className="h-3 w-3" /> Detected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-200 font-bold group-hover:text-white transition-colors uppercase italic text-xs tracking-tight">{log.device_name}</div>
                          <div className="text-[9px] text-slate-600 font-mono mt-0.5 truncate max-w-[250px]">{log.device_id}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.action_taken === 'BLOCKED' && !isWhitelisted ? (
                            <button 
                              onClick={() => authorizeDevice(log.device_id, log.device_name)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 ml-auto active:scale-95"
                            >
                              <PlusCircle className="h-3 w-3" /> LIBERAR
                            </button>
                          ) : isWhitelisted ? (
                            <span className="text-indigo-400 text-[9px] font-black border border-indigo-400/30 px-2 py-1 rounded bg-indigo-400/5 tracking-widest uppercase">
                              AUTORIZADO
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;