import win32com.client
import requests
import socket
import uuid
import time

# Endereço da sua API Django
API_URL = "http://127.0.0.1:8000/api"

def get_machine_info():
    """Pega os dados do próprio computador automaticamente"""
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    # Pega o MAC Address e formata bonitinho (00:1A:2B...)
    mac_num = uuid.getnode()
    mac = ':'.join(['{:02x}'.format((mac_num >> elements) & 0xff) for elements in range(0,2*6,2)][::-1])
    return hostname, ip, mac

def register_agent():
    """Tenta registrar este computador na API ou recuperar o ID se já existir"""
    hostname, ip, mac = get_machine_info()
    
    print(f"🔄 Conectando ao servidor Sentinel como: {hostname} ({mac})...")
    
    try:
        # 1. Verifica se o agente já existe (buscando pelo MAC)
        response = requests.get(f"{API_URL}/agents/?mac_address={mac}")
        existing = response.json()
        
        if existing and len(existing) > 0:
            agent_id = existing[0]['id']
            print(f"✅ Agente identificado com sucesso (ID: {agent_id}).")
            return agent_id
            
        # 2. Se não existe, cria um novo cadastro
        payload = {
            "hostname": hostname,
            "ip_address": ip,
            "mac_address": mac,
            "is_online": True
        }
        response = requests.post(f"{API_URL}/agents/", json=payload)
        
        if response.status_code == 201:
            agent_id = response.json()['id']
            print(f"✅ Novo Agente registrado no banco de dados (ID: {agent_id}).")
            return agent_id
        else:
            print(f"❌ Erro ao registrar: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: Não foi possível conectar na API em {API_URL}")
        print(f"Detalhe: {e}")
        return None

def send_log(agent_id, device):
    """Envia o alerta de USB para o banco de dados"""
    if not agent_id: return

    try:
        payload = {
            "agent": agent_id,
            "device_name": getattr(device, "Caption", "Desconhecido"),
            "device_id": getattr(device, "DeviceID", "N/A"),
            "action_taken": "DETECTED" # Por enquanto apenas detectamos
        }
        
        r = requests.post(f"{API_URL}/logs/", json=payload)
        if r.status_code == 201:
            print("📡 Log enviado para o servidor com sucesso!")
        else:
            print(f"⚠️ Falha ao enviar log: {r.status_code}")
            
    except Exception as e:
        print(f"⚠️ Erro de conexão ao enviar log: {e}")

def monitor_usb(agent_id):
    print("\n=== 🛡️ USB Sentinel Ativo e Vigilante ===")
    print("Aguardando conexões USB...")
    
    wmi = win32com.client.GetObject("winmgmts:root\\cimv2")
    query = "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_PnPEntity'"
    watcher = wmi.ExecNotificationQuery(query)

    while True:
        try:
            event = watcher.NextEvent()
            device = event.TargetInstance
            
            # Filtra apenas USBs
            if "USB" in str(device.DeviceID):
                print(f"\n🚨 [ALERTA] Novo USB Detectado!")
                print(f"   Nome: {device.Caption}")
                send_log(agent_id, device)
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Erro no loop: {e}")

if __name__ == "__main__":
    # Garante que temos requests instalado
    try:
        agent_id = register_agent()
        if agent_id:
            monitor_usb(agent_id)
        else:
            print("Encerrando: Falha na autenticação com o servidor.")
    except NameError:
        print("Erro: A biblioteca 'requests' não está instalada. Rode 'pip install requests'.")