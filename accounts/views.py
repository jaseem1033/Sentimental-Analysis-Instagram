from rest_framework.views import APIView
from django.conf import settings
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
# --- Instagram OAuth Login View ---
class InstagramOAuthLoginView(APIView):
    """
    Accepts Instagram OAuth code, exchanges for access token, creates child for authenticated user.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("Instagram OAuth endpoint called with code:", request.data.get('code'))
        import logging
        logger = logging.getLogger("instagram_oauth")
        code = request.data.get('code')
        username = request.data.get('username')  # Instagram username from frontend
        logger.info(f"Received OAuth code: {code}, username: {username}")
        if not code:
            logger.error("Missing code in request")
            return Response({'error': 'Missing code'}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange code for access token with Instagram
        client_id = getattr(settings, 'INSTAGRAM_CLIENT_ID', None)
        client_secret = getattr(settings, 'INSTAGRAM_CLIENT_SECRET', None)
        redirect_uri = getattr(settings, 'INSTAGRAM_REDIRECT_URI', None)
        logger.info(f"Using client_id={client_id}, redirect_uri={redirect_uri}")
        if not all([client_id, client_secret, redirect_uri]):
            logger.error("Instagram app credentials not configured")
            return Response({'error': 'Instagram app credentials not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        token_url = 'https://api.instagram.com/oauth/access_token'
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'code': code,
        }
        logger.info(f"Posting to Instagram token endpoint: {token_url} with data: {data}")
        try:
            resp = requests.post(token_url, data=data)
            logger.info(f"Instagram response status: {resp.status_code}, body: {resp.text}")
            resp.raise_for_status()
            token_data = resp.json()
        except Exception as e:
            logger.error(f"Failed to exchange code with Instagram: {e}")
            return Response({'error': 'Failed to exchange code with Instagram', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        access_token = token_data.get('access_token')
        user_id = token_data.get('user_id')
        logger.info(f"Instagram token_data: {token_data}")
        if not access_token or not user_id:
            logger.error("Invalid token response from Instagram")
            return Response({'error': 'Invalid token response from Instagram'}, status=status.HTTP_400_BAD_REQUEST)

        # Use the username provided by the frontend, or try to get it from Instagram API
        if username:
            instagram_username = username
            logger.info(f"Using username from frontend: {instagram_username}")
        else:
            # Fallback: try to get username from Instagram API
            user_info_url = f'https://graph.instagram.com/{user_id}?fields=username&access_token={access_token}'
            try:
                user_info_resp = requests.get(user_info_url)
                user_info_resp.raise_for_status()
                user_info = user_info_resp.json()
                instagram_username = user_info.get('username', f'user_{user_id}')
                logger.info(f"Successfully retrieved Instagram username from API: {instagram_username}")
            except Exception as e:
                logger.error(f"Failed to get Instagram user info: {e}")
                instagram_username = f'instagram_user_{user_id}'
                logger.info(f"Using fallback Instagram username: {instagram_username}")

        # Check if this Instagram account exists in our pre-populated database
        from .models import InstagramChild
        try:
            pre_populated_account = InstagramChild.objects.get(username=instagram_username)
            logger.info(f"Found pre-populated account for {instagram_username}")
            
            # Use the pre-populated credentials instead of OAuth credentials
            instagram_user_id = pre_populated_account.instagram_user_id
            access_token = pre_populated_account.access_token
            
            logger.info(f"Using pre-populated credentials: ID={instagram_user_id}, Token={'Yes' if access_token else 'No'}")
            
        except InstagramChild.DoesNotExist:
            logger.error(f"No pre-populated account found for username: {instagram_username}")
            return Response({
                'error': 'Account not configured for monitoring',
                'message': f'The Instagram account "{instagram_username}" is not configured for monitoring. Please contact support.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get the authenticated user (passed from the frontend)
        user = request.user
        logger.info(f"Using authenticated user: {user.username}")

        # Create child account using pre-populated credentials
        from .models import Child
        try:
            # Check if this child already exists for this specific parent
            child = Child.objects.get(username=instagram_username, parent=user)
            # Update existing child with pre-populated credentials (but keep same parent)
            child.instagram_user_id = instagram_user_id
            child.access_token = access_token
            child.save()
            child_created = False
            logger.info(f"Updated existing child with pre-populated credentials for same parent")
        except Child.DoesNotExist:
            # Create new child with pre-populated credentials for this parent
            # Multiple parents can have the same child account
            child = Child.objects.create(
                parent=user,
                username=instagram_username,
                instagram_user_id=instagram_user_id,
                access_token=access_token
            )
            child_created = True
            logger.info(f"Created new child with pre-populated credentials for parent {user.username}")

        logger.info(f"Child {'created' if child_created else 'updated'}: {instagram_username}")

        # Generate new JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        logger.info(f"Issued JWT tokens for user {user.username}")

        # Return data in the format expected by frontend
        return Response({
            'access': access, 
            'refresh': str(refresh),
            'child': {
                'id': child.id,
                'username': child.username,
                'instagram_user_id': child.instagram_user_id,
                'created_at': child.created_at.isoformat() if hasattr(child, 'created_at') else None
            },
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
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
    Delete a child and only the comments linked to that specific child.
    Other parents with the same child account will keep their comments.
    """
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
        username = child.username
        
        # Count comments linked to this specific child only
        comments_for_this_child = Comment.objects.filter(child=child).count()
        
        # Delete only comments linked to this specific child
        Comment.objects.filter(child=child).delete()
        
        # Delete the child
        child.delete()
        
        return Response({
            "message": f"Child and {comments_for_this_child} comments for this parent deleted successfully. Other parents with the same child account are unaffected."
        })
            
    except Child.DoesNotExist:
        return Response({"error": "Child not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)


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

# --- Custom Login View ---
class CustomLoginView(APIView):
    """
    Custom login view that returns both tokens and user data
    """
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        
        return Response({
            'tokens': {
                'access': access,
                'refresh': str(refresh)
            },
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })


# --- Comments API Views ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_comments(request, child_id):
    """
    Get all comments for a specific child account.
    Returns unique comments based on comment_id to avoid duplicates from multiple parents.
    """
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
        
        # Get all comments for this username and deduplicate by comment_id
        all_comments = Comment.objects.filter(
            child__username=child.username
        ).values(
            'comment_id', 'text', 'sentiment', 'created_at', 'username', 'post_id'
        ).order_by('-created_at')
        
        # Deduplicate by comment_id using Python
        seen_comment_ids = set()
        unique_comments = []
        for comment in all_comments:
            if comment['comment_id'] not in seen_comment_ids:
                seen_comment_ids.add(comment['comment_id'])
                unique_comments.append(comment)
        
        # Serialize comments data
        comments_data = []
        for comment in unique_comments:
            comments_data.append({
                'id': comment['comment_id'],  # Use comment_id as unique identifier
                'text': comment['text'],
                'sentiment': comment['sentiment'],
                'confidence': 0.85,  # Placeholder - you can add confidence field to model later
                'created_at': comment['created_at'].isoformat(),
                'instagram_id': comment['comment_id'],
                'username': comment['username'],
                'post_id': comment['post_id']
            })
        
        return Response(comments_data)
    
    except Child.DoesNotExist:
        return Response({'error': 'Child not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_child_comments(request, child_id):
    """
    Trigger fetching new comments for a specific child account.
    Fetches comments for the first child with this username to avoid duplicates.
    """
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
        
        # Use the services.py function to fetch comments for this specific child
        from .services import fetch_comments_for_child
        
        result = fetch_comments_for_child(child)
        
        if "error" in result:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get updated comments for this specific child only
        comments = Comment.objects.filter(child=child).order_by('-created_at')
        
        # Serialize comments data
        comments_data = []
        for comment in comments:
            comments_data.append({
                'id': comment.id,
                'text': comment.text,
                'sentiment': comment.sentiment,
                'confidence': 0.85,  # Placeholder
                'created_at': comment.created_at.isoformat(),
                'instagram_id': comment.comment_id,
                'username': comment.username,
                'post_id': comment.post_id
            })
        
        return Response({
            'message': f'Comments fetched successfully. {result.get("new_comments", 0)} new comments added.',
            'comments': comments_data
        })
    
    except Child.DoesNotExist:
        return Response({'error': 'Child not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_all_children_comments(request):
    """
    Fetch comments for all children of the authenticated parent.
    Used for real-time updates.
    """
    try:
        user = request.user
        children = Child.objects.filter(parent=user)
        
        if not children.exists():
            return Response({
                'message': 'No children found for this parent',
                'total_new_comments': 0,
                'children_updated': 0
            })
        
        total_new_comments = 0
        children_updated = 0
        results = []
        
        for child in children:
            try:
                # Use the services.py function to fetch comments for this specific child
                from .services import fetch_comments_for_child
                
                result = fetch_comments_for_child(child)
                
                if "error" not in result:
                    new_comments = result.get("new_comments", 0)
                    total_new_comments += new_comments
                    children_updated += 1
                    
                    results.append({
                        'child_id': child.id,
                        'username': child.username,
                        'new_comments': new_comments,
                        'status': 'success'
                    })
                else:
                    results.append({
                        'child_id': child.id,
                        'username': child.username,
                        'new_comments': 0,
                        'status': 'error',
                        'error': result['error']
                    })
                    
            except Exception as e:
                results.append({
                    'child_id': child.id,
                    'username': child.username,
                    'new_comments': 0,
                    'status': 'error',
                    'error': str(e)
                })
        
        return Response({
            'message': f'Updated {children_updated} children, {total_new_comments} new comments total',
            'total_new_comments': total_new_comments,
            'children_updated': children_updated,
            'results': results
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
