from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Child, Comment
from accounts.email_service import send_toxic_comment_alert
from datetime import datetime

class Command(BaseCommand):
    help = "Test email functionality by sending a sample toxic comment alert"

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address to send test alert to',
            required=True
        )

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            # Create a test user if it doesn't exist
            user, created = User.objects.get_or_create(
                username='test_parent',
                defaults={
                    'email': email,
                    'first_name': 'Test',
                    'last_name': 'Parent'
                }
            )
            
            if created:
                self.stdout.write(f"Created test user: {user.username}")
            else:
                self.stdout.write(f"Using existing user: {user.username}")
            
            # Create a test child if it doesn't exist
            child, created = Child.objects.get_or_create(
                parent=user,
                username='test_child',
                defaults={
                    'instagram_user_id': '123456789',
                    'access_token': 'test_token'
                }
            )
            
            if created:
                self.stdout.write(f"Created test child: {child.username}")
            else:
                self.stdout.write(f"Using existing child: {child.username}")
            
            # Create a test toxic comment
            test_comment = Comment.objects.create(
                child=child,
                comment_id='test_comment_123',
                post_id='test_post_123',
                text='This is a test toxic comment with inappropriate language!',
                username='test_commenter',
                sentiment='toxic'
            )
            
            self.stdout.write("Created test toxic comment")
            
            # Send test email
            success = send_toxic_comment_alert(test_comment, child, user)
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'Test email sent successfully to {email}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('Failed to send test email')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )
