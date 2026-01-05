from rest_framework import viewsets
from .models import Agent, USBLog
from .serializers import AgentSerializer, USBLogSerializer

class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    
    # Aqui poderíamos adicionar lógica extra, tipo buscar pelo MAC Address
    def get_queryset(self):
        mac = self.request.query_params.get('mac_address')
        if mac:
            return self.queryset.filter(mac_address=mac)
        return self.queryset

class USBLogViewSet(viewsets.ModelViewSet):
    queryset = USBLog.objects.all()
    serializer_class = USBLogSerializer