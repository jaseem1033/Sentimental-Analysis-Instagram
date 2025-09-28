from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ParentSignupView,
    ChildListCreateView,
    update_comments_classification,
    get_toxic_comments,
    delete_child,
    verify_child_login,
    InstagramOAuthLoginView,
    CustomLoginView
)

urlpatterns = [
    path('signup/', ParentSignupView.as_view(), name='parent-signup'),
    path('login/', CustomLoginView.as_view(), name='custom_login'),
    path('login/instagram/', InstagramOAuthLoginView.as_view(), name='instagram-oauth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('toxic-comments/', get_toxic_comments, name='toxic-comments'),
    path('children/', ChildListCreateView.as_view(), name='child-list-create'),
    path('children/<int:child_id>/delete/', delete_child, name='delete-child'),
    path('children/verify-login/', verify_child_login, name='verify-child-login'),
    path('comments/update-classification/', update_comments_classification, name='update-comments-classification'),
]
