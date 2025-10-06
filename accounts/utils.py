# def classify_comment(text):
#     """
#     Returns a single sentiment category:
#     'positive', 'neutral', 'negative', or 'toxic'
#     """
#     text_lower = text.lower()

#     toxic_keywords = ["awful", "hate", "stupid", "idiot", "trash", "bad", "horrible"]
#     positive_keywords = ["good", "great", "awesome", "love", "fantastic", "amazing"]
#     negative_keywords = ["sad", "disappointed", "poor", "unhappy"]

#     # Basic keyword-based classification (replace with ML model if needed)
#     if any(word in text_lower for word in toxic_keywords):
#         return "toxic"
#     elif any(word in text_lower for word in positive_keywords):
#         return "positive"
#     elif any(word in text_lower for word in negative_keywords):
#         return "negative"
#     else:
#         return "neutral"

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load sentiment model
sentiment_tokenizer = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment-latest")
sentiment_model = AutoModelForSequenceClassification.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment-latest")

# Load toxicity model
toxicity_tokenizer = AutoTokenizer.from_pretrained("unitary/toxic-bert")
toxicity_model = AutoModelForSequenceClassification.from_pretrained("unitary/toxic-bert")

# Map sentiment IDs to labels
sentiment_labels = ["negative", "neutral", "positive"]

def classify_comment(text):
    # 0️⃣ Pre-check for obvious cases (fallback for AI model limitations)
    text_lower = text.lower().strip()
    
    # Handle negations properly
    negation_words = ["not", "no", "never", "n't", "isn't", "don't", "won't", "can't", "shouldn't"]
    has_negation = any(neg in text_lower for neg in negation_words)
    
    # Obvious negative words
    obvious_negative = ["bad", "terrible", "awful", "horrible", "worst", "hate", "dislike"]
    negative_words_found = [word for word in obvious_negative if word in text_lower]
    
    # Obvious positive words  
    obvious_positive = ["good", "great", "awesome", "amazing", "fantastic", "love", "excellent"]
    positive_words_found = [word for word in obvious_positive if word in text_lower]
    
    # Handle negations: if negation + positive word = negative, if negation + negative word = positive
    if has_negation:
        if negative_words_found and not positive_words_found:
            return "positive"  # "not bad" = positive
        elif positive_words_found and not negative_words_found:
            return "negative"  # "not good" = negative
        elif negative_words_found and positive_words_found:
            # Mixed case, let AI decide
            pass
        else:
            # Just negation without clear sentiment words, let AI decide
            pass
    else:
        # No negation, use simple logic
        if negative_words_found and not positive_words_found:
            return "negative"
        elif positive_words_found and not negative_words_found:
            return "positive"
    
    # 1️⃣ Check toxicity first
    tox_inputs = toxicity_tokenizer(text, return_tensors="pt", truncation=True)
    tox_outputs = toxicity_model(**tox_inputs)
    tox_score = torch.sigmoid(tox_outputs.logits)[0][0].item()

    if tox_score > 0.5:  # Threshold for toxic
        return "toxic"

    # 2️⃣ If not toxic, classify sentiment
    sent_inputs = sentiment_tokenizer(text, return_tensors="pt", truncation=True)
    sent_outputs = sentiment_model(**sent_inputs)
    sent_label_id = torch.argmax(sent_outputs.logits, dim=1).item()

    return sentiment_labels[sent_label_id]
