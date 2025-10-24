from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.models import User
from .models import Comment, Child
import logging

logger = logging.getLogger(__name__)

def send_toxic_comment_alert(comment: Comment, child: Child, parent: User):
    """
    Send email alert to parent when a toxic comment is detected for their child.
    """
    try:
        subject = f"🚨 Toxic Comment Alert - {child.username}"
        
        # Create email context
        context = {
            'parent_name': parent.first_name or parent.username,
            'child_username': child.username,
            'comment_text': comment.text,
            'comment_username': comment.username,
            'comment_date': comment.created_at.strftime('%B %d, %Y at %I:%M %p'),
            'dashboard_url': f"{settings.FRONTEND_URL}/child/{child.id}" if hasattr(settings, 'FRONTEND_URL') else f"http://localhost:8080/child/{child.id}",
        }
        
        # Create HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                    🚨 Toxic Comment Alert
                </h2>
                
                <p>Dear {context['parent_name']},</p>
                
                <p>We've detected a potentially toxic comment on your child's Instagram account <strong>@{context['child_username']}</strong>.</p>
                
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #dc2626; margin-top: 0;">Toxic Comment Details:</h3>
                    <p><strong>Comment by:</strong> @{context['comment_username']}</p>
                    <p><strong>Date:</strong> {context['comment_date']}</p>
                    <p><strong>Comment:</strong></p>
                    <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; font-style: italic;">
                        "{context['comment_text']}"
                    </div>
                </div>
                
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #0369a1; margin-top: 0;">Recommended Actions:</h3>
                    <ul>
                        <li>Review the comment with your child</li>
                        <li>Discuss appropriate online behavior</li>
                        <li>Consider reporting the comment to Instagram if necessary</li>
                        <li>Monitor your child's account more closely</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{context['dashboard_url']}" 
                       style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View Full Dashboard
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #6b7280;">
                    This is an automated alert from SentimentGuard. 
                    Please review the comment and take appropriate action to protect your child.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        plain_message = f"""
        TOXIC COMMENT ALERT
        
        Dear {context['parent_name']},
        
        We've detected a potentially toxic comment on your child's Instagram account @{context['child_username']}.
        
        Comment Details:
        - Comment by: @{context['comment_username']}
        - Date: {context['comment_date']}
        - Comment: "{context['comment_text']}"
        
        Recommended Actions:
        - Review the comment with your child
        - Discuss appropriate online behavior
        - Consider reporting the comment to Instagram if necessary
        - Monitor your child's account more closely
        
        View your dashboard: {context['dashboard_url']}
        
        This is an automated alert from SentimentGuard.
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[parent.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Toxic comment alert sent to {parent.email} for child {child.username}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send toxic comment alert: {str(e)}")
        return False

def send_toxic_comment_summary(parent: User, toxic_comments: list):
    """
    Send a summary email if multiple toxic comments are detected.
    """
    try:
        if not toxic_comments:
            return False
            
        subject = f"🚨 Multiple Toxic Comments Detected - {len(toxic_comments)} alerts"
        
        # Group comments by child
        comments_by_child = {}
        for comment in toxic_comments:
            child_username = comment.child.username
            if child_username not in comments_by_child:
                comments_by_child[child_username] = []
            comments_by_child[child_username].append(comment)
        
        # Create summary content
        summary_content = ""
        for child_username, comments in comments_by_child.items():
            summary_content += f"\nChild: @{child_username} ({len(comments)} toxic comments)\n"
            for comment in comments[:3]:  # Show first 3 comments
                summary_content += f"  - @{comment.username}: \"{comment.text[:50]}...\"\n"
            if len(comments) > 3:
                summary_content += f"  ... and {len(comments) - 3} more comments\n"
        
        message = f"""
        MULTIPLE TOXIC COMMENTS ALERT
        
        Dear {parent.first_name or parent.username},
        
        We've detected {len(toxic_comments)} toxic comments across your children's accounts.
        
        Summary:
        {summary_content}
        
        Please review your dashboard and take appropriate action.
        
        This is an automated alert from SentimentGuard.
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[parent.email],
            fail_silently=False,
        )
        
        logger.info(f"Toxic comment summary sent to {parent.email} for {len(toxic_comments)} comments")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send toxic comment summary: {str(e)}")
        return False
