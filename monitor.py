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
IP_ADDRESS = socket.gethostbyname(socket.gethostname())
USERNAME = getpass.getuser()
AGENT_ID = None

def get_or_create_agent():
    """ 
    Verifica se o computador já está cadastrado no Dashboard. 
    Se não estiver, cria o registro automaticamente.
    """
    global AGENT_ID
    try:
        # Busca a lista de agentes cadastrados
        response = requests.get(f"{API_URL}/agents/", timeout=5)
        if response.status_code == 200:
            agents = response.json()
            
            # Procura se o hostname atual já existe
            for a in agents:
                if a['hostname'] == HOSTNAME:
                    print(f"✅ Agente '{HOSTNAME}' identificado (ID: {a['id']})")
                    return a['id']
        
        # Se não existir, envia um POST para criar
        print(f"📝 Registrando novo agente: {HOSTNAME}...")
        new_agent = {
            "hostname": HOSTNAME,
            "mac_address": "00:00:00:00:00:00", # MAC simplificado para o exemplo
            "policy": "BLOCK_ALL"
        }
        res = requests.post(f"{API_URL}/agents/", json=new_agent, timeout=5)
        if res.status_code == 201:
            new_id = res.json()['id']
            print(f"✅ Registro concluído com sucesso (Novo ID: {new_id})")
            return new_id
        else:
            print(f"❌ Falha ao registrar no Django: {res.text}")
            return None
    except Exception as e:
        print(f"🚨 Erro de conexão com o Servidor: {e}")
        return None

def is_authorized(device_id):
    """ Consulta se o dispositivo está na Whitelist via API """
    try:
        # Codifica o ID do hardware para passar na URL (evita problemas com caracteres especiais)
        encoded_id = urllib.parse.quote(device_id, safe='')
        url = f"{API_URL}/agents/check-auth/{encoded_id}/"
        response = requests.get(url, timeout=3)
        return response.status_code == 200
    except:
        return False

def eject_usb(drive_letter):
    """ Comando PowerShell para ejetar a unidade física """
    try:
        # Comando para ejetar de forma limpa
        cmd = f"powershell $drive = '{drive_letter}'; (New-Object -ComObject Shell.Application).Namespace(17).ParseName($drive).InvokeVerb('Eject')"
        subprocess.run(cmd, shell=True, capture_output=True)
        return True
    except:
        return False

def report_event(device_name, device_id, action):
    """ Envia o log detalhado para o Backend """
    if AGENT_ID is None:
        print("⚠️ Log não enviado: Agente não está registrado no banco.")
        return

    try:
        # Payload enriquecido com IP e Usuário para o Dashboard
        data = {
            "agent": AGENT_ID,
            "device_name": device_name,
            "device_id": device_id,
            "action_taken": action,
            "username": USERNAME,  # Novo campo
            "ip_address": IP_ADDRESS # Novo campo
        }
        r = requests.post(f"{API_URL}/logs/", json=data, timeout=5)
        if r.status_code == 201:
            print(f"📡 EVENTO ENVIADO: {action} | Dispositivo: {device_name}")
        else:
            print(f"❌ ERRO API: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ FALHA NO REPORT: {e}")

def start_monitor():
    global AGENT_ID
    print("\n" + "="*30)
    print("      USB SENTINEL SOC      ")
    print("="*30)
    
    # Tenta registro inicial
    AGENT_ID = get_or_create_agent()
    
    if AGENT_ID is None:
        print("🛑 O Agente não pôde ser inicializado. Verifique se o Django está ON.")
        return

    # Inicializa o monitoramento WMI para dispositivos USB
    c = wmi.WMI()
    watcher = c.watch_for(
        notification_type="Creation", 
        wmi_class="Win32_DiskDrive", 
        InterfaceType="USB"
    )
    
    print(f"🛡️ MONITOR ATIVO: {HOSTNAME}")
    print(f"👤 USUÁRIO: {USERNAME} | 🌐 IP: {IP_ADDRESS}")
    print(">> Aguardando conexões USB...\n")

    while True:
        try:
            usb = watcher()
            device_id = usb.DeviceID
            device_name = usb.Caption

            print(f"🔍 Dispositivo detectado: {device_name}")

            if is_authorized(device_id):
                print(f"✅ PERMITIDO: {device_name}")
                report_event(device_name, device_id, "DETECTED")
            else:
                print(f"🚫 BLOQUEADO: {device_name}")
                
                # Busca a letra do drive associada ao hardware detectado
                for partition in usb.associators("Win32_DiskDriveToDiskPartition"):
                    for logical_disk in partition.associators("Win32_LogicalDiskToPartition"):
                        drive = logical_disk.DeviceID
                        if eject_usb(drive):
                            print(f"⚡ Kill Switch: Unidade {drive} ejetada!")
                
                report_event(device_name, device_id, "BLOCKED")
                
            time.sleep(2) # Pequeno intervalo para evitar duplicidade rápida
        except Exception as e:
            print(f"⚠️ Erro no loop de monitoramento: {e}")
            time.sleep(5)

if __name__ == "__main__":
    start_monitor()