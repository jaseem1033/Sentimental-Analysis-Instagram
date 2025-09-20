from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics, status
from django.contrib.auth.models import User
from .models import Comment, Child, InstagramChild
from .serializers import ParentSignupSerializer, ChildSerializer
from .utils import classify_comment


class ParentSignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = ParentSignupSerializer


class ChildListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChildSerializer

    def get_queryset(self):
        return Child.objects.filter(parent=self.request.user)

    def perform_create(self, serializer):
        """
        Frontend sends only `username` initially.
        If that username exists in InstagramChild, link it directly.
        Otherwise, leave instagram_user_id & access_token blank.
        """
        child_username = serializer.validated_data['username']

        try:
            insta_child = InstagramChild.objects.get(username=child_username)
            serializer.save(
                parent=self.request.user,
                instagram_user_id=insta_child.instagram_user_id,
                access_token=insta_child.access_token
            )
        except InstagramChild.DoesNotExist:
            serializer.save(parent=self.request.user)  # Blank ID & token


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_child_login(request):
    """
    If `username` exists in InstagramChild, copy the instagram_user_id
    and access_token to the Child model for this parent.
    """
    username = request.data.get("username")
    if not username:
        return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        insta_child = InstagramChild.objects.get(username=username)
    except InstagramChild.DoesNotExist:
        return Response({"error": "Child not found in InstagramChild list"}, status=status.HTTP_404_NOT_FOUND)

    child, created = Child.objects.get_or_create(
        parent=request.user,
        username=username,
        defaults={
            "instagram_user_id": insta_child.instagram_user_id,
            "access_token": insta_child.access_token
        }
    )

    if not created:
        child.instagram_user_id = insta_child.instagram_user_id
        child.access_token = insta_child.access_token
        child.save()

    return Response({
        "message": "Child verified and saved successfully",
        "child_id": child.id,
        "username": child.username,
        "instagram_user_id": child.instagram_user_id
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_child(request, child_id):
    """
    Delete a child. Related comments will be automatically removed
    due to `on_delete=models.CASCADE` in Comment model.
    """
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({"error": "Child not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)

    child.delete()
    return Response({"message": "Child and related comments deleted successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_comments_classification(request):
    """
    Reclassify all comments using latest sentiment analysis.
    """
    comments = Comment.objects.all()
    updated_count = 0

    for comment in comments:
        sentiment = classify_comment(comment.text)
        if comment.sentiment != sentiment:
            comment.sentiment = sentiment
            comment.save()
            updated_count += 1

    return Response({"message": f"Updated sentiment for {updated_count} comments"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_toxic_comments(request):
    """
    Get all comments with sentiment='toxic'.
    """
    toxic_comments = Comment.objects.filter(sentiment='toxic')
    data = [{
        "comment_id": c.comment_id,
        "post_id": c.post_id,
        "username": c.username,
        "text": c.text,
        "sentiment": c.sentiment,
        "created_at": c.created_at
    } for c in toxic_comments]
    return Response(data)
