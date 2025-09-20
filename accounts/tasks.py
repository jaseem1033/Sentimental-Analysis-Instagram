from celery import shared_task
from .services import fetch_comments_for_all_children

@shared_task
def fetch_comments_task():
    fetch_comments_for_all_children()
