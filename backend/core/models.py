from django.db import models

class Agent(models.Model):
    hostname = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    mac_address = models.CharField(max_length=17, unique=True)
    is_online = models.BooleanField(default=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    # Política de segurança
    POLICY_CHOICES = [
        ('ALLOW_ALL', 'Liberar Tudo'),
        ('BLOCK_ALL', 'Bloquear Tudo'),
        ('READ_ONLY', 'Apenas Leitura'),
    ]
    policy = models.CharField(max_length=20, choices=POLICY_CHOICES, default='ALLOW_ALL')

    def __str__(self):
        return f"{self.hostname} ({self.ip_address})"

class USBLog(models.Model):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='usb_logs')
    device_name = models.CharField(max_length=255)
    device_id = models.CharField(max_length=255) 
    action_taken = models.CharField(max_length=50) # Ex: "DETECTED", "BLOCKED"
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device_name} em {self.agent.hostname}"

# NOVA TABELA: Dispositivos Autorizados
class WhitelistedDevice(models.Model):
    device_id = models.CharField(max_length=255, unique=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Autorizado: {self.device_name or self.device_id}"