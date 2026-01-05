from django.contrib import admin
from django.urls import path, include  # <--- Adicione 'include' aqui

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')), # <--- Adicione esta linha
]