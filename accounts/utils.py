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
