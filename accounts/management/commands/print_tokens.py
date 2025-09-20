from django.core.management.base import BaseCommand
from accounts.models import Child

class Command(BaseCommand):
    help = "Print full access tokens for all Child accounts"

    def handle(self, *args, **kwargs):
        children = Child.objects.all()

        for child in children:
            token = child.access_token
            if not token:
                self.stdout.write(f"Child {child.id} has NO access token.")
            else:
                self.stdout.write(f"Child {child.id} full token: {token} (length {len(token)})")
