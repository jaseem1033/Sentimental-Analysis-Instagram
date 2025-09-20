from django.core.management.base import BaseCommand
from accounts.models import Comment
from accounts.utils import classify_comment

class Command(BaseCommand):
    help = "Classify and print sentiment for all existing comments"

    def handle(self, *args, **kwargs):
        comments = Comment.objects.all()
        for comment in comments:
            sentiment = classify_comment(comment.text)
            comment.sentiment = sentiment
            comment.save()
            self.stdout.write(f"Comment: {comment.text} -> Sentiment: {sentiment}")