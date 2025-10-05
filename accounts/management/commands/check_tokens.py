import requests
from django.core.management.base import BaseCommand
from accounts.models import Child

class Command(BaseCommand):
    help = "Check if Instagram access tokens are valid"

    def handle(self, *args, **options):
        children = Child.objects.all()
        
        if not children.exists():
            self.stdout.write(self.style.WARNING("No children found in database"))
            return
            
        for child in children:
            if not child.access_token:
                self.stdout.write(
                    self.style.ERROR(f"Child {child.id} ({child.username}): No access token")
                )
                continue
                
            # Test the token
            test_url = f"https://graph.facebook.com/v17.0/me?access_token={child.access_token}"
            
            try:
                response = requests.get(test_url)
                
                if response.status_code == 200:
                    data = response.json()
                    self.stdout.write(
                        self.style.SUCCESS(f"Child {child.id} ({child.username}): Token VALID - Instagram ID: {data.get('id', 'Unknown')}")
                    )
                else:
                    error_data = response.json()
                    self.stdout.write(
                        self.style.ERROR(f"Child {child.id} ({child.username}): Token INVALID - {error_data.get('error', {}).get('message', 'Unknown error')}")
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Child {child.id} ({child.username}): Error checking token - {e}")
                )
