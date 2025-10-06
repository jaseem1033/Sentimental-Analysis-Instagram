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
    
    try:
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code != 200:
            return {"error": f"API Error {resp.status_code}: {resp.text}"}

        data = resp.json()

        if "data" not in data:
            return {"error": "No media found"}

        new_comments_count = 0
        total_comments_processed = 0

        for media in data["data"]:
            if "comments" in media:
                for comment in media["comments"]["data"]:
                    total_comments_processed += 1
                    # Check if comment exists for this specific child
                    if not Comment.objects.filter(comment_id=comment["id"], child=child).exists():
                        sentiment = classify_comment(comment["text"])
                        Comment.objects.create(
                            child=child,
                            comment_id=comment["id"],
                            post_id=media["id"],
                            text=comment["text"],
                            username=comment["username"],
                            sentiment=sentiment
                        )
                        new_comments_count += 1

        return {
            "success": True, 
            "new_comments": new_comments_count,
            "total_comments_processed": total_comments_processed,
            "message": f"Processed {total_comments_processed} comments, added {new_comments_count} new ones"
        }
        
    except requests.exceptions.Timeout:
        return {"error": "Request timeout - Instagram API might be slow"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
