import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, HardDrive, Activity, Laptop } from 'lucide-react';

interface Agent {
  id: number;
  hostname: string;
  ip_address: string;
  os: string;
  status?: string;
  last_seen?: string;
}

// CORREÇÃO 1: Interface ajustada para os dados reais do seu Backend
interface USBLog {
  id: number;
  agent: number;
  device_name: string;   // Antes era 'device'
  device_id: string;
  action_taken: string;  // Antes era 'action'
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
      console.error("Erro ao buscar dados da API:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-sentinel-dark p-6 text-gray-100 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">USB Sentinel</h1>
            <p className="text-sm text-gray-400">Monitoramento de Segurança DevSecOps</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-sentinel-card px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
            <Laptop className="h-5 w-5 text-green-400" />
            <span className="font-bold">{agents.length}</span> Agentes
          </div>
          <div className="bg-sentinel-card px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
            <Activity className="h-5 w-5 text-yellow-400" />
            <span className="font-bold">{logs.length}</span> Eventos
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Logs Recentes */}
        <section className="bg-sentinel-card rounded-xl border border-gray-700 p-4 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="text-purple-400" /> Últimos Eventos USB
          </h2>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-gray-600">
                <tr>
                  <th className="pb-2">Dispositivo</th>
                  <th className="pb-2">Ação</th>
                  <th className="pb-2">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800 transition-colors">
                    {/* CORREÇÃO 2: Usando device_name */}
                    <td className="py-3 font-mono text-xs text-blue-300">
                        {log.device_name || "Dispositivo Desconhecido"}
                    </td>
                    <td className="py-3">
                      {/* CORREÇÃO 3: Lógica de cores para 'DETECTED' */}
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action_taken === 'DETECTED' ? 'bg-green-900 text-green-200' : 
                        log.action_taken === 'BLOCKED' ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {log.action_taken ? log.action_taken.toUpperCase() : 'DESCONHECIDO'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "--:--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p className="text-center text-gray-500 mt-4">Nenhum log encontrado.</p>}
          </div>
        </section>

        {/* Agentes Monitorados */}
        <section className="bg-sentinel-card rounded-xl border border-gray-700 p-4 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Laptop className="text-green-400" /> Máquinas Ativas
          </h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div>
                  <p className="font-bold text-white">{agent.hostname}</p>
                  <p className="text-xs text-gray-400">{agent.ip_address} • {agent.os}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            ))}
             {agents.length === 0 && <p className="text-center text-gray-500 mt-4">Nenhum agente registrado.</p>}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;