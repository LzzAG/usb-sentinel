# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, USBLogViewSet, WhitelistedDeviceViewSet # Adicione o WhitelistedDeviceViewSet

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'logs', USBLogViewSet)
router.register(r'whitelist', WhitelistedDeviceViewSet) # <--- ESSA LINHA É ESSENCIAL PARA O FRONTEND

urlpatterns = [
    path('', include(router.urls)),
]