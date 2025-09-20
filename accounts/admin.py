from django.contrib import admin
from .models import Child, Comment, InstagramChild


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'instagram_user_id', 'parent', 'consent_given']
    search_fields = ('username', 'instagram_user_id', 'parent__username')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post_id', 'username', 'sentiment', 'created_at']
    search_fields = ('username', 'text')
    list_filter = ('sentiment', 'created_at')

admin.site.register(InstagramChild)