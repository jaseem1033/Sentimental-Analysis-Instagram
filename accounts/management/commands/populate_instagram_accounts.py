from django.core.management.base import BaseCommand
from accounts.models import InstagramChild

class Command(BaseCommand):
    help = "Populate Instagram accounts with predefined credentials for demo purposes"

    def handle(self, *args, **options):
        # Pre-populated Instagram accounts for demo
        instagram_accounts = [
            {
                'username': 'jack_sainzz',
                'instagram_user_id': '17841475951275839',
                'access_token': 'EAA5TlBbQxpYBPgfVadiyES0aqNzMJMxE5m3Krfx5ecHC3TgTW9eX4OPN3EZCT0ghyX4G0V1itSu9IQD0zeYmAZBZADrdyMz9W80TizoEdmbZCRJsp1ZAPupKah48xyqWiz3LDVqUXvS9JPmmmJ1cGNvmp4ldFJhhzM6sBMu89Wtr50rzn3FccO4m3tNvSPfvz'
            },
            {
                'username': 'demo_account_2',
                'instagram_user_id': '12345678901234567',
                'access_token': 'DEMO_TOKEN_2_PLACEHOLDER'
            },
            {
                'username': 'demo_account_3',
                'instagram_user_id': '98765432109876543',
                'access_token': 'DEMO_TOKEN_3_PLACEHOLDER'
            }
        ]

        for account_data in instagram_accounts:
            username = account_data['username']
            instagram_user_id = account_data['instagram_user_id']
            access_token = account_data['access_token']

            # Check if account already exists
            if InstagramChild.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'Instagram account "{username}" already exists, skipping...')
                )
                continue

            try:
                # Create new Instagram account
                instagram_account = InstagramChild.objects.create(
                    username=username,
                    instagram_user_id=instagram_user_id,
                    access_token=access_token
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully added Instagram account: {username} (ID: {instagram_user_id})')
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to add Instagram account "{username}": {e}')
                )

        # Display summary
        total_accounts = InstagramChild.objects.count()
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal Instagram accounts in database: {total_accounts}')
        )
        
        # List all accounts
        accounts = InstagramChild.objects.all()
        if accounts.exists():
            self.stdout.write('\nAvailable Instagram accounts:')
            for account in accounts:
                self.stdout.write(f'  - {account.username} (ID: {account.instagram_user_id})')
