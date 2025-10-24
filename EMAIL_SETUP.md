# Email Setup Guide for Toxic Comment Alerts

## Overview
This system sends email alerts to parents when toxic comments are detected on their children's Instagram accounts.

## Setup Instructions

### 1. Gmail Configuration (Free)

1. **Create a Gmail account** (if you don't have one)
2. **Enable 2-Factor Authentication** on your Gmail account
3. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

### 2. Update Django Settings

Edit `sentiment_project/settings.py` and replace the email configuration:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-actual-email@gmail.com'  # Your Gmail
EMAIL_HOST_PASSWORD = 'your-16-char-app-password'  # App password from step 1
DEFAULT_FROM_EMAIL = 'your-actual-email@gmail.com'  # Your Gmail
```

### 3. Test Email Functionality

Run the test command:
```bash
python manage.py test_email --email your-email@gmail.com
```

## Features

### ✅ **Automatic Alerts**
- Sends email immediately when toxic comments are detected
- Includes comment details, timestamp, and commenter info
- Provides actionable recommendations for parents

### ✅ **Professional Email Template**
- HTML formatted emails with clear formatting
- Toxic comment details in highlighted box
- Direct link to child's dashboard
- Recommended actions for parents

### ✅ **Smart Detection**
- Only sends alerts for NEW toxic comments
- Avoids duplicate alerts for existing comments
- Works with real-time comment monitoring

## Email Content

Each alert includes:
- **Child's Instagram username**
- **Comment text and author**
- **Detection timestamp**
- **Direct dashboard link**
- **Recommended parent actions**

## Cost
- **FREE** - Uses Gmail SMTP (no additional costs)
- **No limits** - Gmail allows 500 emails/day for free accounts
- **Reliable** - Gmail's infrastructure ensures delivery

## Troubleshooting

### Common Issues:
1. **"Authentication failed"** - Check your app password
2. **"Connection refused"** - Check internet connection
3. **"Email not received"** - Check spam folder

### Debug Steps:
1. Test with: `python manage.py test_email --email your-email@gmail.com`
2. Check Django logs for error messages
3. Verify Gmail app password is correct
4. Ensure 2FA is enabled on Gmail account
