import tensorflow as tf
from PIL import Image
import numpy as np
import io
import requests

url = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/PAN_Card.png/640px-PAN_Card.png"
response = requests.get(url)
img = Image.open(io.BytesIO(response.content)).convert('RGB')
img = img.resize((224, 224))
img_array = tf.keras.preprocessing.image.img_to_array(img)
img_array = tf.expand_dims(img_array, 0)
preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)

model = tf.keras.applications.MobileNetV2(weights='imagenet')
preds = model.predict(preprocessed)
decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=10)[0]
for _, label, conf in decoded:
    print(f"{label}: {conf:.4f}")
