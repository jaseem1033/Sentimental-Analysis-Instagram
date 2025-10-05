from django.core.management.base import BaseCommand
from accounts.models import Child

class Command(BaseCommand):
    help = "Update Instagram access token for a child account"

    def add_arguments(self, parser):
        parser.add_argument('child_id', type=int, help='Child ID to update token for')
        parser.add_argument('new_token', type=str, help='New Instagram access token')

    def handle(self, *args, **options):
        child_id = options['child_id']
        new_token = options['new_token']
        
        try:
            child = Child.objects.get(id=child_id)
            child.access_token = new_token
            child.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated token for child {child_id} ({child.username})')
            )
            
        except Child.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Child with ID {child_id} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating token: {e}')
            )
