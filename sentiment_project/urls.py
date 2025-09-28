from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.shortcuts import redirect

# Simple home view for root URL
def home(request):
    return HttpResponse("Welcome to the Sentiment Analysis API!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),  # All accounts & comment endpoints
    path('', home),                                   # Root URL handler
    # Proxy OAuth callbacks from backend domain to frontend app, preserving query params
    path('auth/callback', lambda request: redirect(
        f"http://localhost:8080/auth/instagram/callback?{request.META.get('QUERY_STRING', '')}"
    )),
    path('auth/instagram/callback', lambda request: redirect(
        f"http://localhost:8080/auth/instagram/callback?{request.META.get('QUERY_STRING', '')}"
    )),
]
