from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, USBLogViewSet

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'logs', USBLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]