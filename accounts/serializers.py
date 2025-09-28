from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Child, Comment # Make sure to import the Comment model

# This serializer is for displaying and creating Child accounts.
class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = ['id', 'instagram_user_id', 'username', 'access_token', 'consent_given']
        # These fields are read-only because they are set by the Instagram API, not the parent.
        read_only_fields = ['id', 'instagram_user_id', 'access_token']

# This serializer is for handling new parent signups.
class ParentSignupSerializer(serializers.ModelSerializer):
    # We make the password write-only so it's not sent back in API responses.
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # These are the fields the frontend will send for creating a new user.
        fields = ('username', 'email', 'password')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # We use Django's built-in `create_user` method which correctly handles
        # password hashing and other user setup.
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# This is a new serializer you will need for the dashboard to work.
# It will be used to send comment data to the frontend.
class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__' # This will include all fields from your Comment model.