import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf

# Find a sample image
benign_dir = 'data/train/Benign'
if not os.path.exists(benign_dir):
    print("Data directory not found. Please ensure HAM10000 is downloaded.")
    exit()

sample_image_path = os.path.join(benign_dir, os.listdir(benign_dir)[0])

# 1. Original Image
original_img = cv2.imread(sample_image_path)
original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
original_img = cv2.resize(original_img, (224, 224))

# 2. Noise Removal (Median Blurring to remove hair/artifacts common in dermatoscopy)
# We simulate a common noise reduction technique used in skin cancer detection
denoised_img = cv2.medianBlur(original_img, 5)

# 3. Data Augmentation (Using TF as in train.py)
# Convert to tensor and add batch dimension
tensor_img = tf.expand_dims(tf.convert_to_tensor(denoised_img, dtype=tf.float32), 0)

# Define the augmentation pipeline from train.py
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.2),
    tf.keras.layers.RandomContrast(0.1),
])

augmented_img_tensor = data_augmentation(tensor_img, training=True)
augmented_img = augmented_img_tensor[0].numpy().astype(np.uint8)

# 4. Data Preprocessing (Normalization for MobileNetV2: scaling to [-1, 1])
# We will just show the normalized values converted back to [0, 1] for visualization
preprocessed_img_tensor = tf.keras.applications.mobilenet_v2.preprocess_input(tf.cast(augmented_img_tensor, tf.float32))
# To visualize [-1, 1], we scale back to [0, 1]
visual_preprocessed = ((preprocessed_img_tensor[0].numpy() + 1.0) / 2.0)

# Plotting the steps
fig, axs = plt.subplots(1, 4, figsize=(20, 5))
fig.suptitle('DermAI: Data Pipeline Visualized', fontsize=16)

axs[0].imshow(original_img)
axs[0].set_title('1. Original Data\n(Resized to 224x224)')
axs[0].axis('off')

axs[1].imshow(denoised_img)
axs[1].set_title('2. Noise Removal\n(Artifact & Hair Reduction)')
axs[1].axis('off')

axs[2].imshow(augmented_img)
axs[2].set_title('3. Data Augmentation\n(Flip, Rotate, Zoom, Contrast)')
axs[2].axis('off')

axs[3].imshow(visual_preprocessed)
axs[3].set_title('4. Preprocessing\n(MobileNetV2 Pixel Normalization)')
axs[3].axis('off')

plt.tight_layout()
plt.savefig('preprocessing_steps.png', dpi=300)
print("Successfully generated preprocessing_steps.png!")
