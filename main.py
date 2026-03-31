from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = FastAPI()

# Enable CORS for communication with the Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATH = 'skin_cancer_model.keras'

# Skin lesion classes (aligned with international archives like ISIC/HAM10000)
CLASSES = {
    0: "Melanocytic nevi (Benign)",
    1: "Melanoma (Malignant)",
    2: "Basal cell carcinoma (Malignant)",
    3: "Benign keratosis-like lesions",
    4: "Actinic keratoses",
    5: "Vascular lesions",
    6: "Dermatofibroma"
}

# Classes for our custom 2-class model
CUSTOM_CLASSES = {
    0: "Benign Lesion",
    1: "Malignant Lesion"
}

# Disable GPU to avoid tf2xla conversion errors and multi-model resource conflicts
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices=false'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Load the custom model
if os.path.exists(MODEL_PATH):
    print(f"Loading custom trained model from {MODEL_PATH}...")
    try:
        # Pass custom_objects to handle the Lambda layer with preprocess_input
        model = tf.keras.models.load_model(
            MODEL_PATH, 
            custom_objects={'preprocess_input': tf.keras.applications.mobilenet_v2.preprocess_input}
        )
        IS_CUSTOM_MODEL = True
        print("Custom model loaded successfully.")
    except Exception as e:
        print(f"Error loading custom model: {e}")
        print("Falling back to placeholder model...")
        model = tf.keras.applications.MobileNetV2(weights='imagenet')
        IS_CUSTOM_MODEL = False
else:
    # This case was missing in the previous partial edit, unified it
    print("Custom model not found. Loading placeholder MobileNetV2 (ImageNet weights)...")
    model = tf.keras.applications.MobileNetV2(weights='imagenet')
    IS_CUSTOM_MODEL = False

# Load relevancy model (Standard MobileNetV2 with ImageNet weights)
# We load it on CPU to avoid conflicts with the custom model's GPU/XLA usage
print("Loading relevancy model (ImageNet on CPU)...")
with tf.device('/CPU:0'):
    relevancy_model = tf.keras.applications.MobileNetV2(weights='imagenet')

# Distractor labels/categories to exclude
IRRELEVANT_KEYWORDS = [
    'dog', 'cat', 'bird', 'car', 'truck', 'bicycle', 'furniture', 'food', 
    'fruit', 'mountain', 'lake', 'building', 'street', 'person', 'people',
    'toy', 'electric_fan', 'digital_clock', 'coffee_mug', 'reflex_camera',
    'envelope', 'web_site', 'scoreboard', 'crossword_puzzle', 'book_jacket',
    'screen', 'monitor', 'desktop_computer', 'cellular_telephone',
    'comic_book', 'menu', 'receipt', 'ticket', 'packet', 'carton', 'box',
    'cash_machine', 'typewriter', 'keyboard', 'mouse', 'television', 'tv',
    'laptop', 'computer', 'notebook', 'binder', 'file', 'paper_towel',
    'toilet_tissue', 'wallet', 'purse', 'bag', 'backpack', 'handbag',
    'shirt', 'pants', 'shoe', 'hat', 'glasses', 'sunglasses', 'watch',
    'identity', 'card', 'passport', 'license', 'paper', 'document', 'text',
    'poster', 'banner', 'sign', 'board', 'advertisement', 'label', 'mail'
]

def check_relevancy(image_tensor):
    try:
        with tf.device('/CPU:0'):
            # Preprocess specifically for the ImageNet model (expects [-1, 1])
            preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(tf.identity(image_tensor))
            # Use model() instead of model.predict() to be more stable
            preds = relevancy_model(preprocessed, training=False)
            decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds.numpy(), top=5)[0]
        
        # If the top prediction is a very confident non-medical object, mark as unrelated
        top_label = decoded[0][1].lower()
        top_conf = float(decoded[0][2])
        
        print(f"DEBUG: ImageNet top prediction: {top_label} ({top_conf:.4f})")
        
        # Check if any of the top 5 predictions contain irrelevant keywords
        for label_id, label_name, label_conf in decoded:
            label_name = label_name.lower()
            if any(kw in label_name for kw in IRRELEVANT_KEYWORDS) and label_conf > 0.05:
                # 0.05 threshold makes it highly aggressive against ID cards / screenshots
                return False, label_name
                
        return True, top_label
    except Exception as e:
        print(f"ERROR in relevancy check: {e}")
        # If check fails, we default to True to not block the user, but log the error
        return True, "error"

def preprocess_image(image_data):
    # Ensure image is in RGB format (handles grayscale and alpha channels)
    img = Image.open(io.BytesIO(image_data)).convert('RGB')
    img = img.resize((224, 224))
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)
    return img_array # No longer calling preprocess_input manually

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    processed_image = preprocess_image(contents)
    
    # Check relevancy first
    is_related, detected_label = check_relevancy(processed_image)
    
    if not is_related:
        print(f"REJECTED: Image deemed unrelated ({detected_label})")
        return {
            "class": "Unrelated Image",
            "confidence": 0.0,
            "is_cancerous": False,
            "is_related": False,
            "detected_object": detected_label,
            "error": "This image is not related to skin lesion analysis."
        }

    predictions = model.predict(processed_image)
    print(f"DEBUG: Raw predictions: {predictions[0]}")
    
    if IS_CUSTOM_MODEL:
        # Our custom model has 2 classes: 0: Benign, 1: Malignant
        # Convert numpy types to Python native types for JSON serialization
        class_idx = int(np.argmax(predictions[0]))
        result_class = CUSTOM_CLASSES.get(class_idx, "Unknown")
        confidence = float(predictions[0][class_idx])
        # In medical triage, we lower the threshold for malignancy to ensure higher sensitivity
        # Even if 'Benign' is the max class, if 'Malignant' has > 0.4 probability, we flag it.
        malignant_prob = float(predictions[0][1])
        is_cancerous = bool(malignant_prob > 0.4)
        
        # Override result_class if sensitivity threshold is met
        if is_cancerous and class_idx == 0:
            result_label = "Malignant Lesion (Potential Concern)"
        else:
            result_label = CUSTOM_CLASSES.get(class_idx, "Unknown")
        
        label = result_label
        
        print(f"DEBUG: Selected Class: {class_idx} ({result_class}), Confidence: {confidence:.4f}")
    else:
        # MOCK RESULT for demonstration with non-fine-tuned model
        prediction_top = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=1)[0][0]
        label = str(prediction_top[1])
        confidence = float(prediction_top[2])
        is_cancerous = bool("malignant" in label.lower() or confidence > 0.8)
        result_class = CLASSES[1] if is_cancerous else CLASSES[0]
    
    return {
        "class": label,
        "confidence": confidence,
        "is_cancerous": is_cancerous,
        "is_related": True,
        "raw_label": label,
        "model_type": "custom" if IS_CUSTOM_MODEL else "placeholder"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
