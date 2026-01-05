from rest_framework import serializers
from .models import Agent, USBLog

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['hostname', 'ip_address', 'mac_address', 'status', 'policy_mode']
        # 'status' e 'policy_mode' podem precisar de ajuste se usou nomes diferentes no model,
        # vou ajustar para bater com o código que te passei antes:
        fields = ['id', 'hostname', 'ip_address', 'mac_address', 'is_online', 'policy']

class USBLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = USBLog
        fields = ['agent', 'device_name', 'device_id', 'action_taken', 'timestamp']