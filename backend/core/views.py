from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import Agent, USBLog, WhitelistedDevice
from .serializers import AgentSerializer, USBLogSerializer, WhitelistedDeviceSerializer

class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    
    def get_queryset(self):
        mac = self.request.query_params.get('mac_address')
        if mac:
            return self.queryset.filter(mac_address=mac)
        return self.queryset

    @action(detail=False, methods=['get'], url_path='check-auth/(?P<hw_id>.+)')
    def check_auth(self, request, hw_id=None):
        """
        Endpoint customizado para o monitor.py verificar se um 
        Hardware ID está na Whitelist.
        """
        if not hw_id:
            return Response({"error": "Hardware ID não fornecido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # O hw_id vem codificado da URL, o Django já decodifica automaticamente
        is_authorized = WhitelistedDevice.objects.filter(device_id=hw_id).exists()
        
        if is_authorized:
            return Response({"status": "authorized"}, status=status.HTTP_200_OK)
        return Response({"status": "blocked"}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Retorna os KPIs para os cards do Frontend (Vite/React).
        """
        total_agents = Agent.objects.count()
        active_agents = Agent.objects.filter(is_online=True).count()
        total_events = USBLog.objects.count()
        blocked_events = USBLog.objects.filter(action_taken='BLOCKED').count()
        authorized_events = USBLog.objects.filter(action_taken='DETECTED').count()

        return Response({
            "active_agents": active_agents,
            "total_agents": total_agents,
            "total_events": total_events,
            "blocked_events": blocked_events,
            "authorized_events": authorized_events,
            "integrity_score": 98.5 # Valor simulado para o Dashboard
        })

class USBLogViewSet(viewsets.ModelViewSet):
    """
    Gerencia os logs de auditoria. 
    O Frontend consome este endpoint para a tabela de eventos.
    """
    queryset = USBLog.objects.all().order_by('-timestamp')
    serializer_class = USBLogSerializer

class WhitelistedDeviceViewSet(viewsets.ModelViewSet):
    """
    Gerencia os dispositivos autorizados.
    O botão 'LIBERAR' do Frontend enviará um POST para aqui.
    """
    queryset = WhitelistedDevice.objects.all()
    serializer_class = WhitelistedDeviceSerializer

    def create(self, request, *args, **kwargs):
        # Lógica para evitar duplicados ao liberar do frontend
        device_id = request.data.get('device_id')
        if WhitelistedDevice.objects.filter(device_id=device_id).exists():
            return Response({"message": "Dispositivo já está na lista branca."}, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)