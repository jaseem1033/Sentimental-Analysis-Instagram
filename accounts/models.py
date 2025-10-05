from django.db import models
from django.contrib.auth.models import User


class InstagramChild(models.Model):
    """
    Stores Instagram credentials for verification only.
    Not directly linked to a parent.
    """
    instagram_user_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=100, unique=True)
    access_token = models.TextField()

    def __str__(self):
        return f"{self.username} (Instagram Child)"


class Child(models.Model):
    """
    Stores actual children linked to parents.
    Initially instagram_user_id and access_token can be blank until verified.
    """
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children')
    username = models.CharField(max_length=100)
    instagram_user_id = models.CharField(max_length=100, blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    consent_given = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['username', 'parent']

    def __str__(self):
        return f"{self.username} (Child of {self.parent.username})"


class Comment(models.Model):
    """
    Stores comments linked to a specific Child.
    Automatically deleted when the related Child is deleted.
    """
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="comments")
    post_id = models.CharField(max_length=200)
    comment_id = models.CharField(max_length=200, unique=True)
    username = models.CharField(max_length=200)  # Commenter's username
    text = models.TextField()

    sentiment = models.CharField(
        max_length=20,
        choices=[
            ('positive', 'Positive'),
            ('neutral', 'Neutral'),
            ('negative', 'Negative'),
            ('toxic', 'Toxic')
        ],
        default='neutral'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username}: {self.text[:30]}"
