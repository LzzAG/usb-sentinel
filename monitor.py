import os
import subprocess
import time
import requests
import wmi
import urllib.parse
import socket
import getpass
from datetime import datetime

# --- CONFIGURAÇÕES ---
API_URL = "http://localhost:8000/api"
HOSTNAME = os.environ.get('COMPUTERNAME', socket.gethostname())
USERNAME = getpass.getuser()
AGENT_ID = None

def get_real_ip():
    """ 
    Obtém o IP da interface de rede ativa que tem acesso à internet.
    Evita retornar 127.0.0.1 ou 0.0.0.0.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Tenta uma conexão externa para identificar a interface de saída
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def get_or_create_agent():
    """ Verifica registro do agente no Django ou cria um novo """
    global AGENT_ID
    try:
        response = requests.get(f"{API_URL}/agents/", timeout=5)
        if response.status_code == 200:
            agents = response.json()
            for a in agents:
                if a['hostname'] == HOSTNAME:
                    print(f"✅ Agente '{HOSTNAME}' identificado (ID: {a['id']})")
                    return a['id']
        
        print(f"📝 Registrando novo agente: {HOSTNAME}...")
        new_agent = {
            "hostname": HOSTNAME,
            "mac_address": "00:00:00:00:00:00", 
            "policy": "BLOCK_ALL"
        }
        res = requests.post(f"{API_URL}/agents/", json=new_agent, timeout=5)
        if res.status_code == 201:
            new_id = res.json()['id']
            print(f"✅ Registro concluído com sucesso (Novo ID: {new_id})")
            return new_id
    except Exception as e:
        print(f"🚨 Erro de conexão com o Servidor: {e}")
        return None

def is_authorized(device_id):
    """ Consulta a Whitelist via API """
    try:
        encoded_id = urllib.parse.quote(device_id, safe='')
        url = f"{API_URL}/agents/check-auth/{encoded_id}/"
        response = requests.get(url, timeout=3)
        return response.status_code == 200
    except:
        return False

def eject_usb(drive_letter):
    """ Ejeta a unidade via PowerShell """
    try:
        cmd = f"powershell $drive = '{drive_letter}'; (New-Object -ComObject Shell.Application).Namespace(17).ParseName($drive).InvokeVerb('Eject')"
        subprocess.run(cmd, shell=True, capture_output=True)
        return True
    except:
        return False

def report_event(device_name, device_id, action):
    """ Envia o log para o Dashboard """
    if AGENT_ID is None: return

    try:
        data = {
            "agent": AGENT_ID,
            "device_name": device_name,
            "device_id": device_id,
            "action_taken": action,
            "username": USERNAME,
            "ip_address": get_real_ip() 
        }
        r = requests.post(f"{API_URL}/logs/", json=data, timeout=5)
        if r.status_code == 201:
            print(f"📡 EVENTO ENVIADO: {action} | Dispositivo: {device_name}")
    except Exception as e:
        print(f"❌ FALHA NO REPORT: {e}")

def start_monitor():
    global AGENT_ID
    print("\n" + "="*35)
    print("      USB SENTINEL SOC - AGENT      ")
    print("="*35)
    
    AGENT_ID = get_or_create_agent()
    
    if AGENT_ID is None:
        print("🛑 Falha crítica: O Agente não pôde se conectar ao Dashboard.")
        return

    c = wmi.WMI()
    watcher = c.watch_for(
        notification_type="Creation", 
        wmi_class="Win32_DiskDrive", 
        InterfaceType="USB"
    )
    
    print(f"🛡️ MONITOR ATIVO: {HOSTNAME}")
    print(f"👤 USUÁRIO: {USERNAME} | 🌐 IP: {get_real_ip()}")
    print(">> Aguardando conexões USB...\n")

    while True:
        try:
            usb = watcher()
            device_id = usb.DeviceID
            
            # Melhora o nome do dispositivo: usa Model e limpa caminhos técnicos
            raw_name = usb.Model if usb.Model else usb.Caption
            device_name = raw_name.replace("\\\\.\\", "").strip()

            print(f"🔍 Dispositivo detectado: {device_name}")

            if is_authorized(device_id):
                print(f"✅ STATUS: AUTORIZADO")
                report_event(device_name, device_id, "AUTHORIZED")
            else:
                print(f"🚫 STATUS: BLOQUEADO (Kill Switch acionado)")
                
                # Procura a letra da unidade para ejeção física
                for partition in usb.associators("Win32_DiskDriveToDiskPartition"):
                    for logical_disk in partition.associators("Win32_LogicalDiskToPartition"):
                        drive = logical_disk.DeviceID
                        if eject_usb(drive):
                            print(f"⚡ Unidade {drive} ejetada com sucesso!")
                
                report_event(device_name, device_id, "BLOCKED")
                
            time.sleep(2) 
        except Exception as e:
            print(f"⚠️ Erro no monitoramento: {e}")
            time.sleep(5)

if __name__ == "__main__":
    start_monitor()