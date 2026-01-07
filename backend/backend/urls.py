# SENTINEL_BACKEND/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')), # Encaminha para o urls.py do seu app
]