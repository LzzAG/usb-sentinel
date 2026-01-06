import os
import subprocess
import time
import requests
import wmi
import urllib.parse

# CONFIGURAÇÕES
API_URL = "http://localhost:8000/api"
HOSTNAME = os.environ.get('COMPUTERNAME', 'Unknown-PC')
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
            "mac_address": "00:00:00:00:00:00", # MAC simplificado
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
    """ Consulta se o dispositivo está na Whitelist """
    try:
        encoded_id = urllib.parse.quote(device_id, safe='')
        url = f"{API_URL}/agents/check-auth/{encoded_id}/"
        response = requests.get(url, timeout=3)
        return response.status_code == 200
    except:
        return False

def eject_usb(drive_letter):
    """ Comando PowerShell para ejetar a unidade """
    try:
        cmd = f"powershell $drive = '{drive_letter}'; (New-Object -ComObject Shell.Application).Namespace(17).ParseName($drive).InvokeVerb('Eject')"
        subprocess.run(cmd, shell=True)
        return True
    except:
        return False

def report_event(device_name, device_id, action):
    """ Envia o log de detecção ou bloqueio para o Frontend """
    if AGENT_ID is None:
        print("⚠️ Log não enviado: Agente não está registrado no banco.")
        return

    try:
        data = {
            "agent": AGENT_ID,
            "device_name": device_name,
            "device_id": device_id,
            "action_taken": action
        }
        r = requests.post(f"{API_URL}/logs/", json=data, timeout=5)
        if r.status_code == 201:
            print(f"📡 EVENTO ENVIADO: {action} para o Dashboard!")
        else:
            print(f"❌ ERRO API: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ FALHA NO REPORT: {e}")

def start_monitor():
    global AGENT_ID
    print("--- USB SENTINEL SOC ---")
    
    # Tenta registrar o agente antes de começar
    AGENT_ID = get_or_create_agent()
    
    if AGENT_ID is None:
        print("🛑 O Agente não pôde ser inicializado. O Servidor Django está rodando?")
        return

    c = wmi.WMI()
    watcher = c.watch_for(notification_type="Creation", wmi_class="Win32_DiskDrive", InterfaceType="USB")
    
    print(f"🛡️ MONITOR ATIVO: {HOSTNAME} | STATUS: PROTEGIDO")
    print(">> Aguardando conexões USB...")

    while True:
        usb = watcher()
        device_id = usb.DeviceID
        device_name = usb.Caption

        if is_authorized(device_id):
            print(f"✅ PERMITIDO: {device_name}")
            report_event(device_name, device_id, "DETECTED")
        else:
            print(f"🚫 BLOQUEADO: {device_name}")
            # Identifica a letra do drive para ejetar
            for partition in usb.associators("Win32_DiskDriveToDiskPartition"):
                for logical_disk in partition.associators("Win32_LogicalDiskToPartition"):
                    drive = logical_disk.DeviceID
                    if eject_usb(drive):
                        print(f"⚡ Unidade {drive} ejetada com sucesso!")
            
            report_event(device_name, device_id, "BLOCKED")
            time.sleep(2) 

if __name__ == "__main__":
    start_monitor()