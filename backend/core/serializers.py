from rest_framework import serializers
from .models import Agent, USBLog, WhitelistedDevice

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'hostname', 'ip_address', 'mac_address', 'is_online', 'last_seen', 'policy']

class USBLogSerializer(serializers.ModelSerializer):
    # Mostra o hostname do agente ao invés de apenas o ID no GET
    agent_hostname = serializers.ReadOnlyField(source='agent.hostname')

    class Meta:
        model = USBLog
        fields = [
            'id', 'agent', 'agent_hostname', 'device_name', 
            'device_id', 'action_taken', 'username', 
            'ip_address', 'timestamp'
        ]

class WhitelistedDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhitelistedDevice
        fields = ['id', 'device_id', 'device_name', 'added_at', 'description']