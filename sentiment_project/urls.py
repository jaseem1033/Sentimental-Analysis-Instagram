from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# Simple home view for root URL
def home(request):
    return HttpResponse("Welcome to the Sentiment Analysis API!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),  # All accounts & comment endpoints
    path('', home),                                   # Root URL handler
]
