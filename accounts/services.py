import requests
from .models import Child, Comment
from django.utils.dateparse import parse_datetime

def classify_comment(text):
    toxic_keywords = ["hate", "stupid", "idiot", "ugly", "dumb"]
    if any(word in text.lower() for word in toxic_keywords):
        return "toxic"
    return "neutral"

def fetch_comments_for_child(child: Child):
    """
    Fetches Instagram comments for a single child using stored insta_id and token.
    Avoids duplicates in DB and classifies comments before saving.
    """
    if not child.instagram_user_id or not child.access_token:
        return {"error": "Missing Instagram ID or access token"}

    url = f"https://graph.facebook.com/v23.0/{child.instagram_user_id}/media"
    params = {
        "fields": "id,caption,comments{id,text,username,timestamp}",
        "access_token": child.access_token
    }
    
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        return {"error": resp.text}

    data = resp.json()

    if "data" not in data:
        return {"error": "No media found"}

    new_comments_count = 0

    for media in data["data"]:
        if "comments" in media:
            for comment in media["comments"]["data"]:
                if not Comment.objects.filter(comment_id=comment["id"]).exists():
                    sentiment = classify_comment(comment["text"])
                    Comment.objects.create(
                        child=child,
                        comment_id=comment["id"],
                        post_id=media["id"],
                        text=comment["text"],
                        username=comment["username"],
                        timestamp=parse_datetime(comment["timestamp"]),
                        sentiment=sentiment
                    )
                    new_comments_count += 1

    return {"success": True, "new_comments": new_comments_count}
