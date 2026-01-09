from django.contrib import admin
from .models import Agent, USBLog, WhitelistedDevice

# Registro do modelo de Agentes (Computadores monitorados)
@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ('hostname', 'ip_address', 'policy', 'last_seen')
    search_fields = ('hostname', 'ip_address')

# Registro do modelo de Logs (Histórico de detecções e bloqueios)
@admin.register(USBLog)
class USBLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'device_name', 'action_taken', 'agent', 'username')
    list_filter = ('action_taken', 'timestamp')
    search_fields = ('device_name', 'device_id', 'agent__hostname')

# Registro da Whitelist (Dispositivos autorizados)
@admin.register(WhitelistedDevice)
class WhitelistedDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_name', 'device_id', 'added_at')
    search_fields = ('device_name', 'device_id')