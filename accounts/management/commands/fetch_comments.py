import requests
from django.core.management.base import BaseCommand
from accounts.models import Child, Comment
from accounts.utils import classify_comment
from django.conf import settings


class Command(BaseCommand):
    help = "Fetch and save Instagram comments for all children, then perform sentiment analysis"

    def handle(self, *args, **kwargs):
        children = Child.objects.all()

        for child in children:
            insta_id = child.instagram_user_id
            token = child.access_token

            if not insta_id or not token:
                self.stdout.write(f"Missing Instagram ID or token for child {child.id}")
                continue

            self.stdout.write(f"Fetching media for child {child.id} (Instagram ID: {insta_id})")
            
            # Try to refresh token if it's expired
            token = self.refresh_instagram_token(token, child)

            # Fetch media for this child
            media_url = (
                f"https://graph.facebook.com/v17.0/{insta_id}/media"
                f"?fields=id,caption,timestamp&access_token={token}"
            )
            media_response = requests.get(media_url)
            if media_response.status_code != 200:
                self.stdout.write(f"Failed to fetch media for child {child.id}: {media_response.text}")
                continue

            media_list = media_response.json().get("data", [])
            for media in media_list:
                media_id = media["id"]

                # Fetch comments for each media post
                comments_url = (
                    f"https://graph.facebook.com/v17.0/{media_id}/comments"
                    f"?fields=id,username,text,timestamp&access_token={token}"
                )
                comments_response = requests.get(comments_url)

                if comments_response.status_code != 200:
                    self.stdout.write(
                        f"Failed to fetch comments for media {media_id}: {comments_response.text}"
                    )
                    continue

                comments = comments_response.json().get("data", [])
                self.stdout.write(f"Media ID {media_id} has {len(comments)} comments")

                for comment_data in comments:
                    comment_id = comment_data.get("id")
                    if not comment_id:
                        self.stdout.write("Skipping comment without ID")
                        continue

                    # Skip if already exists
                    if Comment.objects.filter(comment_id=comment_id).exists():
                        continue

                    username = comment_data.get("username", "")
                    text = comment_data.get("text", "")

                    # Perform sentiment analysis
                    sentiment = classify_comment(text)

                    # Save to DB (✅ include child here)
                    Comment.objects.create(
                        child=child,
                        comment_id=comment_id,
                        post_id=media_id,
                        username=username,
                        text=text,
                        sentiment=sentiment,
                    )

                    self.stdout.write(
                        f"Saved Comment ID: {comment_id} | Sentiment: {sentiment} | Text: {text}"
                    )

            self.stdout.write(f"Finished fetching and analyzing comments for child {child.id}")

    def refresh_instagram_token(self, access_token, child):
        """
        Refresh Instagram access token if it's expired
        """
        try:
            # First, test if the current token works
            test_url = f"https://graph.facebook.com/v17.0/me?access_token={access_token}"
            test_response = requests.get(test_url)
            
            if test_response.status_code == 200:
                self.stdout.write(f"Token is valid for child {child.id}")
                return access_token
            
            # Token is invalid, try to refresh
            self.stdout.write(f"Token expired for child {child.id}, attempting to refresh...")
            
            # Get app credentials from settings
            client_id = getattr(settings, 'INSTAGRAM_CLIENT_ID', None)
            client_secret = getattr(settings, 'INSTAGRAM_CLIENT_SECRET', None)
            
            if not client_id or not client_secret:
                self.stdout.write(f"Missing Instagram app credentials in settings")
                return access_token
            
            # Note: Instagram Basic Display API doesn't support automatic token refresh
            # User needs to re-authenticate through OAuth flow
            self.stdout.write(f"Instagram token refresh requires user re-authentication")
            self.stdout.write(f"Child {child.id} needs to re-authenticate via Instagram OAuth")
            
            return access_token
            
        except Exception as e:
            self.stdout.write(f"Error refreshing token for child {child.id}: {e}")
            return access_token
